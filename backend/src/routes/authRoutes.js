const express = require('express');
const router = express.Router();
const { register, login, registerSponsor } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/register-sponsor', registerSponsor);

module.exports = router;
