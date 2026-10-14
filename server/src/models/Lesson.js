import mongoose from 'mongoose';
import { LESSON_LANGUAGES } from '../utils/languages.js';

const attachmentSchema = new mongoose.Schema(
  {
    // Language of this file (a lesson can have the same PDF in several languages)
    language: { type: String, enum: LESSON_LANGUAGES, default: 'en' },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      trim: true,
    }, // e.g. application/pdf

    size: {
      type: Number,
      min: 0,
    }, // bytes

    kind: {
      type: String,
      enum: ['pdf', 'image', 'audio'],
      required: true,
    },

    publicId: {
      type: String,
      required: true,
      trim: true,
    }, // Cloudinary public_id

    resourceType: {
      type: String,
      enum: ['image', 'raw', 'video'],
      required: true,
    }, // Cloudinary resource type
  },
  { _id: true }
);

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    content: {
      type: String,
      default: '',
    }, // text / markdown / HTML

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    order: {
      type: Number,
      default: 0,
      min: 0,
    },

    videoUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Lessons of a course in order
lessonSchema.index({ course: 1, order: 1 });

export default mongoose.model('Lesson', lessonSchema);