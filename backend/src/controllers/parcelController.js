const prisma = require('../config/prisma');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/errors');

// ─── Get Active Parcels (WAITING + READY) ───────────────────────────────────
exports.getParcels = async (req, res, next) => {
  try {
    const { id: restaurantId } = req.params;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const parcels = await prisma.parcel.findMany({
      where: {
        restaurantId,
        status: { in: ['WAITING', 'READY'] },
        createdAt: { gte: startOfToday, lt: endOfToday }
      },
      orderBy: { parcelNumber: 'asc' }
    });

    // Also get today's completed count for stats
    const completedToday = await prisma.parcel.count({
      where: {
        restaurantId,
        status: 'PICKED_UP',
        createdAt: { gte: startOfToday, lt: endOfToday }
      }
    });

    const todayRevenue = await prisma.parcel.aggregate({
      where: {
        restaurantId,
        status: 'PICKED_UP',
        createdAt: { gte: startOfToday, lt: endOfToday }
      },
      _sum: { amount: true }
    });

    return sendSuccess(res, 200, 'Parcels fetched successfully', {
      parcels,
      stats: {
        active: parcels.filter(p => p.status === 'WAITING').length,
        ready: parcels.filter(p => p.status === 'READY').length,
        completedToday,
        todayRevenue: parseFloat(todayRevenue._sum.amount || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Add New Parcel ─────────────────────────────────────────────────────────
exports.addParcel = async (req, res, next) => {
  try {
    const { id: restaurantId } = req.params;
    const { description, amount } = req.body;

    if (!description) {
      return next(new AppError('Description is required', 400));
    }

    // Auto-increment parcel number for today
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const lastParcel = await prisma.parcel.findFirst({
      where: {
        restaurantId,
        createdAt: { gte: startOfToday, lt: endOfToday }
      },
      orderBy: { parcelNumber: 'desc' }
    });

    const parcelNumber = (lastParcel?.parcelNumber || 0) + 1;

    const parcel = await prisma.parcel.create({
      data: {
        restaurantId,
        parcelNumber,
        description,
        amount: parseFloat(amount) || 0
      }
    });

    return sendSuccess(res, 201, 'Parcel added successfully', parcel);
  } catch (error) {
    next(error);
  }
};

// ─── Update Parcel Status ───────────────────────────────────────────────────
exports.updateParcelStatus = async (req, res, next) => {
  try {
    const { id: restaurantId, parcelId } = req.params;
    const { status } = req.body;

    const validStatuses = ['WAITING', 'READY', 'PICKED_UP', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return next(new AppError('Invalid status. Must be: WAITING, READY, PICKED_UP, or CANCELLED', 400));
    }

    const parcel = await prisma.parcel.findFirst({
      where: { id: parcelId, restaurantId }
    });

    if (!parcel) {
      return next(new AppError('Parcel not found', 404));
    }

    const updateData = { status };
    if (status === 'PICKED_UP') {
      updateData.pickedUpAt = new Date();
    }

    const updatedParcel = await prisma.parcel.update({
      where: { id: parcelId },
      data: updateData
    });

    return sendSuccess(res, 200, 'Parcel status updated', updatedParcel);
  } catch (error) {
    next(error);
  }
};

// ─── Remove Parcel (Mark as Picked Up) ──────────────────────────────────────
exports.removeParcel = async (req, res, next) => {
  try {
    const { id: restaurantId, parcelId } = req.params;

    const parcel = await prisma.parcel.findFirst({
      where: { id: parcelId, restaurantId }
    });

    if (!parcel) {
      return next(new AppError('Parcel not found', 404));
    }

    const updatedParcel = await prisma.parcel.update({
      where: { id: parcelId },
      data: { status: 'PICKED_UP', pickedUpAt: new Date() }
    });

    return sendSuccess(res, 200, 'Parcel removed (picked up)', updatedParcel);
  } catch (error) {
    next(error);
  }
};
