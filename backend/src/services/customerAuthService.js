const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const AppError = require('../utils/errors');

// In-memory OTP store: { phoneNumber: { otp, expiresAt } }
// In production, replace with Redis or DB-backed store
const otpStore = new Map();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEV_OTP = '123456';

const signToken = (id) => {
  return jwt.sign({ id, role: 'CUSTOMER' }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d'
  });
};

// Legacy: login or register without OTP
exports.loginOrRegisterCustomer = async (phoneNumber, name) => {
  let customer = await prisma.customer.findUnique({ where: { phoneNumber } });

  if (customer) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        lastVisited: new Date(),
        ...(name && { name })
      }
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        phoneNumber,
        ...(name && { name })
      }
    });
  }

  const token = signToken(customer.id);
  return { customer, token };
};

// Step 1: Generate and "send" OTP
exports.sendOtp = async (phoneNumber) => {
  // In dev mode, always use fixed OTP. 
  // In production, integrate SMS gateway (Twilio, Fast2SMS, MSG91, etc.)
  const otp = process.env.NODE_ENV === 'production'
    ? Math.floor(100000 + Math.random() * 900000).toString()
    : DEV_OTP;

  otpStore.set(phoneNumber, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS
  });

  // TODO (production): send SMS via your preferred gateway
  // await smsGateway.send(phoneNumber, `Your OTP is ${otp}. Valid for 5 minutes.`);

  console.log(`[OTP] ${phoneNumber} → ${otp}`); // Dev log only
  return true;
};

// Step 2: Verify OTP and return customer + token
exports.verifyOtp = async (phoneNumber, otp, name) => {
  const record = otpStore.get(phoneNumber);

  if (!record) {
    throw new AppError('OTP not found or expired. Please request a new OTP.', 400);
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phoneNumber);
    throw new AppError('OTP has expired. Please request a new OTP.', 400);
  }

  if (record.otp !== otp.toString()) {
    throw new AppError('Invalid OTP. Please try again.', 400);
  }

  // OTP is valid — clear it
  otpStore.delete(phoneNumber);

  // Upsert customer
  let customer = await prisma.customer.findUnique({ where: { phoneNumber } });

  if (customer) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        lastVisited: new Date(),
        ...(name && { name })
      }
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        phoneNumber,
        ...(name && { name })
      }
    });
  }

  const token = signToken(customer.id);
  return { customer, token };
};
