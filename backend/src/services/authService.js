const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const AppError = require('../utils/errors');

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d'
  });
};

exports.registerUser = async (data) => {
  const { name, email, password, role } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email is already in use', 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role || 'OWNER'
    }
  });

  // Generate token
  const token = signToken(newUser.id, newUser.role);

  // Don't return the password hash
  const { passwordHash: _, ...userWithoutPassword } = newUser;

  return { user: userWithoutPassword, token };
};

exports.loginUser = async (email, password) => {
  // Check if user exists
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { restaurants: { select: { id: true, name: true, slug: true } } }
  });
  if (!user) {
    throw new AppError('Incorrect email or password', 401);
  }

  // Check if password is correct
  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordCorrect) {
    throw new AppError('Incorrect email or password', 401);
  }

  // Generate token
  const token = signToken(user.id, user.role);

  // Don't return the password hash
  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};
