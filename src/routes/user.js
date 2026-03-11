const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.put('/updateuser/:id', userController.updateUser);
router.get('/:id', userController.getUser);
router.get('/all', userController.getAllUsers);

module.exports = router;
