'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, X, MessageSquare } from 'lucide-react'
import type { ChatMessage } from '@/types'

interface Props {
  messages: ChatMessage[]
  onSend: (text: string) => void
  onClose: () => void
}

export default function ChatPanel({ messages, onSend, onClose }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 w-80 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-400" />
          <span className="text-white text-sm font-medium">In-call messages</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-white transition-colors p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-zinc-600 text-xs text-center mt-10">
            Messages are only visible to people in the call.
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
            {!msg.isOwn && (
              <span className="text-zinc-500 text-xs mb-1 px-1">{msg.userName}</span>
            )}
            <div
              className={[
                'max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed wrap-break-word',
                msg.isOwn
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-zinc-800 text-zinc-100 rounded-bl-sm',
              ].join(' ')}
            >
              {msg.text}
            </div>
            <span className="text-zinc-600 text-xs mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800 shrink-0 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Send a message…"
          className="flex-1 min-w-0 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
