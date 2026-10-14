import mongoose from 'mongoose';

// A scheduled live session (Zoom / Google Meet / any https link) for one course
const liveClassSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    startsAt: { type: Date, required: true, index: true },
    durationMin: { type: Number, default: 60, min: 5, max: 300 },
    joinUrl: { type: String, required: true, maxlength: 500 },
    reminded: { type: Boolean, default: false }, // the "starts soon" notice was sent
  },
  { timestamps: true }
);

export default mongoose.model('LiveClass', liveClassSchema);
