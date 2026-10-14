import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { detailsSchema } from '../validators/details.js';
import { updateDetails, listStudentContacts } from '../controllers/contactController.js';

const router = Router();

// A student fills in their own details
router.patch('/auth/me/details', protect, authorize('student'), validate(detailsSchema), updateDetails);

// Admins (and the super admin) see them on the Student contacts page
router.get('/admin/student-contacts', protect, authorize('admin', 'super_admin'), listStudentContacts);

export default router;
