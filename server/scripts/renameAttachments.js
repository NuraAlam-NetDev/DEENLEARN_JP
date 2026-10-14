import 'dotenv/config';
import mongoose from 'mongoose';
import cloudinary from '../src/config/cloudinary.js';
import Lesson from '../src/models/Lesson.js';
import { connectDB } from '../src/config/db.js'; // db.js e export er naam check korben

const DRY_RUN = false; // pehle true diye output dekhen, tarpor false korben

const UUID_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.\w+)?$/i;

function safeBaseName(name) {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  return (
    base
      .normalize('NFC')
      .replace(/[^\p{L}\p{M}\p{N}_-]+/gu, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'file'
  );
}

await connectDB();

const lessons = await Lesson.find({ 'attachments.0': { $exists: true } });

for (const lesson of lessons) {
  let changed = false;

  for (const a of lesson.attachments) {
    if (!a.publicId) continue;
    const fileName = a.publicId.split('/').pop();
    if (!UUID_NAME.test(fileName)) continue; // already readable

    const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';
    const folder = `deenlearn/courses/${lesson.course}/lessons/${lesson._id}`;
    const newId = `${folder}/${safeBaseName(a.name)}-${Math.random().toString(16).slice(2, 10)}${ext}`;

    console.log(`${a.publicId}  ->  ${newId}`);
    if (DRY_RUN) continue;

    const result = await cloudinary.uploader.rename(a.publicId, newId, {
      resource_type: a.resourceType,
      overwrite: false,
    });
    a.publicId = result.public_id;
    a.url = result.secure_url;
    changed = true;
  }

  if (changed) await lesson.save();
}

console.log(DRY_RUN ? 'Dry run complete. Set DRY_RUN = false to apply.' : 'Rename complete.');
await mongoose.disconnect();