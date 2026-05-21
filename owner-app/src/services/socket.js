import { io } from 'socket.io-client';

// Change this to your backend IP when testing on a physical device
const SOCKET_URL = 'http://10.140.193.133:8081';

let socket;

export const initiateSocketConnection = (restaurantId) => {
  if (socket && socket.connected) return socket;
  
  socket = io(SOCKET_URL);
  
  socket.on('connect', () => {
    console.log('Connected to socket server');
    if (restaurantId) {
      socket.emit('joinRestaurant', restaurantId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export const getSocket = () => {
  return socket;
};
