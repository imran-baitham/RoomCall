'use client'

import { useEffect, useRef } from 'react'
import { MicOff, VideoOff, User } from 'lucide-react'

interface Props {
  stream: MediaStream | null
  userName: string
  isLocal?: boolean
  isMuted?: boolean
  isVideoOff?: boolean
  className?: string
}

export default function VideoTile({
  stream,
  userName,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  className = '',
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const showVideo = !!stream && !isVideoOff

  return (
    <div className={`relative bg-zinc-800 rounded-2xl overflow-hidden ${className}`}>
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-zinc-400" />
          </div>
          <span className="text-zinc-500 text-xs">{isVideoOff ? 'Camera off' : 'No video'}</span>
        </div>
      )}

      {/* Name tag */}
      <div className="absolute bottom-2.5 left-2.5">
        <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-lg font-medium">
          {isLocal ? `${userName} (You)` : userName}
        </span>
      </div>

      {/* Status indicators */}
      <div className="absolute top-2.5 right-2.5 flex gap-1.5">
        {isMuted && (
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
        {isVideoOff && !showVideo && (
          <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center shadow">
            <VideoOff className="w-3 h-3 text-zinc-300" />
          </div>
        )}
      </div>
    </div>
  )
}
