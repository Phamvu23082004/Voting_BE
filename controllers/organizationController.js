const organizationService = require("../services/organizationService");

// CA tạo trustee
const registerTrustee = async (req, res) => {
  try {
    const result = await organizationService.createTrustee(req.body);
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
};

// CA / Trustee đăng nhập
const loginOrganization = async (req, res) => {
  try {
    const { name, password } = req.body;
    console.log(name, password);
    const result = await organizationService.login(name, password);
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
};

module.exports = {
  registerTrustee,
  loginOrganization,
};
