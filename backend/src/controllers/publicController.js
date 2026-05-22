const prisma = require('../config/prisma');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/errors');

// GET /api/public/menu/:restaurantSlug
// Public — no auth needed
exports.getPublicMenu = async (req, res, next) => {
  try {
    const { restaurantSlug } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    if (restaurant.subscriptionStatus !== 'ACTIVE') {
      return next(new AppError('This restaurant is currently unavailable', 403));
    }

    const categories = await prisma.category.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: { name: 'asc' }
        }
      }
    });

    let tableNumber = null;
    const { tableId } = req.query;
    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId, restaurantId: restaurant.id }
      });
      if (table) {
        tableNumber = table.tableNumber;
      }
    }

    return sendSuccess(res, 200, 'Menu fetched successfully', {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        phone: restaurant.phone,
        address: restaurant.address
      },
      categories,
      tableNumber
    });
  } catch (error) {
    next(error);
  }
};
