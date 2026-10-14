import { Router } from 'express';
import { myBookmarks } from '../controllers/bookmarkController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { myBookmarksQuery } from '../validators/bookmark.js';

// Adding / removing a bookmark lives under /api/lessons/:id/bookmark (see routes/lessons.js)
const router = Router();
router.use(protect, authorize('student'));

router.get('/', validate(myBookmarksQuery, 'query'), myBookmarks);

export default router;
