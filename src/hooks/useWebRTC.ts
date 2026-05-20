'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import { RTC_CONFIG } from '@/lib/webrtc'
import type { RemoteParticipant, ChatMessage } from '@/types'

export function useWebRTC(roomId: string, userName: string, enabled: boolean) {
  const socketRef = useRef<Socket | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map())
  const peerNamesRef = useRef<Map<string, string>>(new Map())
  const screenTrackRef = useRef<MediaStreamTrack | null>(null)
  const isScreenSharingRef = useRef(false)
  const userNameRef = useRef(userName)

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [participants, setParticipants] = useState<Map<string, RemoteParticipant>>(new Map())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)

  useEffect(() => { userNameRef.current = userName }, [userName])

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setIsMuted(!track.enabled)
    }
  }, [])

  const toggleVideo = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setIsVideoOff(!track.enabled)
    }
  }, [])

  const stopScreenShare = useCallback(async () => {
    if (!screenTrackRef.current || !localStreamRef.current) return
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true })
      const cameraTrack = cameraStream.getVideoTracks()[0]
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
        sender?.replaceTrack(cameraTrack)
      })
      localStreamRef.current.removeTrack(screenTrackRef.current)
      localStreamRef.current.addTrack(cameraTrack)
      screenTrackRef.current.stop()
      screenTrackRef.current = null
      isScreenSharingRef.current = false
      setIsScreenSharing(false)
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()))
    } catch (err) {
      console.error('stopScreenShare failed:', err)
    }
  }, [])

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharingRef.current) {
      await stopScreenShare()
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
        const screenTrack = screenStream.getVideoTracks()[0]
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
          sender?.replaceTrack(screenTrack)
        })
        const oldVideoTrack = localStreamRef.current?.getVideoTracks()[0]
        if (oldVideoTrack && localStreamRef.current) {
          localStreamRef.current.removeTrack(oldVideoTrack)
          oldVideoTrack.stop()
        }
        localStreamRef.current?.addTrack(screenTrack)
        screenTrackRef.current = screenTrack
        isScreenSharingRef.current = true
        setIsScreenSharing(true)
        setLocalStream(new MediaStream(localStreamRef.current!.getTracks()))
        screenTrack.onended = stopScreenShare
      } catch (err) {
        console.error('Screen share failed:', err)
      }
    }
  }, [stopScreenShare])

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const payload = JSON.stringify({ text: trimmed, ts: Date.now() })
    dataChannelsRef.current.forEach((channel) => {
      if (channel.readyState === 'open') channel.send(payload)
    })
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        socketId: 'local',
        userName: userNameRef.current,
        text: trimmed,
        timestamp: Date.now(),
        isOwn: true,
      },
    ])
  }, [])

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    peerConnectionsRef.current.forEach((pc) => pc.close())
    peerConnectionsRef.current.clear()
    dataChannelsRef.current.clear()
    peerNamesRef.current.clear()
    setLocalStream(null)
    setParticipants(new Map())
  }, [])

  useEffect(() => {
    if (!enabled || !userName || !roomId) return
    let cancelled = false

    const pcs = peerConnectionsRef.current
    const dcs = dataChannelsRef.current
    const names = peerNamesRef.current

    const makePeer = (socketId: string, peerName: string): RTCPeerConnection => {
      names.set(socketId, peerName)

      const pc = new RTCPeerConnection(RTC_CONFIG)

      localStreamRef.current?.getTracks().forEach((t) =>
        pc.addTrack(t, localStreamRef.current!)
      )

      pc.ontrack = ({ streams: [s] }) => {
        setParticipants((prev) =>
          new Map(prev).set(socketId, { socketId, userName: peerName, stream: s })
        )
      }

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) socketRef.current?.emit('ice-candidate', { to: socketId, candidate })
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed') {
          pc.close()
          pcs.delete(socketId)
          dcs.delete(socketId)
          setParticipants((prev) => {
            const next = new Map(prev)
            next.delete(socketId)
            return next
          })
        }
      }

      const handleMsg = (e: MessageEvent) => {
        try {
          const { text, ts } = JSON.parse(e.data as string)
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              socketId,
              userName: names.get(socketId) ?? peerName,
              text: text as string,
              timestamp: ts as number,
              isOwn: false,
            },
          ])
        } catch {
          /* ignore malformed messages */
        }
      }

      const dc = pc.createDataChannel('chat', { negotiated: true, id: 0 })
      dc.onmessage = handleMsg
      dcs.set(socketId, dc)

      pcs.set(socketId, pc)
      return pc
    }

    let handleUnload: (() => void) | null = null

    const init = async () => {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch {
        if (!cancelled)
          setMediaError('Camera/mic access denied. Please allow permissions and reload.')
        return
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      localStreamRef.current = stream
      setLocalStream(stream)

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      })
      socketRef.current = socket

      handleUnload = () => socket.disconnect()
      window.addEventListener('beforeunload', handleUnload)

      socket.on('connect', () => {
        socket.emit('join-room', { roomId, userName })
      })

      socket.on(
        'room-users',
        async (users: Array<{ socketId: string; userName: string }>) => {
          for (const u of users) {
            setParticipants((prev) =>
              new Map(prev).set(u.socketId, {
                socketId: u.socketId,
                userName: u.userName,
                stream: null,
              })
            )
            const pc = makePeer(u.socketId, u.userName)
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            socket.emit('offer', { to: u.socketId, offer })
          }
        }
      )

      socket.on(
        'user-joined',
        ({ socketId, userName: peerName }: { socketId: string; userName: string }) => {
          setParticipants((prev) =>
            new Map(prev).set(socketId, { socketId, userName: peerName, stream: null })
          )
          makePeer(socketId, peerName)
        }
      )

      socket.on(
        'offer',
        async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
          const peerName = names.get(from) ?? 'User'
          let pc = pcs.get(from)
          if (!pc) pc = makePeer(from, peerName)
          await pc.setRemoteDescription(offer)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socket.emit('answer', { to: from, answer })
        }
      )

      socket.on(
        'answer',
        async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
          const pc = pcs.get(from)
          if (pc) await pc.setRemoteDescription(answer)
        }
      )

      socket.on(
        'ice-candidate',
        async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
          const pc = pcs.get(from)
          try {
            if (pc && candidate) await pc.addIceCandidate(candidate)
          } catch {
            /* ignore ICE errors */
          }
        }
      )

      socket.on('user-left', ({ socketId }: { socketId: string }) => {
        const pc = pcs.get(socketId)
        if (pc) {
          pc.close()
          pcs.delete(socketId)
        }
        dcs.delete(socketId)
        names.delete(socketId)
        setParticipants((prev) => {
          const next = new Map(prev)
          next.delete(socketId)
          return next
        })
      })

    }

    init()

    return () => {
      cancelled = true
      if (handleUnload) {
        window.removeEventListener('beforeunload', handleUnload)
        handleUnload = null
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
        localStreamRef.current = null
      }
      pcs.forEach((pc) => pc.close())
      pcs.clear()
      dcs.clear()
      names.clear()
    }
  }, [enabled, userName, roomId])

  return {
    localStream,
    participants,
    messages,
    isMuted,
    isVideoOff,
    isScreenSharing,
    mediaError,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    sendMessage,
    leaveRoom,
  }
}
