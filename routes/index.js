const express = require('express');
const router = express.Router();

const voterRoutes = require('./voterRoutes');
const caRoutes = require('./adminRoutes');

const votingRoutes = require('./votingRoutes');

const organizationRoutes = require('./organizationRoutes');


router.use('/voter', voterRoutes);
router.use('/ca', caRoutes);

router.use('/voting', votingRoutes);


router.use('/organization', organizationRoutes);

router.use('/zkp', require('./zkpRotes'));


module.exports = router;
