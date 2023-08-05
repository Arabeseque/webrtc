const { hSet, hGetAll, hDel } = require('./redis')
const { getMsg, getParams } = require('./common')

const http = require('node:http')
const fs = require('node:fs')
const { log } = require('node:console')
const express = require('express')

const app = express()

// http server
app.use(express.static('./dist'))
app.use((req, res, next) => {
  res.sendfile('./dist/index.html') // 路径根据自己文件配置
})
const server = http.createServer(app)
// socket server
const io = require('socket.io')(server, { allowEIO3: true })

// 自定义命令空间  nginx代理 /mediaServerWsUrl { http://xxxx:18080/socket.io/ }
// io = io.of('mediaServerWsUrl')

server.listen(18080, async () => {
  console.log('服务器启动成功 *:18080')
})

io.on('connection', async (socket) => {
  await onListener(socket)
})

const userMap = new Map() // user - > socket
const roomKey = 'meeting-room::'

/**
 * DB data
 * @author suke
 * @param {Object} userId
 * @param {Object} roomId
 * @param {Object} nickname
 * @param {Object} pub
 */
async function getUserDetailByUid(userId, roomId, nickname, pub) {
  const res = JSON.stringify(({ userId, roomId, nickname, pub }))
  return res
}

/**
 * 监听
 * @param {Object} s
 */
async function onListener(s) {
  const url = s.client.request.url
  const userId = getParams(url, 'userId')
  const roomId = getParams(url, 'roomId')
  const nickname = getParams(url, 'nickname')
  const pub = getParams(url, 'pub')
  console.log(`client uid：${userId} roomId: ${roomId} 【${nickname}】online `)
  // user map
  userMap.set(userId, s)
  // room cache
  if (roomId) {
    await hSet(roomKey + roomId, userId, await getUserDetailByUid(userId, roomId, nickname, pub))
    console.log('roomId', roomId)
    // 进入就发送封装好的 join msg
    oneToRoomMany(roomId, getMsg('join', `${userId} join then room`, 200, { userId, nickname }))
  }

  // 监听 msg 和 数据对象
  s.on('msg', async (data) => {
		  console.log('msg', data)
		  await oneToRoomMany(roomId, data)
  })

  // 离开则发送封装好的 leave msg
  s.on('disconnect', () => {
		  console.log(`client uid：${userId} roomId: ${roomId} 【${nickname}】 offline `)
		  userMap.delete(userId)
		  if (roomId) {
			  hDel(roomKey + roomId, userId)
			  // msg leave
			  oneToRoomMany(roomId, getMsg('leave', `${userId} leave the room `, 200, { userId, nickname }))
		  }
  })

  s.on('roomUserList', async (data) => {
    s.emit('roomUserList', await getRoomOnlyUserList(data.roomId))
  })
  s.on('call', (data) => {
    const targetUid = data.targetUid
    console.log('call', targetUid)
    oneToOne(targetUid, getMsg('call', '远程呼叫', 200, data))
  })
  s.on('candidate', (data) => {
    const targetUid = data.targetUid
    oneToOne(targetUid, getMsg('candidate', 'ice candidate', 200, data))
  })
  s.on('offer', (data) => {
    const targetUid = data.targetUid
    oneToOne(targetUid, getMsg('offer', 'rtc offer', 200, data))
  })
  s.on('answer', (data) => {
    const targetUid = data.targetUid
    oneToOne(targetUid, getMsg('answer', 'rtc answer', 200, data))
  })
  s.on('applyMic', (data) => {
    const targetUid = data.targetUid
    oneToOne(targetUid, getMsg('applyMic', 'apply mic', 200, data))
  })
  s.on('acceptApplyMic', (data) => {
    const targetUid = data.targetUid
    oneToOne(targetUid, getMsg('acceptApplyMic', 'acceptApplyMic mic', 200, data))
  })
  s.on('refuseApplyMic', (data) => {
    const targetUid = data.targetUid
    oneToOne(targetUid, getMsg('refuseApplyMic', 'refuseApplyMic mic', 200, data))
  })
}

/**
 * ono to one
 * @author suke
 * @param {Object} uid
 * @param {Object} msg
 */
function oneToOne(uid, msg) {
  const s = userMap.get(uid)
  if (s)
    s.emit('msg', msg)

  else
    console.log(`${uid}用户不在线`, msg)
}

/**
 * 获取房间用户列表(k-v) 原始KV数据
 * @author suke
 * @param {Object} roomId
 */
async function getRoomUser(roomId) {
  return await hGetAll(roomKey + roomId)
}

/**
 * 获取房间用户列表(list)
 * @author suke
 * @param {Object} roomId
 */
async function getRoomOnlyUserList(roomId) {
  const resList = []
  const uMap = await hGetAll(roomKey + roomId)
  for (const key in uMap) {
    const detail = JSON.parse(uMap[key])
    resList.push(detail)
  }
  return resList
}

/**
 * broadcast
 * @author suc
 * @param {Object} roomId
 * @param {Object} msg
 */
async function oneToRoomMany(roomId, msg) {
  const uMap = await getRoomUser(roomId)
  for (const uid in uMap)
	  oneToOne(uid, msg)
}
