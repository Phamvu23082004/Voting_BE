const organizationService = require("../services/organizationService");

const getOrganizations = async (req, res) => {
  try {
    const result = await organizationService.getOrganizations();
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
};

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
    const { username, password } = req.body;
    console.log(username, password);
    const result = await organizationService.login(username, password);
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
};

const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await organizationService.deleteOrganization(id);
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    console.error("Lỗi khi xoá organization:", error);
    return res.InternalError();
  }
};

const deleteAllOrganizations = async (req, res) => {
  try {
    const result = await organizationService.deleteAllOrganizations();
    return result.EC === 0
      ? res.success(result.result, result.EM)
      : res.error(result.EC, result.EM);
  } catch (error) {
    return res.InternalError();
  }
};

module.exports = {
  getOrganizations,
  registerTrustee,
  loginOrganization,
  deleteOrganization,
  deleteAllOrganizations
};
