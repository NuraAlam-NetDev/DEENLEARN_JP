import { Router } from 'express';
import { myNotes } from '../controllers/noteController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { myNotesQuery } from '../validators/note.js';

// Reading / writing the note of ONE lesson lives under /api/lessons/:id/note (see routes/lessons.js)
const router = Router();
router.use(protect, authorize('student'));

router.get('/', validate(myNotesQuery, 'query'), myNotes);

export default router;
