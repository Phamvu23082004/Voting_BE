const express = require('express');
const router = express.Router();

const voterRoutes = require('./voterRoutes');
const caRoutes = require('./adminRoutes');
const organizationRoutes = require('./organizationRoutes');

router.use('/voter', voterRoutes);
router.use('/ca', caRoutes);
router.use('/organization', organizationRoutes);

module.exports = router;
