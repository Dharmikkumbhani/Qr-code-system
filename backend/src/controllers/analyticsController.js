const prisma = require('../config/prisma');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/errors');

exports.getAnalytics = async (req, res, next) => {
  try {
    const { id: restaurantId } = req.params;

    // Verify ownership
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerId: req.user.id }
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or unauthorized', 404));
    }

    const now = new Date();
    
    // Today's bounds
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // This month's bounds
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 1. Fetch Today's Data
    const todaysOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: 'COMPLETED',
        createdAt: {
          gte: startOfToday,
          lt: endOfToday,
        }
      },
      select: { totalAmount: true }
    });
    
    const todayRevenue = todaysOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const todayOrdersCount = todaysOrders.length;

    // 2. Fetch This Month's Data
    const monthlyOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        }
      },
      select: { totalAmount: true }
    });

    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const monthlyOrdersCount = monthlyOrders.length;

    // 3. Top Selling Items (all time or recent)
    // We will aggregate orderItems for completed orders
    const topItemsData = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          restaurantId,
          status: 'COMPLETED',
        }
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    // Fetch the names and image URLs of those top items
    const menuItemIds = topItemsData.map(t => t.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, imageUrl: true, price: true }
    });

    const topItems = topItemsData.map(t => {
      const itemDetails = menuItems.find(m => m.id === t.menuItemId);
      return {
        id: t.menuItemId,
        name: itemDetails?.name || 'Unknown Item',
        imageUrl: itemDetails?.imageUrl,
        price: itemDetails?.price,
        quantitySold: t._sum.quantity,
      };
    });

    return sendSuccess(res, 200, 'Analytics fetched successfully', {
      today: {
        revenue: todayRevenue,
        orders: todayOrdersCount
      },
      monthly: {
        revenue: monthlyRevenue,
        orders: monthlyOrdersCount
      },
      topItems
    });
  } catch (error) {
    next(error);
  }
};
