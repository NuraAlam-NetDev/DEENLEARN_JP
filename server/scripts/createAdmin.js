// Usage (from the repo root):
//   npm run create-admin -w server -- admin@example.com "StrongPass123" "Admin Name"
// - New email  -> creates an admin account
// - Existing   -> promotes that account to admin (password untouched)
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const [emailArg, password, name = 'Admin'] = process.argv.slice(2);
const email = emailArg?.trim().toLowerCase();

async function main() {
  if (!email) throw new Error('Usage: npm run create-admin -w server -- <email> <password> [name]');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set in server/.env');

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    existing.status = 'active';
    existing.approvalStatus = 'approved';
    await existing.save();
    console.log(`Promoted existing user to admin: ${email}`);
    return;
  }

  if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('Password must be 8+ characters with at least one letter and one number');
  }
  await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'admin',
    approvalStatus: 'approved',
  });
  console.log(`Admin created: ${email}`);
}

main()
  .catch((err) => {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
