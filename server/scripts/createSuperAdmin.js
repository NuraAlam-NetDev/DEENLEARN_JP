// Usage (server folder theke):
//   node scripts/createSuperAdmin.js <email> <password> [name]
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const [emailArg, password, name = 'Super Admin'] = process.argv.slice(2);
const email = emailArg?.trim().toLowerCase();

async function main() {
  if (!email) throw new Error('Usage: node scripts/createSuperAdmin.js <email> <password> [name]');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set in server/.env');

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

    const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'super_admin';
    existing.status = 'active';
    existing.approvalStatus = 'approved';
    if (password) {
      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        throw new Error('Password must be 8+ characters with at least one letter and one number');
      }
      existing.passwordHash = await bcrypt.hash(password, 12);
    }
    await existing.save();
    console.log(`Promoted to super admin${password ? ' and password updated' : ''}: ${email}`);
    return;
  }

  if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('Password must be 8+ characters with at least one letter and one number');
  }
  await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'super_admin',
    approvalStatus: 'approved',
  });
  console.log(`Super admin created: ${email}`);
}

main()
  .catch((err) => {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());