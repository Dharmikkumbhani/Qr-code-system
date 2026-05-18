const prisma = require('../config/prisma');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/errors');
const bcrypt = require('bcryptjs');

// GET all restaurants (Super Admin only usually)
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        owner: {
          select: { name: true, email: true }
        },
        _count: {
          select: { tables: true, orders: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return sendSuccess(res, 200, 'Restaurants fetched successfully', restaurants);
  } catch (error) {
    next(error);
  }
};

// POST create a new restaurant & assign an owner
exports.createRestaurant = async (req, res, next) => {
  try {
    const { name, slug, phone, address, ownerEmail, ownerName, ownerPassword } = req.body;

    if (!name || !slug || !ownerEmail || !ownerPassword) {
      return next(new AppError('Please provide restaurant name, slug, and owner credentials', 400));
    }

    // Wrap in a transaction: Create/Find Owner -> Create Restaurant
    const result = await prisma.$transaction(async (tx) => {
      // Check if owner email exists
      let owner = await tx.user.findUnique({ where: { email: ownerEmail } });
      
      if (!owner) {
        // Create new owner
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(ownerPassword, salt);
        owner = await tx.user.create({
          data: {
            email: ownerEmail,
            name: ownerName || 'Restaurant Owner',
            passwordHash,
            role: 'OWNER'
          }
        });
      }

      // Check if slug exists
      const existingSlug = await tx.restaurant.findUnique({ where: { slug } });
      if (existingSlug) {
        throw new AppError('Restaurant slug must be unique', 400);
      }

      // Create Restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name,
          slug,
          phone,
          address,
          ownerId: owner.id
        }
      });

      return restaurant;
    });

    return sendSuccess(res, 201, 'Restaurant created successfully', result);
  } catch (error) {
    next(error);
  }
};
