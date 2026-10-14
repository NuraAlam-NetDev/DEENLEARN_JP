import { Router } from 'express';
import { getQuestion, deleteQuestion, createReply } from '../controllers/discussionController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { contentLimiter } from '../middleware/rateLimiters.js';
import { createReplySchema } from '../validators/discussion.js';

// Students, the course's teacher and admins all use these; access to the course is checked inside.
// Listing / asking questions of a lesson lives under /api/lessons/:id/questions (see routes/lessons.js)
const router = Router();
router.use(protect);

router.get('/:id', getQuestion);
router.delete('/:id', deleteQuestion);
router.post('/:id/replies', contentLimiter, validate(createReplySchema), createReply);

export default router;
