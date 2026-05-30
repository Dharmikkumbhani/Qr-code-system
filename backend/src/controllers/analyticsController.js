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
    
    // --- 1. Current Period Bounds ---
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()); 
    const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // --- 2. Previous Period Bounds (for Growth calculation) ---
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    
    const startOfLastWeek = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endOfLastWeek = startOfWeek;

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = startOfMonth;

    // Helper function to fetch and sum revenue
    const getRevenue = async (start, end) => {
      const orders = await prisma.order.findMany({
        where: { restaurantId, status: 'COMPLETED', createdAt: { gte: start, lt: end } },
        select: { totalAmount: true }
      });
      return {
        revenue: orders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0),
        ordersCount: orders.length
      };
    };

    // Current
    const todayData = await getRevenue(startOfToday, endOfToday);
    const weeklyData = await getRevenue(startOfWeek, endOfWeek);
    const monthlyData = await getRevenue(startOfMonth, endOfMonth);

    // Previous
    const yesterdayData = await getRevenue(startOfYesterday, startOfToday);
    const lastWeekData = await getRevenue(startOfLastWeek, endOfLastWeek);
    const lastMonthData = await getRevenue(startOfLastMonth, endOfLastMonth);

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    // --- 3. Top Selling Items ---
    const topItemsData = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { restaurantId, status: 'COMPLETED' } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const menuItemIds = topItemsData.map(t => t.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, imageUrl: true, price: true }
    });

    const topItems = topItemsData.map(t => {
      const itemDetails = menuItems.find(m => m.id === t.menuItemId);
      const price = parseFloat(itemDetails?.price || 0);
      const qty = t._sum.quantity || 0;
      return {
        id: t.menuItemId,
        name: itemDetails?.name || 'Unknown Item',
        imageUrl: itemDetails?.imageUrl,
        price,
        quantitySold: qty,
        revenueGenerated: price * qty
      };
    });

    // --- 4. Customer Analytics ---
    const allCompletedOrders = await prisma.order.findMany({
      where: { restaurantId, status: 'COMPLETED', customerId: { not: null } },
      select: { customerId: true }
    });

    const customerOrderCounts = {};
    allCompletedOrders.forEach(order => {
      customerOrderCounts[order.customerId] = (customerOrderCounts[order.customerId] || 0) + 1;
    });

    let newUsers = 0;
    let returningUsers = 0;
    Object.values(customerOrderCounts).forEach(count => {
      if (count === 1) newUsers++;
      else returningUsers++;
    });

    const totalCustomers = Object.keys(customerOrderCounts).length;
    const avgOrdersPerUser = totalCustomers > 0 ? (allCompletedOrders.length / totalCustomers).toFixed(1) : 0;

    // --- 5. Hourly Heatmap (Peak Rush Hour) ---
    const allOrdersForTime = await prisma.order.findMany({
      where: { restaurantId, status: 'COMPLETED' },
      select: { createdAt: true }
    });

    const hourCounts = Array(24).fill(0);
    allOrdersForTime.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourCounts[hour]++;
    });

    const hourlyData = hourCounts.map((count, hour) => {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return { label: `${displayHour} ${ampm}`, value: count };
    });

    let maxOrdersInHour = Math.max(...hourCounts);
    let peakHour = hourCounts.indexOf(maxOrdersInHour);
    let peakOrderTime = "N/A";
    if (maxOrdersInHour > 0) {
      const ampm = peakHour >= 12 ? 'PM' : 'AM';
      const displayHour = peakHour % 12 || 12;
      peakOrderTime = `${displayHour} ${ampm}`;
    }

    // --- 6. 7-Day Order Analytics Line Graph ---
    const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    const last7DaysOrders = await prisma.order.findMany({
      where: { restaurantId, status: 'COMPLETED', createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true }
    });

    const dailyCountsMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      dailyCountsMap[dayStr] = 0;
    }

    last7DaysOrders.forEach(order => {
      const dayStr = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      if (dailyCountsMap[dayStr] !== undefined) {
        dailyCountsMap[dayStr]++;
      }
    });

    const dailyOrderData = Object.entries(dailyCountsMap).map(([day, count]) => ({
      label: day,
      value: count
    }));

    // --- 7. Parcel Analytics ---
    const getParcelStats = async (start, end) => {
      const parcels = await prisma.parcel.findMany({
        where: {
          restaurantId,
          status: { in: ['PICKED_UP', 'WAITING', 'READY'] },
          createdAt: { gte: start, lt: end }
        },
        select: { amount: true, status: true }
      });
      const completed = parcels.filter(p => p.status === 'PICKED_UP');
      return {
        totalCount: parcels.length,
        completedCount: completed.length,
        revenue: completed.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      };
    };

    const parcelToday = await getParcelStats(startOfToday, endOfToday);
    const parcelWeekly = await getParcelStats(startOfWeek, endOfWeek);
    const parcelMonthly = await getParcelStats(startOfMonth, endOfMonth);

    return sendSuccess(res, 200, 'Analytics fetched successfully', {
      today: {
        revenue: todayData.revenue,
        orders: todayData.ordersCount,
        growth: calculateGrowth(todayData.revenue, yesterdayData.revenue)
      },
      weekly: {
        revenue: weeklyData.revenue,
        orders: weeklyData.ordersCount,
        growth: calculateGrowth(weeklyData.revenue, lastWeekData.revenue)
      },
      monthly: {
        revenue: monthlyData.revenue,
        orders: monthlyData.ordersCount,
        growth: calculateGrowth(monthlyData.revenue, lastMonthData.revenue)
      },
      customerAnalytics: {
        newUsers,
        returningUsers,
        avgOrdersPerUser,
        totalCustomers
      },
      timeAnalytics: {
        peakOrderTime,
        peakOrdersCount: maxOrdersInHour,
        hourlyData
      },
      orderAnalytics: {
        dailyData: dailyOrderData
      },
      topItems,
      parcelStats: {
        today: parcelToday,
        weekly: parcelWeekly,
        monthly: parcelMonthly
      }
    });
  } catch (error) {
    next(error);
  }
};
