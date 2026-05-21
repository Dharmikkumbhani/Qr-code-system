const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load env variables
dotenv.config();

// Custom imports
const prisma = require('./src/config/prisma');
const errorHandler = require('./src/middlewares/errorHandler');
const AppError = require('./src/utils/errors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins for now
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 8081;

// Make io accessible to routers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected to socket: ${socket.id}`);
  
  // Clients can join a room based on restaurantId to get specific orders
  socket.on('joinRestaurant', (restaurantId) => {
    socket.join(`restaurant_${restaurantId}`);
    console.log(`Socket ${socket.id} joined room restaurant_${restaurantId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Middlewares
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', message: 'Backend and Database are connected' });
  } catch (error) {
    next(new AppError(`Database connection failed: ${error.message}`, 500));
  }
});

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const customerAuthRoutes = require('./src/routes/customerAuthRoutes');
const restaurantRoutes = require('./src/routes/restaurantRoutes');
const publicRoutes = require('./src/routes/publicRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/orders', orderRoutes);

// Catch all unhandled routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler Middleware
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
