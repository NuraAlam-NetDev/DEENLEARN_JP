import { Router } from 'express';
import { deleteReply, setReplyAccepted } from '../controllers/discussionController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { acceptReplySchema } from '../validators/discussion.js';

const router = Router();
router.use(protect);

router.delete('/:id', deleteReply);
router.patch('/:id/accept', validate(acceptReplySchema), setReplyAccepted);

export default router;
