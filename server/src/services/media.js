import crypto from 'crypto';
import cloudinary, { cloudinaryConfigured } from '../config/cloudinary.js';
import { detectFileType } from '../utils/fileType.js';
import { httpError } from '../utils/httpError.js';

const RESOURCE_TYPE = { image: 'image', pdf: 'raw', audio: 'video', video: 'video' }; // Cloudinary treats audio and video as "video"
const KIND_LABEL = {
  image: 'images (JPG, PNG, WEBP, GIF)',
  pdf: 'PDF files',
  audio: 'audio (MP3, WAV, OGG, M4A)',
  video: 'videos (MP4, WEBM, MOV)',
};

// Canonical extension for the real detected type (never trust the user's file name for this)
const EXT_BY_MIME = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};
const DEFAULT_EXT = { image: 'jpg', pdf: 'pdf', audio: 'mp3', video: 'mp4' };

// multer decodes file names as latin1, which garbles Bengali/Arabic names. Repair if needed.
function fixFileName(name = 'file') {
  let fixed = name;
  if (!/[^\x00-\xff]/.test(name)) {
    const decoded = Buffer.from(name, 'latin1').toString('utf8');
    if (!decoded.includes('\uFFFD')) fixed = decoded;
  }
  return fixed.replace(/[\\/\r\n]/g, '_').slice(0, 200) || 'file';
}

// Keeps letters in any script (Bangla, Arabic, ...), digits, marks, _ and -.
// Everything else (spaces, slashes, symbols) becomes _, so the public_id is always safe.
function safeBaseName(fileName) {
  const dot = fileName.lastIndexOf('.');
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  return (
    base
      .normalize('NFC')
      .replace(/[^\p{L}\p{M}\p{N}_-]+/gu, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'file'
  );
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(options, (err, result) => (err ? reject(err) : resolve(result))).end(buffer);
  });
}

// Validates the real file type, uploads to Cloudinary, returns attachment-shaped metadata.
// allow: e.g. ['image'] or ['image', 'pdf', 'audio', 'video']
export async function uploadFile(file, { folder, allow = ['image', 'pdf', 'audio', 'video'] }) {
  if (!file) {
    throw httpError(400, 'No file uploaded. Send it as multipart/form-data in the field "file".');
  }

  const detected = detectFileType(file.buffer);
  if (!detected || !allow.includes(detected.kind)) {
    throw httpError(415, `Unsupported file type. Allowed: ${allow.map((k) => KIND_LABEL[k]).join(', ')}.`);
  }

  const resourceType = RESOURCE_TYPE[detected.kind];
  const ext = EXT_BY_MIME[detected.mime] || DEFAULT_EXT[detected.kind];

  // Readable name + short random suffix, so two uploads of "Lesson 1.pdf" never collide
  const suffix = crypto.randomBytes(4).toString('hex');
  const stem = `${safeBaseName(fixFileName(file.originalname))}-${suffix}`;
  // Raw files (PDF) keep the extension in public_id so the URL ends in .pdf
  const publicId = resourceType === 'raw' ? `${stem}.${ext}` : stem;

  let result;
  try {
    result = await uploadBuffer(file.buffer, {
      folder,
      public_id: publicId,
      resource_type: resourceType,
      overwrite: false,
      access_mode: 'public', // students must be able to open the file without signed URLs
    });
  } catch (err) {
    console.error('Cloudinary upload failed:', err?.message || err);
    throw httpError(502, 'File storage error, please try again.');
  }

  return {
    name: fixFileName(file.originalname), // original name with extension, shown to users
    url: result.secure_url,
    type: detected.mime,
    size: file.size,
    kind: detected.kind,
    publicId: result.public_id,
    resourceType,
  };
}

// Best-effort cleanup: never throws (a failed delete must not break the request)
export async function deleteAssets(items = []) {
  if (!cloudinaryConfigured) return;
  const list = items.filter((i) => i?.publicId);
  const results = await Promise.allSettled(
    list.map((i) =>
      cloudinary.uploader.destroy(i.publicId, { resource_type: i.resourceType || 'image', invalidate: true })
    )
  );
  results.forEach((r) => {
    if (r.status === 'rejected') console.error('Cloudinary delete failed:', r.reason?.message || r.reason);
  });
}