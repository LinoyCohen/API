const express = require('express');
const userController = require('./../controllers/userController');

const router = express.Router();

router.post('/signup', userController.signup);
router.post('/login', userController.login);

router.patch('/reset-password/:token', userController.resetPassword);

router.get('/about/:ID', userController.protect, userController.getUser);

router.post(
  '/delete-user/:ID',
  userController.protect,
  userController.softDelete
);
router.post(
  '/repair-user/:ID',
  userController.protect,
  userController.repairUserAfterDisabled
);

router.patch('/update/:ID', userController.protect, userController.updateUser); // Add protect

router.route('/').get(userController.protect, userController.getAllUsers);

module.exports = router;
