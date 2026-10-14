import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { createParentLink, listParentLinks, revokeParentLink, parentView } from '../controllers/parentController.js';

const router = Router();

// The student manages the links
router.post('/parent-links', protect, authorize('student'), createParentLink);
router.get('/parent-links', protect, authorize('student'), listParentLinks);
router.delete('/parent-links/:id', protect, authorize('student'), revokeParentLink);

// Public, read-only, with the secret link
router.get('/parent/:token', parentView);

export default router;
