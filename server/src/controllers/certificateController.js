
import Certificate from '../models/Certificate.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import {
  getCertificateStatus,
  issueCertificate,
} from '../services/certificates.js';
import { renderCertificatePdf } from '../services/certificatePdf.js';

const CODE_FORMAT = /^DL-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
const MAX_CLAIMABLE = 50;

// POST /api/courses/:courseId/certificate
export const claimCertificate = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const enrolled = await Enrollment.exists({
    student: req.user._id,
    course: courseId,
  });

  if (!enrolled) {
    throw httpError(403, 'You are not enrolled in this course');
  }

  const existing = await Certificate.findOne({
    student: req.user._id,
    course: courseId,
  });

  if (existing) {
    return res.json({ certificate: existing });
  }

  const status = await getCertificateStatus(req.user._id, courseId);

  if (!status.allLessonsDone) {
    throw httpError(
      400,
      'Complete every lesson of the course to get your certificate'
    );
  }

  if (!status.eligible) {
    const titles = status.pendingQuizzes
      .map((q) => q.lessonTitle)
      .join(', ');

    throw httpError(
      400,
      `Pass the required quiz${
        status.pendingQuizzes.length === 1 ? '' : 'zes'
      } first: ${titles}`
    );
  }

  const course = await Course.findById(courseId).populate(
    'teacher',
    'name'
  );

  if (!course) {
    throw httpError(404, 'Course not found');
  }

  const { certificate, created } = await issueCertificate({
    student: req.user,
    course,
    recipientName: req.body.recipientName,
  });

  res.status(created ? 201 : 200).json({ certificate });
});

// GET /api/certificates/mine
export const myCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({
    student: req.user._id,
  })
    .sort({ issuedAt: -1 })
    .lean();

  const issuedFor = new Set(
    certificates.map((c) => String(c.course))
  );

  const finished = await Enrollment.find({
    student: req.user._id,
    progress: 100,
  })
    .sort({ updatedAt: -1 })
    .limit(MAX_CLAIMABLE)
    .populate('course', 'title')
    .lean();

  const open = finished.filter(
    (e) =>
      e.course &&
      !issuedFor.has(String(e.course._id))
  );

  const claimable = await Promise.all(
    open.map(async (e) => {
      const status = await getCertificateStatus(
        req.user._id,
        e.course._id
      );

      return {
        courseId: e.course._id,
        courseTitle: e.course.title,
        eligible: status.eligible,
        pendingQuizzes: status.pendingQuizzes,
      };
    })
  );

  res.json({
    certificates,
    claimable,
  });
});

export const downloadCertificate = asyncHandler(async (req, res) => {

  const certificate = await Certificate.findOne({
    _id: req.params.id,
    student: req.user._id,
  }).lean();


  if (!certificate) {
    throw httpError(404, 'Certificate not found');
  }


  const bytes = await renderCertificatePdf(certificate, {
    verifyUrl: `${env.clientUrl}/verify/${certificate.code}`,
  });


  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="Deenlearn-Certificate-${certificate.code}.pdf"`,
    'Cache-Control': 'private, no-store',
    'Content-Length': bytes.length,
  });


  res.send(Buffer.from(bytes));

});
// GET /api/certificates/verify/:code
export const verifyCertificate = asyncHandler(async (req, res) => {
  const code = String(req.params.code)
    .trim()
    .toUpperCase();

  const certificate = CODE_FORMAT.test(code)
    ? await Certificate.findOne({ code }).lean()
    : null;

  if (!certificate) {
    throw httpError(
      404,
      'No certificate was found with this code'
    );
  }

  res.json({
    valid: true,
    certificate: {
      code: certificate.code,
      recipientName: certificate.recipientName,
      courseTitle: certificate.courseTitle,
      teacherName: certificate.teacherName,
      issuedAt: certificate.issuedAt,
    },
  });
});