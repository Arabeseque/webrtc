# Features

- Use vitesse-lite as the template code.
- Includes various WebRTC practices.
- Browser-based multimedia instant communication.

# Basic Requirements

To implement a conference system, besides `WebRTC`, we need some hardware or software support to achieve our goals. The conditions are as follows:

1. Firstly, we need a browser that supports `WebRTC`. Here is a list of browsers that support `WebRTC` up to now:

- Google Chrome (desktop and Android)
- Mozilla Firefox (desktop and Android)
- Safari
- Opera (desktop and Android)
- iOS (mobile Safari)
- Microsoft Edge
- 360 Browser (speed mode)
- ... (a few other less common browsers not listed here)

1. To access the camera and microphone of the device where the browser is running to transmit video and audio, you will need a computer with a camera and microphone.

# WebRTC Session Flow

![WebRTC Session Flow](https://raw.githubusercontent.com/Arabeseque/pictureBed/master/img/202308051835386.png)

Following this flowchart, let's describe the process:

In the diagram, **A** represents the **caller**, and **B** represents the **callee**.

1. First, A calls B. Before making the call, we generally use the real-time communication protocol `WebSocket` to ensure the other party receives the information.
2. B accepts the call, and both A and B start initializing the `PeerConnection` instances to associate their SDP session information.
3. A calls `createOffer` to create a signal and stores a copy in the local `PeerConnection` instance using the `setLocalDescription` method (**Process ①** in the diagram).
4. Then, A sends the SDP to B through the signaling server (**Process ②** in the diagram).
5. B receives A's SDP and uses `setRemoteDescription` to store it in the initialized `PeerConnection` instance (**Process ③** in the diagram).
6. B simultaneously calls `createAnswer` to create an answer SDP and stores it in its local `PeerConnection` instance using `setLocalDescription` (**Process ④** in the diagram).
7. B then sends its created answer SDP back to A through the server (**Process ⑤** in the diagram).
8. A calls `setRemoteDescription` to store B's SDP in its local `PeerConnection` instance (**Process ⑤** in the diagram).
9. During the session, we notice the presence of `ice candidate` in the diagram, which refers to ice candidate information. A sends its ice candidate information to B, which B stores, and vice versa, until the candidates are complete.
