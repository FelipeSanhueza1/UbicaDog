import { Server as SocketIOServer } from 'socket.io';
import { calculateDistanceMeters } from './geoService.js';

let ioInstance: SocketIOServer | null = null;

export function initSocketService(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Client joins and registers their current viewport or device location
    socket.on('user:location:update', (coords: { lat: number; lng: number }) => {
      socket.data.location = coords;
    });

    socket.on('disconnect', () => {
      // Clean up
    });
  });
}

export function broadcastRadarWave(payload: {
  type: 'lost_pet' | 'sighting' | 'admin_broadcast';
  title: string;
  message: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  data: any;
}) {
  if (!ioInstance) return;

  // Broadcast to all connected clients
  ioInstance.emit('radar:wave', payload);

  // Also check individual client proximities for selective high-priority alarms
  for (const [_, clientSocket] of ioInstance.sockets.sockets) {
    const loc = clientSocket.data.location;
    if (loc && loc.lat && loc.lng) {
      const dist = calculateDistanceMeters(loc.lat, loc.lng, payload.latitude, payload.longitude);
      // Prudent alert radius (e.g. within wander radius + 2km buffer)
      if (dist <= payload.radiusMeters + 2000) {
        clientSocket.emit('radar:proximity:alert', {
          ...payload,
          distanceFromUserMeters: dist,
        });
      }
    }
  }
}
