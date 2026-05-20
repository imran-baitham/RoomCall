export interface RemoteParticipant {
  socketId: string
  userName: string
  stream: MediaStream | null
}

export interface ChatMessage {
  id: string
  socketId: string
  userName: string
  text: string
  timestamp: number
  isOwn: boolean
}
