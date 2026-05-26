const prisma = require('../config/prisma');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/errors');

// GET Platform Overview Statistics
exports.getPlatformStats = async (req, res, next) => {
  try {
    // Total restaurants
    const totalRestaurants = await prisma.restaurant.count();
    
    // Active subscriptions
    const activeSubscriptions = await prisma.restaurant.count({
      where: { subscriptionStatus: 'ACTIVE' }
    });
    
    // Expired subscriptions
    const expiredSubscriptions = await prisma.restaurant.count({
      where: { subscriptionStatus: 'EXPIRED' }
    });
    
    // Total revenue (all completed orders)
    const revenueData = await prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalAmount: true },
      _count: true
    });
    
    const totalRevenue = parseFloat(revenueData._sum.totalAmount || 0);
    const totalCompletedOrders = revenueData._count;
    
    // Total orders today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const ordersToday = await prisma.order.count({
      where: {
        createdAt: { gte: startOfToday, lte: endOfToday }
      }
    });
    
    // Total unique customers
    const totalCustomers = await prisma.customer.count();
    
    // Total restaurant owners
    const totalOwners = await prisma.user.count({
      where: { role: 'OWNER' }
    });
    
    // Active orders (pending + accepted)
    const activeOrders = await prisma.order.count({
      where: {
        status: { in: ['PENDING', 'ACCEPTED'] }
      }
    });

    return sendSuccess(res, 200, 'Platform statistics fetched successfully', {
      totalRestaurants,
      activeSubscriptions,
      expiredSubscriptions,
      totalRevenue,
      totalCompletedOrders,
      ordersToday,
      totalCustomers,
      totalOwners,
      activeOrders
    });
  } catch (error) {
    next(error);
  }
};

// GET All Restaurants with details (for restaurant management table)
exports.getAllRestaurantsDetailed = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { owner: { name: { contains: search, mode: 'insensitive' } } },
        { owner: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    if (status && ['ACTIVE', 'EXPIRED'].includes(status)) {
      where.subscriptionStatus = status;
    }
    
    // Get total count for pagination
    const totalCount = await prisma.restaurant.count({ where });
    
    // Fetch restaurants with details
    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { 
            tables: true, 
            orders: true,
            menuItems: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });
    
    // Enhance with revenue data
    const enhancedRestaurants = await Promise.all(
      restaurants.map(async (restaurant) => {
        const revenueData = await prisma.order.aggregate({
          where: { 
            restaurantId: restaurant.id,
            status: 'COMPLETED'
          },
          _sum: { totalAmount: true }
        });
        
        return {
          ...restaurant,
          totalRevenue: parseFloat(revenueData._sum.totalAmount || 0)
        };
      })
    );
    
    return sendSuccess(res, 200, 'Restaurants fetched successfully', {
      restaurants: enhancedRestaurants,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH Update Restaurant Subscription Status
exports.updateSubscriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subscriptionStatus } = req.body;
    
    if (!subscriptionStatus || !['ACTIVE', 'EXPIRED'].includes(subscriptionStatus)) {
      return next(new AppError('Invalid subscription status. Must be ACTIVE or EXPIRED', 400));
    }
    
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { subscriptionStatus },
      include: {
        owner: {
          select: { name: true, email: true }
        }
      }
    });
    
    return sendSuccess(res, 200, 'Subscription status updated successfully', restaurant);
  } catch (error) {
    next(error);
  }
};

// GET Platform-wide Analytics
exports.getPlatformAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    
    // Helper to get start of day
    const getStartOfDay = (daysAgo = 0) => {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(0, 0, 0, 0);
      return date;
    };
    
    // Last 7 days revenue trend
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const startDate = getStartOfDay(i);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      
      const dayRevenue = await prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { totalAmount: true },
        _count: true
      });
      
      last7Days.push({
        date: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: parseFloat(dayRevenue._sum.totalAmount || 0),
        orders: dayRevenue._count
      });
    }
    
    // Last 30 days for monthly trend
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const startDate = getStartOfDay(i);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      
      const dayData = await prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { totalAmount: true },
        _count: true
      });
      
      last30Days.push({
        date: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: parseFloat(dayData._sum.totalAmount || 0),
        orders: dayData._count
      });
    }
    
    // Top performing restaurants (by revenue)
    const allRestaurants = await prisma.restaurant.findMany({
      select: { id: true, name: true }
    });
    
    const restaurantRevenues = await Promise.all(
      allRestaurants.map(async (restaurant) => {
        const revenueData = await prisma.order.aggregate({
          where: { 
            restaurantId: restaurant.id,
            status: 'COMPLETED'
          },
          _sum: { totalAmount: true },
          _count: true
        });
        
        return {
          id: restaurant.id,
          name: restaurant.name,
          revenue: parseFloat(revenueData._sum.totalAmount || 0),
          orders: revenueData._count
        };
      })
    );
    
    const topRestaurants = restaurantRevenues
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Restaurant growth (new restaurants per month for last 6 months)
    const restaurantGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const count = await prisma.restaurant.count({
        where: {
          createdAt: { gte: startDate, lt: endDate }
        }
      });
      
      restaurantGrowth.push({
        month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count
      });
    }
    
    // Customer growth (new customers per month for last 6 months)
    const customerGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const count = await prisma.customer.count({
        where: {
          lastVisited: { gte: startDate, lt: endDate }
        }
      });
      
      customerGrowth.push({
        month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count
      });
    }
    
    return sendSuccess(res, 200, 'Platform analytics fetched successfully', {
      revenueTrend: {
        last7Days,
        last30Days
      },
      topRestaurants,
      restaurantGrowth,
      customerGrowth
    });
  } catch (error) {
    next(error);
  }
};

// GET Subscription Overview
exports.getSubscriptionOverview = async (req, res, next) => {
  try {
    // Active vs Expired count
    const activeCount = await prisma.restaurant.count({
      where: { subscriptionStatus: 'ACTIVE' }
    });
    
    const expiredCount = await prisma.restaurant.count({
      where: { subscriptionStatus: 'EXPIRED' }
    });
    
    // Restaurants with expired subscriptions (need attention)
    const expiredRestaurants = await prisma.restaurant.findMany({
      where: { subscriptionStatus: 'EXPIRED' },
      include: {
        owner: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    return sendSuccess(res, 200, 'Subscription overview fetched successfully', {
      summary: {
        active: activeCount,
        expired: expiredCount,
        total: activeCount + expiredCount
      },
      expiredRestaurants
    });
  } catch (error) {
    next(error);
  }
};

// GET Recent Activity
exports.getRecentActivity = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    
    // Recently created restaurants
    const recentRestaurants = await prisma.restaurant.findMany({
      include: {
        owner: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });
    
    // Recent large orders (orders > $100 or top 20)
    const recentLargeOrders = await prisma.order.findMany({
      where: {
        totalAmount: { gte: 100 }
      },
      include: {
        restaurant: {
          select: { name: true }
        },
        customer: {
          select: { name: true, phoneNumber: true }
        },
        table: {
          select: { tableNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });
    
    // Recent customers
    const recentCustomers = await prisma.customer.findMany({
      orderBy: { lastVisited: 'desc' },
      take: parseInt(limit)
    });
    
    return sendSuccess(res, 200, 'Recent activity fetched successfully', {
      recentRestaurants,
      recentLargeOrders,
      recentCustomers
    });
  } catch (error) {
    next(error);
  }
};
