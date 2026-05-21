const prisma = require('../config/prisma');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/errors');

// POST /api/orders
// Body: { restaurantId, tableId, items: [{ menuItemId, quantity, unitPrice, specialInstructions? }] }
exports.placeOrder = async (req, res, next) => {
  try {
    const { restaurantId, tableId, items } = req.body;
    const customerId = req.customer.id;

    // Basic validation
    if (!restaurantId || !tableId || !items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('restaurantId, tableId, and at least one item are required', 400));
    }

    // Validate restaurant exists and get owner's push token
    const restaurant = await prisma.restaurant.findUnique({ 
      where: { id: restaurantId },
      include: { owner: { select: { pushToken: true } } }
    });
    if (!restaurant) return next(new AppError('Restaurant not found', 404));

    // Validate table belongs to this restaurant
    const table = await prisma.table.findFirst({
      where: { id: tableId, restaurantId }
    });
    if (!table) return next(new AppError('Table not found for this restaurant', 404));

    // Verify all menu items exist and belong to this restaurant, and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const { menuItemId, quantity, unitPrice, specialInstructions } = item;

      if (!menuItemId || !quantity || quantity < 1 || unitPrice === undefined) {
        return next(new AppError('Each item must have menuItemId, quantity, and unitPrice', 400));
      }

      const menuItem = await prisma.menuItem.findFirst({
        where: { id: menuItemId, restaurantId, isAvailable: true }
      });

      if (!menuItem) {
        return next(new AppError(`Menu item ${menuItemId} not found or unavailable`, 404));
      }

      const price = parseFloat(unitPrice);
      totalAmount += price * quantity;

      validatedItems.push({
        menuItemId,
        quantity,
        unitPrice: price,
        specialInstructions: specialInstructions || null
      });
    }

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          restaurantId,
          tableId,
          customerId,
          totalAmount: Math.round(totalAmount * 100) / 100,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          orderItems: {
            create: validatedItems
          }
        },
        include: {
          orderItems: {
            include: {
              menuItem: {
                select: { name: true, imageUrl: true }
              }
            }
          },
          table: { select: { tableNumber: true } }
        }
      });

      return newOrder;
    });

    // Emit socket event to the restaurant's room
    if (req.io) {
      req.io.to(`restaurant_${restaurantId}`).emit('newOrder', order);
    }

    // Send push notification to the owner if they have a push token
    if (restaurant.owner?.pushToken) {
      const { sendPushNotification } = require('../services/pushService');
      const tableNumber = order.table?.tableNumber || 'a table';
      sendPushNotification(
        restaurant.owner.pushToken,
        'New Order Received! 🍽️',
        `A new order has been placed at ${tableNumber}.`,
        { orderId: order.id }
      );
    }

    return sendSuccess(res, 201, 'Order placed successfully', order);
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:orderId
exports.getOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const customerId = req.customer.id;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId  // Customers can only view their own orders
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: { name: true, imageUrl: true, price: true }
            }
          }
        },
        table: { select: { tableNumber: true } },
        restaurant: { select: { name: true } }
      }
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    return sendSuccess(res, 200, 'Order fetched successfully', order);
  } catch (error) {
    next(error);
  }
};
