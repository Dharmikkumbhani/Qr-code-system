import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

let socket;

export const initiateSocketConnection = (restaurantId) => {
  if (socket && socket.connected) return socket;
  
  socket = io(SOCKET_URL);
  
  socket.on('connect', () => {
    console.log('Customer connected to socket server');
    if (restaurantId) {
      socket.emit('joinRestaurant', restaurantId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Customer disconnected from socket server');
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
