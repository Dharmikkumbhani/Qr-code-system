const prisma = require('../config/prisma');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/errors');

// GET all categories and items for a restaurant
exports.getMenu = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    
    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return next(new AppError('Restaurant not found', 404));

    const categories = await prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          orderBy: { name: 'asc' }
        }
      }
    });
    
    return sendSuccess(res, 200, 'Menu fetched successfully', { restaurant, categories });
  } catch (error) {
    next(error);
  }
};

// POST add a category
exports.addCategory = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { name } = req.body;

    if (!name) return next(new AppError('Category name is required', 400));

    // Get max sort order
    const lastCategory = await prisma.category.findFirst({
      where: { restaurantId },
      orderBy: { sortOrder: 'desc' }
    });
    
    const sortOrder = lastCategory ? lastCategory.sortOrder + 1 : 0;

    const category = await prisma.category.create({
      data: {
        name,
        restaurantId,
        sortOrder
      },
      include: { menuItems: true } // Include empty array for UI consistency
    });

    return sendSuccess(res, 201, 'Category added', category);
  } catch (error) {
    next(error);
  }
};

// POST add a menu item
exports.addMenuItem = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { categoryId, name, description, price, imageUrl, isVeg, isAvailable } = req.body;

    if (!categoryId || !name || price === undefined) {
      return next(new AppError('Category, name, and price are required', 400));
    }

    const item = await prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId,
        name,
        description: description || null,
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        isVeg: isVeg !== undefined ? isVeg : true,
        isAvailable: isAvailable !== undefined ? isAvailable : true
      }
    });

    return sendSuccess(res, 201, 'Menu item added', item);
  } catch (error) {
    next(error);
  }
};

// DELETE a menu item
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    await prisma.menuItem.delete({ where: { id: itemId } });
    return sendSuccess(res, 200, 'Menu item deleted');
  } catch (error) {
    next(error);
  }
};

// PUT edit a menu item
exports.editMenuItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { name, description, price, imageUrl, isVeg, isAvailable } = req.body;
    
    // We round to 2 decimals if price is provided to avoid floating point issues
    const priceParsed = price !== undefined ? Math.round(parseFloat(price) * 100) / 100 : undefined;

    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name,
        description,
        price: priceParsed,
        imageUrl,
        isVeg,
        isAvailable
      }
    });
    return sendSuccess(res, 200, 'Menu item updated', item);
  } catch (error) {
    next(error);
  }
};

// PUT edit a category
exports.editCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name }
    });
    return sendSuccess(res, 200, 'Category updated', category);
  } catch (error) {
    next(error);
  }
};

// DELETE a category
exports.deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    await prisma.menuItem.deleteMany({ where: { categoryId } });
    await prisma.category.delete({ where: { id: categoryId } });
    return sendSuccess(res, 200, 'Category deleted');
  } catch (error) {
    next(error);
  }
};
