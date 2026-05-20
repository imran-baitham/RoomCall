'use client'

import type { ReactNode } from 'react'
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, MessageSquare, PhoneOff, Users } from 'lucide-react'

interface ControlBtnProps {
  onClick: () => void
  icon: ReactNode
  label: string
  active?: boolean
  danger?: boolean
}

function ControlBtn({ onClick, icon, label, active = false, danger = false }: ControlBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={[
        'flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-95',
        danger
          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
          : active
            ? 'bg-zinc-600 text-white hover:bg-zinc-500'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white',
      ].join(' ')}
    >
      {icon}
    </button>
  )
}

interface Props {
  isMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  isChatOpen: boolean
  participantCount: number
  onToggleMute: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onToggleChat: () => void
  onLeave: () => void
}

export default function Controls({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isChatOpen,
  participantCount,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onLeave,
}: Props) {
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-zinc-900 border-t border-zinc-800 shrink-0">
      {/* Left: participant count */}
      <div className="flex items-center gap-2 w-28 text-zinc-500 text-sm">
        <Users className="w-4 h-4" />
        <span>{participantCount + 1} in call</span>
      </div>

      {/* Center: controls */}
      <div className="flex items-center gap-2">
        <ControlBtn
          onClick={onToggleMute}
          active={!isMuted}
          danger={isMuted}
          label={isMuted ? 'Unmute' : 'Mute'}
          icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        />
        <ControlBtn
          onClick={onToggleVideo}
          active={!isVideoOff}
          danger={isVideoOff}
          label={isVideoOff ? 'Start Video' : 'Stop Video'}
          icon={isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        />
        <ControlBtn
          onClick={onToggleScreenShare}
          active={isScreenSharing}
          label={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          icon={isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        />
        <ControlBtn
          onClick={onToggleChat}
          active={isChatOpen}
          label="Chat"
          icon={<MessageSquare className="w-5 h-5" />}
        />

        {/* Leave */}
        <button
          onClick={onLeave}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 active:scale-95 rounded-full text-white text-sm font-medium transition-all ml-2"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      {/* Right: spacer */}
      <div className="w-28" />
    </div>
  )
}
