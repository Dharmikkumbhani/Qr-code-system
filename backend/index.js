const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env variables
dotenv.config();

// Custom imports
const prisma = require('./src/config/prisma');
const errorHandler = require('./src/middlewares/errorHandler');
const AppError = require('./src/utils/errors');

const app = express();
const PORT = process.env.PORT || 8081;

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

app.use('/api/auth', authRoutes);
app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Catch all unhandled routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
