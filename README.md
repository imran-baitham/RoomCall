# RoomCall

A real-time, peer-to-peer video calling application built with Next.js and WebRTC. Create or join rooms instantly — no account required.

## Features

- **Instant rooms** — Generate a unique room code and share it with anyone
- **HD video & audio** — Peer-to-peer media via WebRTC for low-latency calls
- **Mute / camera toggle** — Control your mic and video independently at any time
- **Screen sharing** — Share your screen with all participants in the room
- **Live in-call chat** — Real-time text chat via `RTCDataChannel` (no server relay)
- **Multi-participant** — Mesh topology supports multiple users in one room
- **No sign-up** — Enter a display name and join, that's it

## Tech Stack

| Layer     | Technology                                     |
| --------- | ---------------------------------------------- |
| Framework | Next.js 16 (App Router)                        |
| UI        | React 19, Tailwind CSS v4, Lucide icons        |
| Real-time | WebRTC (`RTCPeerConnection`, `RTCDataChannel`) |
| Signaling | Socket.io v4 (custom Node.js server)           |
| Language  | TypeScript                                     |
| Fonts     | Geist Sans / Geist Mono                        |

## Architecture

```
Browser A                    Signaling Server (server.js)           Browser B
   |                                    |                               |
   |── join-room ─────────────────────>|                               |
   |<─ room-users (empty) ─────────────|                               |
   |                                   |<──────────── join-room ───────|
   |<─ user-joined ─────────────────── |─── room-users ([A]) ─────────>|
   |                                   |                               |
   |── offer ──────────────────────────────────────────────────────── >|
   |<─ answer ──────────────────────────────────────────────────────── |
   |<──────────────────── ICE candidates (both ways) ─────────────────>|
   |                                                                   |
   |<═══════════════════ P2P media + data channel ═══════════════════>|
                         (no server involved)
```

### Key Design Decisions

- **Mesh topology** — Every peer connects directly to every other peer. Best for small groups (2–8 people). No SFU/MCU needed.
- **Signaling via Socket.io** — Used only to exchange SDP offers/answers and ICE candidates. Once the call is established, the signaling server is no longer in the media path.
- **In-call chat via `RTCDataChannel`** — Chat messages travel peer-to-peer. The server never sees message content.
- **Screen sharing via `replaceTrack`** — Swaps the video track on all existing peer connections without renegotiation.
- **Custom Next.js server** — `server.js` wraps Next.js with `http.createServer`, allowing Socket.io to share the same port.

## Folder Structure

```
web-rtc/
├── server.js                          # Custom Node.js server (Next.js + Socket.io)
├── signaling-server/                  # Standalone signaling server (for split deployments)
│   ├── server.js
│   └── package.json
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (fonts, metadata)
│   │   ├── page.tsx                   # Home page (Create Room / Join Room)
│   │   ├── globals.css                # Global styles + Tailwind v4
│   │   └── room/
│   │       └── [roomId]/
│   │           ├── page.tsx           # Room route (async params)
│   │           └── _components/
│   │               ├── RoomClient.tsx # Main room orchestrator
│   │               ├── PreJoin.tsx    # Name entry screen before joining
│   │               ├── VideoTile.tsx  # Individual video/avatar tile
│   │               ├── Controls.tsx   # Bottom control bar
│   │               └── ChatPanel.tsx  # Slide-in chat panel
│   ├── hooks/
│   │   └── useWebRTC.ts               # Core WebRTC hook (connections, signaling, media)
│   ├── lib/
│   │   └── webrtc.ts                  # RTCConfiguration (STUN servers)
│   └── types/
│       └── index.ts                   # Shared TypeScript types
├── .env.local                         # Local environment variables (gitignored)
├── .env.example                       # Environment variable template
└── next.config.ts                     # Next.js config
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# .env.local defaults work for local development — no changes needed
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** `npm run dev` runs `node server.js`, not `next dev`. This is required because Socket.io needs a persistent Node.js HTTP server.

## Environment Variables

| Variable                 | Default                 | Description                                                                                               |
| ------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `PORT`                   | `3000`                  | Port for the Node.js server                                                                               |
| `NEXT_PUBLIC_SOCKET_URL` | _(same origin)_         | URL of the signaling server. Leave empty in dev. Set to your deployed signaling server URL in production. |
| `FRONTEND_URL`           | `http://localhost:3000` | _(Signaling server only)_ Allowed CORS origin                                                             |

## Deployment

### Option A — Railway (recommended, everything in one)

Railway supports persistent Node.js processes. No changes needed to the code.

1. Push your repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set environment variable: `NODE_ENV=production`
4. Railway auto-detects `npm run build` and `npm run start`

### Option B — Vercel (frontend) + Railway (signaling)

Vercel is serverless and cannot run Socket.io. Split the deployment:

1. Deploy `signaling-server/` to Railway as a separate service
   - Set `FRONTEND_URL=https://your-app.vercel.app` in Railway env vars
2. Deploy the Next.js frontend to Vercel
   - Set `NEXT_PUBLIC_SOCKET_URL=https://your-signal.railway.app` in Vercel env vars
   - Build command: `npm run build`

> **Why not Vercel for everything?** Vercel's serverless functions are stateless and terminate between requests. Socket.io requires a persistent process to maintain WebSocket connections and room state.
