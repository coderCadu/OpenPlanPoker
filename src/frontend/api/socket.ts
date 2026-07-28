import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function connectSocket(slug: string, pseudonym: string): Socket {
  if (socket) {
    socket.disconnect()
  }

  const url = import.meta.env.VITE_SOCKET_URL || window.location.origin
  socket = io(url, { auth: { slug, pseudonym } })

  socket.on('heartbeat:ping', () => {
    socket?.emit('heartbeat:pong')
  })

  socket.on('connect', () => {
    socket?.emit('participant:join')
  })

  socket.on('connect_error', (err) => {
    // eslint-disable-next-line no-console
    console.error('Socket connection error:', err.message)
  })

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.emit('participant:leave')
    socket.disconnect()
    socket = null
  }
}
