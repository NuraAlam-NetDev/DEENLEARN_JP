import mongoose from 'mongoose';

// Issued once a student finishes a course. The text is copied in (snapshot), so the
// certificate stays valid and unchanged even if the course is renamed or deleted later.
const certificateSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    // Public verification code, e.g. DL-7K4Q-X9MD-2PTA
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    recipientName: { type: String, required: true, trim: true, maxlength: 80 },
    courseTitle: { type: String, required: true, trim: true, maxlength: 150 },
    teacherName: { type: String, trim: true, maxlength: 100, default: '' },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One certificate per student per course
certificateSchema.index({ student: 1, course: 1 }, { unique: true });
certificateSchema.index({ student: 1, issuedAt: -1 });

export default mongoose.model('Certificate', certificateSchema);
