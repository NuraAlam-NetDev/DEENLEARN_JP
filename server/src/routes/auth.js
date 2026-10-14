import { Router } from 'express';
import {
  register,
  login,
  logout,
  refresh,
  me,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { uploadAvatar, removeAvatar } from '../controllers/avatarController.js';
import { uploadSingle, requireUploads, validateUpload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { forgotPassword, resetPassword } from '../controllers/passwordResetController.js';
import { forgotSchema, resetSchema } from '../validators/passwordReset.js';
import { loginLimiter, registerLimiter, refreshLimiter, uploadLimiter } from '../middleware/rateLimiters.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/auth.js';

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
// Forgot password: always answers the same way, so it cannot be used to find out who has an account
router.post('/forgot', loginLimiter, validate(forgotSchema), forgotPassword);
router.post('/reset', loginLimiter, validate(resetSchema), resetPassword);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', logout);
router.get('/me', protect, me);
router.patch('/me', protect, validate(updateProfileSchema), updateProfile);
router.put('/me/avatar', protect, uploadLimiter, uploadSingle, requireUploads, validateUpload(['image']), uploadAvatar);
router.delete('/me/avatar', protect, removeAvatar);
// loginLimiter only counts failures, which is what we want for guessing the current password
router.put('/password', protect, loginLimiter, validate(changePasswordSchema), changePassword);

export default router;
