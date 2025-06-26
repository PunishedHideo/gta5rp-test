import express from 'express';
import {
  loginController,
  registerController,
  authController,
  authLogoutController,
} from './controller.js';

const router = express.Router();

router.post('/api/login', loginController);
router.post('/api/register', registerController);
router.get('/api/auth', authController);
router.get('/api/auth/logout', authLogoutController);

export default router;
