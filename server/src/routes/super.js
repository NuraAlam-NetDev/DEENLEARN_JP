import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { httpError } from '../utils/httpError.js';
import { listTransactions, reports, priceList } from '../controllers/financeController.js';
import { listAudit } from '../controllers/auditController.js';
import { transactionsQuery, auditQuery } from '../validators/finance.js';

// Super admin only. Anyone else gets a plain 404, so the admin side never learns this area exists.
const router = Router();
router.use(protect, (req, _res, next) =>
  req.user.role === 'super_admin' ? next() : next(httpError(404, 'Not found'))
);

router.get('/audit', validate(auditQuery, 'query'), listAudit);
router.get('/transactions', validate(transactionsQuery, 'query'), listTransactions);
router.get('/reports', reports);
router.get('/prices', priceList);

export default router;
