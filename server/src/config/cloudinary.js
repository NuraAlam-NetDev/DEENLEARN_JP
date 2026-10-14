import { v2 as cloudinary } from 'cloudinary';

// Imported after dotenv/config (see server.js), so process.env is populated.
const {
  CLOUDINARY_CLOUD_NAME: cloud_name,
  CLOUDINARY_API_KEY: api_key,
  CLOUDINARY_API_SECRET: api_secret,
  CLOUDINARY_URL,
} = process.env;

export const cloudinaryConfigured = Boolean(CLOUDINARY_URL || (cloud_name && api_key && api_secret));

// Not required at startup: the rest of the API works without it,
// and upload routes answer 503 until the keys are set.
if (cloudinaryConfigured && !CLOUDINARY_URL) {
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
} else if (cloudinaryConfigured) {
  cloudinary.config({ secure: true });
}

export default cloudinary;
