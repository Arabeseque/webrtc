#  特性

* 使用 vitesse-lite 作为模板代码
* 包含多种 webRTC 实践
* 基于浏览器的多媒体即时通信

## 基础环境

实现一个会议系统，除了 `WebRTC` 之外，我们还需要一些硬件上或者软件上的支持，才能配合我们完成目标，条件如下：

1. 首先需要一个可以支持 `WebRTC` 的浏览器，在这里我列举下到目前为止支持的浏览器：

- 谷歌 Chrome(桌面和安卓)；
- 火狐浏览器(桌面版和安卓版)；
- Safari；
- Opera(桌面和安卓)；
- iOS (mobile Safari)；
- 微软 Edge；
- 360 浏览器极速模式下；
- ……（还有几个不常用的浏览器，我们就不在这里写了。）

2. 要获取浏览器所在设备的摄像头、麦克风实现画面和声音的传输，这就要求你的电脑有摄像头和麦克风。

# webRTC 会话流程



![image-20230805183507248](https://raw.githubusercontent.com/Arabeseque/pictureBed/master/img/202308051835386.png)



对照这个流程图，我们再来口述一边，上图中 **A** 为**caller（呼叫端），B为callee（被呼叫端）。**

1. 首先 A 呼叫 B，呼叫之前我们一般通过实时通信协议`WebSocket`即可，让对方能收到信息。

1. B 接受应答，A 和 B 均开始初始化`PeerConnection `实例，用来关联 A 和 B 的`SDP`会话信息。

1. A 调用`createOffer`创建信令，同时通过`setLocalDescription`方法在本地实例`PeerConnection`中储存一份（**图中流程①**）。

1. 然后调用信令服务器将 A 的`SDP`转发给 B（**图中流程②**）。

1. B 接收到 A 的`SDP`后调用`setRemoteDescription`，将其储存在初始化好的`PeerConnection`实例中（**图中流程③**）。

1. B 同时调用`createAnswer`创建应答`SDP`，并调用`setLocalDescription`储存在自己本地`PeerConnection`实例中（**图中流程④**）。

1. B 继续将自己创建的应答`SDP`通过服务器转发给 A（**图中流程⑤**）。

1. A 调用`setRemoteDescription`将 B 的`SDP`储存在本地`PeerConnection`实例（**图中流程⑤**）。

1. 在会话的同时，从图中我们可以发现有个`ice candidate`，这个信息就是 ice 候选信息，A 发给 B 的 B 储存，B 发给 A 的 A 储存，直至候选完成。
