const organizationService = require('../services/organizationService');

// CA tạo trustee
const registerTrustee = async (req, res) => {
  try {
    const result = await organizationService.createTrustee(req.body);
    res.status(201).json({
      success: true,
      message: 'Trustee created successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// CA / Trustee đăng nhập
const loginOrganization = async (req, res) => {
  try {
    const { name, password } = req.body;
    console.log(name, password);
    const result = await organizationService.login(name, password);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  registerTrustee,
  loginOrganization
};