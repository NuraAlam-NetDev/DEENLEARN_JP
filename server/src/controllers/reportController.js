import { asyncHandler } from '../utils/asyncHandler.js';
import { buildStudentReport } from '../services/studentReport.js';

// GET /api/enrollments/report  (the student's own report, all their courses)
export const myReport = asyncHandler(async (req, res) => {
  const data = await buildStudentReport({ studentId: req.user._id });
  res.json(data);
});
