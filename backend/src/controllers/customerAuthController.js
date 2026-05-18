const customerAuthService = require('../services/customerAuthService');
const { sendSuccess } = require('../utils/response');

exports.loginOrRegister = async (req, res, next) => {
  try {
    const { phoneNumber, name } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Please provide a phone number' });
    }

    const { customer, token } = await customerAuthService.loginOrRegisterCustomer(phoneNumber, name);

    return sendSuccess(res, 200, 'Customer authenticated successfully', { customer, token });
  } catch (error) {
    next(error);
  }
};
