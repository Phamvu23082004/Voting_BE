const express = require('express');
const router = express.Router();
const controller = require('../controllers/organizationController');
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');

// CA tạo trustee
router.post('/register-trustee', authMiddleware, requireRole('CA'), controller.registerTrustee);

// CA hoặc Trustee đăng nhập
router.post('/login', controller.loginOrganization);

module.exports = router;
