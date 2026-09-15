const express = require('express');
const router = express.Router();
const { registerForEvent, getMyRegistrations, cancelRegistration } = require('../controllers/registrationController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, registerForEvent);
router.get('/me', authMiddleware, getMyRegistrations);
router.delete('/:id', authMiddleware, cancelRegistration);

module.exports = router;
