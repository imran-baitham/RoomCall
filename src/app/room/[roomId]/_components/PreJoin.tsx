'use client'

import { useState } from 'react'
import { Video, User, ArrowRight } from 'lucide-react'

interface Props {
  roomId: string
  onJoin: (userName: string) => void
}

export default function PreJoin({ roomId, onJoin }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleJoin = () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Please enter your name'); return }
    onJoin(trimmed)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Video className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Join Room</h1>
            <p className="text-zinc-500 text-sm font-mono mt-1">{roomId}</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="Your display name"
              maxLength={30}
              className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            onClick={handleJoin}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            Join Room <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-zinc-700 text-xs text-center mt-4">
          Your camera and microphone will be requested after joining.
        </p>
      </div>
    </div>
  )
}
