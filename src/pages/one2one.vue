<script setup lang="ts" generic="T extends any, O extends any">
import type { Socket as ClientSocket } from 'socket.io-client'
import { io } from 'socket.io-client'
import { reactive } from 'vue'

const { log } = console

// 定义用户信息接口
interface UserInfo {
  userId: string
  roomId: string
  nickname: string
}

// 定义 rtcPcParams 的类型
interface RtcPcParams {
  iceServers: { urls: string }[]
  // 在这里可以定义其他 iceServers 之外的属性
}

// 定义表单的类型
interface FormInline {
  rtcmessage: string | undefined
  rtcmessageRes: string | undefined
  // 在这里可以定义其他表单属性
}

// 定义整体的数据类型
interface AppData {
  linkSocket: ClientSocket | undefined
  rtcPcParams: RtcPcParams
  roomUserList: UserInfo[]
  userInfo: UserInfo
  formInline: FormInline
  localRtcPc: RTCPeerConnection | undefined
  rtcmessage: string | undefined
  mapSender: any[]
  channel: RTCDataChannel | undefined
}

// 使用 reactive 函数创建响应式数据
const data = reactive<AppData>({
  linkSocket: undefined,
  rtcPcParams: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  },
  roomUserList: [],
  userInfo: {
    userId: '',
    roomId: '',
    nickname: '',
  },
  formInline: {
    rtcmessage: undefined,
    rtcmessageRes: undefined,
  },
  localRtcPc: undefined,
  rtcmessage: undefined,
  mapSender: [],
  channel: undefined,
})

function init(userId: string, roomId: string, nickname: string) {
  log('init', userId, roomId, nickname)
  data.userInfo = {
    userId,
    roomId,
    nickname,
  }
  data.linkSocket = io('http://localhost:18080', {
    reconnectionDelayMax: 10000,
    transports: ['websocket'],
    query: {
      userId,
      roomId,
      nickname,
    },
  })

  data.linkSocket.on('connect', () => {
    log('connect')
  })

  data.linkSocket.on('disconnect', () => {
    log('disconnect')
  })

  data.linkSocket.on('roomUserList', (roomUserList: UserInfo[]) => {
    log('roomUserList', roomUserList)
    data.roomUserList = roomUserList
  })

  data.linkSocket.on('msg', async (e) => {
    log('msg', e)
    // 有用户加入/离开就重新获取用户列表
    if (e.type === 'join' || e.type === 'leave') {
      setTimeout(() => {
        const params = {
          roomId: data.userInfo.roomId,
        }
        data.linkSocket?.emit('roomUserList', params)
      }, 1000)
    }
    else if (e.type === 'call') {
      log('call', e)
      await onCall(e)
    }
    else if (e.type === 'answer') {
      log('answer', e)
      await onRemoteAnswer(e.data.userId, e.data.answer)
    }
    else if (e.type === 'candidate') {
      // 在WebRTC中，当两个对等端建立连接时，它们需要交换ICE候选项以确定最佳的网络路径。
      data.localRtcPc?.addIceCandidate(e.data.candidate)
    }
    else if (e.type === 'offer') {
      log('offer', e)
      await onRemoteOffer(e.data.userId, e.data.offer)
    }
  })

  data.linkSocket.on('error', (e) => {
    log('error', e)
  })
}

async function onRemoteAnswer(fromUid: string, answer: RTCSessionDescriptionInit) {
  log('onRemoteAnswer', fromUid, answer)
  await data.localRtcPc?.setRemoteDescription(answer)
}

async function onRemoteOffer(fromUid: string, offer: RTCSessionDescriptionInit) {
  log('onRemoteOffer', fromUid, offer)
  await data.localRtcPc?.setRemoteDescription(offer)
  log(data.localRtcPc)
  const answer = await data.localRtcPc?.createAnswer()
  await data.localRtcPc?.setLocalDescription(answer)
  const params = {
    targetUid: fromUid,
    userId: data.userInfo.userId,
    answer,
  }
  data.linkSocket?.emit('answer', params)
}

async function onCall(e: any) {
  log('onCall', e)
  await initCalleeInfo(e.userId, e.targetUid)
  const params = {
    targetUid: e.userId,
    userId: data.userInfo.userId,
  }
  data.linkSocket?.emit('answer', params)
}

async function initCalleeInfo(userId: string, targetUid: string) {
  log('initCalleeInfo', userId, targetUid)

  // 初始化 PC
  data.localRtcPc = new RTCPeerConnection()

  data.mapSender = []
  const localStream = await getLocalUserMedia({
    audio: true,
    video: true,
  })

  if (localStream) {
    for (const track of localStream.getTracks()) {
      const sender = data.localRtcPc.addTrack(track)
      data.mapSender.push(sender)
    }
  }

  if (localStream)
    await setDomVideoStream('localdemo01', localStream)

  onPcEvent(data.localRtcPc, userId, targetUid)
}
async function call(item: UserInfo) {
  log('call', item)

  initCallerInfo(data.userInfo.userId, item.userId)

  const params = {
    targetUid: item.userId,
    userId: data.userInfo.userId,
  }
  data.linkSocket?.emit('call', params)
}

async function initCallerInfo(userId: string, targetUid: string) {
  log('initCallerInfo', userId, targetUid)

  // 初始化 PC
  data.localRtcPc = new RTCPeerConnection()
  data.mapSender = []
  const localStream = await getLocalUserMedia({
    audio: true,
    video: true,
  })
  if (localStream) {
    for (const track of localStream.getTracks()) {
      const sender = data.localRtcPc.addTrack(track)
      data.mapSender.push(sender)
    }
  }

  // 本地dom渲染
  if (localStream)
    await setDomVideoStream('localdemo01', localStream)
  // 监听回调
  onPcEvent(data.localRtcPc, userId, targetUid)
  const offer = await data.localRtcPc.createOffer()
  await data.localRtcPc.setLocalDescription(offer)
  const params = {
    targetUid,
    userId,
    offer,
  }
  data.linkSocket?.emit('offer', params)
}

function onPcEvent(pc: RTCPeerConnection, userId: string, targetUid: string) {
  log('onPcEvent', pc, userId, targetUid)

  data.channel = pc.createDataChannel('channel')

  pc.onicecandidate = (e) => {
    log('onicecandidate', e)
    if (e.candidate) {
      const params = {
        targetUid,
        userId,
        candidate: e.candidate,
      }
      data.linkSocket?.emit('candidate', params)
    }
    else {
      log('在此次协商中，没有更多的候选了')
    }
  }

  pc.onnegotiationneeded = function (e) {
    log('重新协商', e)
  }

  pc.ontrack = (e) => {
    log('ontrack', e)
    setRemoteDomVideoStream('remotedemo01', e.track)
  }

  pc.ondatachannel = (e) => {
    log('ondatachannel', e)
    data.channel = e.channel
    data.channel.onmessage = (e) => {
      log('onmessage', e)
      data.formInline.rtcmessageRes = e.data
    }
  }
}

// utils
function getParams(queryName: string) {
  const url = window.location.href
  const params = url.split('?')[1]
  if (params) {
    const paramsArr = params.split('&')
    for (let i = 0; i < paramsArr.length; i++) {
      const name = paramsArr[i].split('=')[0]
      const value = paramsArr[i].split('=')[1]
      if (name === queryName)
        return value
    }
  }
  return null
}

function handleError(error: any) {
  // alert("摄像头无法正常使用，请检查是否占用或缺失")
  console.error('navigator.MediaDevices.getUserMedia error: ', error.message, error.name)
}

async function getLocalUserMedia(constraints: MediaStreamConstraints) {
  return await navigator.mediaDevices.getUserMedia(constraints).catch(handleError)
}

async function setDomVideoStream(domId: string, newStream: MediaStream) {
  const dom = document.getElementById(domId) as HTMLVideoElement
  const stream = dom.srcObject as MediaStream
  if (stream) {
    const tracks = stream.getTracks()
    for (const track of tracks)
      track.stop()
  }
  dom.srcObject = newStream
  dom.muted = true
}

async function setRemoteDomVideoStream(domId: string, remoteSteam: MediaStreamTrack) {
  const dom = document.getElementById(domId) as HTMLVideoElement
  const stream = dom.srcObject as MediaStream
  if (stream) {
    stream.addTrack(remoteSteam)
  }
  else {
    const newStream = new MediaStream()
    newStream.addTrack(remoteSteam)
    dom.srcObject = newStream
    dom.muted = true
  }
}

function sendMessageUserRtcChannel() {
  if (!data.channel)
    log('data.channel is null')
  if (data.channel)
    data.channel.send(data.formInline.rtcmessage as string)

  else
    console.error('data.channel is undefined')

  data.formInline.rtcmessage = undefined
}

// created
if (getParams('userId'))
  init(getParams('userId')!, getParams('roomId')!, getParams('userId')!)
</script>

<template>
  <div>
    <div i-carbon-campsite inline-block text-4xl />
  </div>

  <p>
    <a rel="noreferrer" href="https://github.com/antfu/vitesse-lite" target="_blank">
      OneToOne RTC
    </a>
  </p>

  <div flex flex-col items-center justify-center>
    <div
      v-for="item in data.roomUserList" :key="item.userId"
      flex items-center justify-center gap-1 pt-5
    >
      <el-tag>{{ `用户${item.nickname}` }}</el-tag>
      <el-tag v-if="item.userId === data.userInfo.userId">
        增加比特率
      </el-tag>
      <el-button v-if="item.userId === data.userInfo.userId" type="danger" size="small">
        切换
      </el-button>
      <el-button
        v-if="item.userId !== data.userInfo.userId"
        type="primary" size="small"
        @click="call(item)"
      >
        通话
      </el-button>
    </div>

    <div flex flex-col items-center justify-start pt-6>
      <div flex items-center justify-center gap-4>
        <p w-25>
          发送消息
        </p>
        <el-input v-model="data.formInline.rtcmessage" />
      </div>
      <div flex items-center justify-center gap-4 pt-4>
        <p w-25>
          远端消息
        </p>
        <div>
          {{
            data.formInline.rtcmessageRes
          }}
        </div>
      </div>
    </div>

    <div>
      <button
        class="m-4 text-sm btn"
        @click="sendMessageUserRtcChannel"
      >
        发送
      </button>
    </div>

    <div style="display: flex;flex-direction: row;justify-content: flex-start; gap: 20px;">
      <video id="localdemo01" autoplay controls muted h-50 w-70 />
      <video id="remotedemo01" autoplay controls muted h-50 w-70 />
    </div>
  </div>
</template>
