const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const signToken = (id) => {
  return jwt.sign({ id, role: 'CUSTOMER' }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d'
  });
};

exports.loginOrRegisterCustomer = async (phoneNumber, name) => {
  // Check if customer exists
  let customer = await prisma.customer.findUnique({
    where: { phoneNumber }
  });

  if (customer) {
    // Update last visited and name if provided
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: { 
        lastVisited: new Date(),
        ...(name && { name }) 
      }
    });
  } else {
    // Create new customer
    customer = await prisma.customer.create({
      data: {
        phoneNumber,
        ...(name && { name })
      }
    });
  }

  // Generate token
  const token = signToken(customer.id);

  return { customer, token };
};
