const express = require('express');
const router = express.Router();

// Import các routes khác
const voterRoutes = require('./voterRoutes');
const caRoutes = require('./adminRoutes');

// Sử dụng route cử tri
router.use('/voter', voterRoutes);
router.use('/ca', caRoutes);
router.use('/organization', require('./organizationRoutes'));

// Có thể thêm các route khác ở đây (nếu cần)

// Export router
module.exports = router;
