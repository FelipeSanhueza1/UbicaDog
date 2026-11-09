import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});

export function sendUserLocation(lat: number, lng: number) {
  if (socket.connected) {
    socket.emit('user:location:update', { lat, lng });
  }
}
