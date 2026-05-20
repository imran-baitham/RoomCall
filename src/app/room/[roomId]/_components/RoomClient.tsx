'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, AlertCircle, Video } from 'lucide-react'
import { useWebRTC } from '@/hooks/useWebRTC'
import PreJoin from './PreJoin'
import VideoTile from './VideoTile'
import Controls from './Controls'
import ChatPanel from './ChatPanel'

interface Props {
  roomId: string
}

function getGridClass(count: number): string {
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2'
  if (count <= 4) return 'grid-cols-1 sm:grid-cols-2'
  if (count <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
}

export default function RoomClient({ roomId }: Props) {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [joined, setJoined] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const {
    localStream,
    participants,
    messages,
    isMuted,
    isVideoOff,
    /* isScreenSharing, */
    mediaError,
    socketError,
    toggleMute,
    toggleVideo,
    /* toggleScreenShare, */
    sendMessage,
    leaveRoom,
  } = useWebRTC(roomId, userName, joined)

  const handleJoin = useCallback((name: string) => {
    setUserName(name)
    setJoined(true)
  }, [])

  const handleLeave = useCallback(() => {
    leaveRoom()
    router.push('/')
  }, [leaveRoom, router])

  const copyRoomId = useCallback(async () => {
    await navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [roomId])

  if (!joined) {
    return <PreJoin roomId={roomId} onJoin={handleJoin} />
  }

  if (mediaError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <p className="text-white text-lg font-semibold">Permissions Required</p>
            <p className="text-zinc-400 text-sm mt-1">{mediaError}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-xl transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const participantList = [...participants.values()]
  const totalTiles = 1 + participantList.length
  const gridClass = getGridClass(totalTiles)

  return (
    <div className="relative flex h-screen bg-zinc-950 overflow-hidden">
      {/* Main call area */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-white text-sm font-semibold hidden sm:inline">RoomCall</span>
          </div>

          <button
            onClick={copyRoomId}
            title="Copy room code"
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 rounded-lg transition-all group"
          >
            <span className="text-zinc-400 text-xs font-mono">{roomId}</span>
            {copied
              ? <Check className="w-3.5 h-3.5 text-green-400" />
              : <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />}
          </button>

          <div className="w-24" />
        </div>

        {/* Socket error banner */}
        {socketError && (
          <div className="px-4 py-2 bg-red-600/10 border-b border-red-600/20 shrink-0">
            <p className="text-red-400 text-xs text-center">{socketError}</p>
          </div>
        )}

        {/* Video grid */}
        <div className={`flex-1 min-h-0 p-3 grid gap-3 auto-rows-[1fr] ${gridClass}`}>
          <VideoTile
            stream={localStream}
            userName={userName}
            isLocal
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            className="h-full"
          />
          {participantList.map((p) => (
            <VideoTile
              key={p.socketId}
              stream={p.stream}
              userName={p.userName}
              className="h-full"
            />
          ))}
        </div>

        {/* Controls bar */}
        <Controls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          /* isScreenSharing={isScreenSharing} */
          isChatOpen={isChatOpen}
          participantCount={participantList.length}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          /* onToggleScreenShare={toggleScreenShare} */
          onToggleChat={() => setIsChatOpen((v) => !v)}
          onLeave={handleLeave}
        />
      </div>

      {/* Chat panel */}
      {isChatOpen && (
        <div className="absolute inset-0 z-50 sm:static sm:inset-auto sm:z-auto">
          <div className="absolute inset-0 bg-black/50 sm:hidden" onClick={() => setIsChatOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm sm:max-w-none sm:relative sm:w-80 sm:shrink-0 sm:h-full">
            <ChatPanel
              messages={messages}
              onSend={sendMessage}
              onClose={() => setIsChatOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
