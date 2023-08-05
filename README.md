<p align='center'>
  <img src='https://user-images.githubusercontent.com/11247099/111864893-a457fd00-899e-11eb-9f05-f4b88987541d.png' alt='Vitesse - Opinionated Vite Starter Template' width='600'/>
</p>

<h6 align='center'>
<a href="https://vitesse-lite.netlify.app/">Live Demo</a>
</h6>

<h5 align='center'>
<b>Lightweight version of <a href="https://github.com/antfu/vitesse">Vitesse</a></b>
</h5>

<br>

<p align='center'>
<b>English</b> | <a href="https://github.com/antfu/vitesse-lite/blob/main/README.zh-CN.md">简体中文</a>
<!-- Contributors: Thanks for geting interested, however we DON'T accept new transitions to the README, thanks. -->
</p>

## Features

- ⚡️ [Vue 3](https://github.com/vuejs/core), [Vite 3](https://github.com/vitejs/vite), [pnpm](https://pnpm.io/), [ESBuild](https://github.com/evanw/esbuild) - born with fastness

- 🗂 [File based routing](./src/pages)

- 📦 [Components auto importing](./src/components)

- 🎨 [UnoCSS](https://github.com/antfu/unocss) - The instant on-demand atomic CSS engine.

- 😃 Use icons from any icon sets in [Pure CSS](https://github.com/antfu/unocss/tree/main/packages/preset-icons)

- 🔥 Use the [new `<script setup>` style](https://github.com/vuejs/rfcs/pull/227)

- ✅ Use [Vitest](http://vitest.dev/) for unit and components testing

- 🦾 TypeScript, of course

- ☁️ Deploy on Netlify, zero-config


<br>

See [Vitesse](https://github.com/antfu/vitesse) for full featureset.


## Dropped Features from [Vitesse](https://github.com/antfu/vitesse)

- ~~i18n~~
- ~~Layouts~~
- ~~SSG~~
- ~~PWA~~
- ~~Markdown~~

## Pre-packed

### UI Frameworks

- [UnoCSS](https://github.com/antfu/unocss) - The instant on-demand atomic CSS engine.

### Icons

- [Iconify](https://iconify.design) - use icons from any icon sets [🔍Icônes](https://icones.netlify.app/)
- [Pure CSS Icons via UnoCSS](https://github.com/antfu/unocss/tree/main/packages/preset-icons)

### Plugins

- [Vue Router](https://github.com/vuejs/vue-router)
  - [`vite-plugin-pages`](https://github.com/hannoeru/vite-plugin-pages) - file system based routing
- [`unplugin-auto-import`](https://github.com/antfu/unplugin-auto-import) - Directly use Vue Composition API and others without importing
- [`unplugin-vue-components`](https://github.com/antfu/unplugin-vue-components) - components auto import
- [`unplugin-vue-macros`](https://github.com/sxzz/unplugin-vue-macros) - Explore and extend more macros and syntax sugar to Vue.
- [VueUse](https://github.com/antfu/vueuse) - collection of useful composition APIs

## Try it now!

### GitHub Template

[Create a repo from this template on GitHub](https://github.com/antfu/vitesse-lite/generate).

### Clone to local

If you prefer to do it manually with the cleaner git history

```bash
npx degit antfu/vitesse-lite my-vitesse-app
cd my-vitesse-app
pnpm i # If you don't have pnpm installed, run: npm install -g pnpm
```
Features
Use vitesse-lite as the template code.
Includes various WebRTC practices.
Browser-based multimedia instant communication.
Basic Requirements
To implement a conference system, besides WebRTC, we need some hardware or software support to achieve our goals. The conditions are as follows:

Firstly, we need a browser that supports WebRTC. Here is a list of browsers that support WebRTC up to now:
Google Chrome (desktop and Android)
Mozilla Firefox (desktop and Android)
Safari
Opera (desktop and Android)
iOS (mobile Safari)
Microsoft Edge
360 Browser (speed mode)
... (a few other less common browsers not listed here)
To access the camera and microphone of the device where the browser is running to transmit video and audio, you will need a computer with a camera and microphone.
WebRTC Session Flow
WebRTC Session Flow

Following this flowchart, let's describe the process:

In the diagram, A represents the caller, and B represents the callee.

First, A calls B. Before making the call, we generally use the real-time communication protocol WebSocket to ensure the other party receives the information.

B accepts the call, and both A and B start initializing the PeerConnection instances to associate their SDP session information.

A calls createOffer to create a signal and stores a copy in the local PeerConnection instance using the setLocalDescription method (Process ① in the diagram).

Then, A sends the SDP to B through the signaling server (Process ② in the diagram).

B receives A's SDP and uses setRemoteDescription to store it in the initialized PeerConnection instance (Process ③ in the diagram).

B simultaneously calls createAnswer to create an answer SDP and stores it in its local PeerConnection instance using setLocalDescription (Process ④ in the diagram).

B then sends its created answer SDP back to A through the server (Process ⑤ in the diagram).

A calls setRemoteDescription to store B's SDP in its local PeerConnection instance (Process ⑤ in the diagram).

During the session, we notice the presence of ice candidate in the diagram, which refers to ice candidate information. A sends its ice candidate information to B, which B stores, and vice versa, until the candidates are complete.
