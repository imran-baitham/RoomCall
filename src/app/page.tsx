'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Video, ArrowRight, /* Monitor, */ MessageSquare, Mic } from 'lucide-react'

const FEATURES = [
  { icon: <Video className="w-4 h-4" />, label: 'HD Video' },
  { icon: <Mic className="w-4 h-4" />, label: 'Audio Only' },
  /* { icon: <Monitor className="w-4 h-4" />, label: 'Screen Share' }, */
  { icon: <MessageSquare className="w-4 h-4" />, label: 'Live Chat' },
]

export default function HomePage() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')

  const createRoom = () => {
    const roomId = crypto.randomUUID().replace(/-/g, '').slice(0, 10)
    router.push(`/room/${roomId}`)
  }

  const joinRoom = () => {
    const code = roomCode.trim()
    if (!code) { setError('Please enter a room code'); return }
    router.push(`/room/${code}`)
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Video className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white tracking-tight">RoomCall</h1>
            <p className="text-zinc-500 mt-1.5">Free video calls, no sign-up required.</p>
          </div>
        </div>

        {/* Feature chips */}
        <div className="flex gap-2 flex-wrap justify-center">
          {FEATURES.map((f) => (
            <span
              key={f.label}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-full"
            >
              {f.icon}
              {f.label}
            </span>
          ))}
        </div>

        {/* Action card */}
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
          {/* Create room */}
          <button
            onClick={createRoom}
            className="w-full flex items-center gap-4 p-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-2xl transition-all group"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-semibold text-sm">Create a new Room</p>
              <p className="text-blue-200/80 text-xs">Start an instant meeting</p>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-xs">or join with a code</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Join with code */}
          <div className="flex gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => { setRoomCode(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              placeholder="Enter room code…"
              className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={joinRoom}
              className="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 active:scale-95 rounded-xl text-white transition-all flex items-center gap-2 shrink-0"
            >
              Join <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <p className="text-zinc-700 text-xs text-center">
          Share the room code with anyone to invite them to your call.
        </p>
      </div>
    </main>
  )
}
