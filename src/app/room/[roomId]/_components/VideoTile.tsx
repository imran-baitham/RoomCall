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
    const video = videoRef.current
    if (!video) return

    video.srcObject = stream

    if (stream) {
      const play = () => {
        video.play().catch((err) => {
          if (err.name !== 'AbortError') console.warn('Video play failed:', err)
        })
      }

      video.addEventListener('loadedmetadata', play)
      // Immediate attempt in case metadata is already loaded
      if (video.readyState >= 1) play()

      return () => {
        video.removeEventListener('loadedmetadata', play)
      }
    }
  }, [stream])

  const showVideo = !!stream && !isVideoOff

  return (
    <div className={`relative bg-zinc-800 rounded-2xl overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${showVideo ? 'block' : 'hidden'}`}
      />
      {!showVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-700 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400" />
          </div>
          <span className="text-zinc-500 text-xs">{isVideoOff ? 'Camera off' : 'No video'}</span>
        </div>
      )}

      {/* Name tag */}
      <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5">
        <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-lg font-medium">
          {isLocal ? `${userName} (You)` : userName}
        </span>
      </div>

      {/* Status indicators */}
      <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 flex gap-1.5">
        {isMuted && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center shadow">
            <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
          </div>
        )}
        {isVideoOff && !showVideo && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-zinc-700 rounded-full flex items-center justify-center shadow">
            <VideoOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-zinc-300" />
          </div>
        )}
      </div>
    </div>
  )
}
