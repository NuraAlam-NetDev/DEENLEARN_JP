import multer from 'multer';
import { cloudinaryConfigured } from '../config/cloudinary.js';
import { httpError } from '../utils/httpError.js';
import { detectFileType } from '../utils/fileType.js';

export const MAX_FILE_MB = Number(process.env.MAX_FILE_MB || 10);

// Size caps per REAL file kind (MB). Each is also limited by MAX_FILE_MB.
const KIND_MAX_MB = {
  image: Math.min(Number(process.env.IMAGE_MAX_MB || 5), MAX_FILE_MB),
  pdf: Math.min(Number(process.env.PDF_MAX_MB || 25), MAX_FILE_MB),
  audio: MAX_FILE_MB,
};

// First, cheap check on the type the browser CLAIMS. The real check is on the bytes (validateUpload).
// application/octet-stream is allowed because some systems send it for MP3 and M4A files.
const CLAIMED_TYPE =
  /^(image\/(jpeg|png|webp|gif)|application\/pdf|audio\/(mpeg|mp3|wav|x-wav|ogg|mp4|x-m4a|m4a)|application\/octet-stream)$/i;

// Files are kept in memory only long enough to validate and stream them to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024, files: 1, fields: 5 },
  fileFilter(_req, file, cb) {
    if (!CLAIMED_TYPE.test(file.mimetype)) return cb(httpError(415, 'This file type is not allowed'));
    cb(null, true);
  },
});

export const uploadSingle = upload.single('file');

export function requireUploads(_req, _res, next) {
  if (!cloudinaryConfigured) {
    return next(httpError(503, 'File uploads are not configured on the server'));
  }
  next();
}

// Runs AFTER uploadSingle. Checks the real bytes, that this kind of file is allowed on this route,
// and the size cap for that kind. Sets req.file.detected = { kind, mime, ext }.
export function validateUpload(allowed = ['image', 'pdf', 'audio']) {
  return (req, _res, next) => {
    const file = req.file;
    if (!file) return next(httpError(400, 'No file uploaded. Send it as multipart/form-data in the field "file".'));
    if (!file.size) return next(httpError(400, 'The file is empty'));

    const detected = detectFileType(file.buffer);
    if (!detected) {
      return next(httpError(415, 'Unsupported or unreadable file. Allowed: JPG, PNG, WEBP, GIF, PDF, MP3, WAV, OGG, M4A'));
    }
    if (!allowed.includes(detected.kind)) {
      return next(httpError(415, `This kind of file (${detected.kind}) is not allowed here`));
    }

    const capMb = KIND_MAX_MB[detected.kind];
    if (file.size > capMb * 1024 * 1024) {
      return next(httpError(413, `This ${detected.kind} is too large (max ${capMb} MB)`));
    }

    file.detected = detected;
    next();
  };
}
