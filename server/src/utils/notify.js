import Enrollment from '../models/Enrollment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from './email.js';

// Creates an in-app notification and, only when asked, an email (every email is written to the email log).
// Never throws: a failed notification must not break the action that caused it.
export async function notify(userId, { type, title, body = '', link = '', email = false, kind = 'notification' }) {
  try {
    await Notification.create({ user: userId, type, title, body, link });
    if (email) {
      const user = await User.findById(userId).select('name email').lean();
      if (user) {
        const site = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
        await sendEmail({
          to: user.email,
          subject: `Deenlearn: ${title}`,
          text: `Hi ${user.name},\n\n${body}\n\nOpen Deenlearn: ${site}${link}`,
          kind,
          userId: user._id,
        });
      }
    }
  } catch (err) {
    console.error('notify failed:', err.message);
  }
}

// In-app notice for many students at once (no email, to avoid flooding inboxes)
export async function notifyEnrolled(courseId, { type, title, body = '', link = '' }) {
  try {
    const students = await Enrollment.find({ course: courseId }).distinct('student');
    if (students.length) {
      await Notification.insertMany(students.map((user) => ({ user, type, title, body, link })));
    }
  } catch (err) {
    console.error('notifyEnrolled failed:', err.message);
  }
}

// In-app notice to everyone with one of these roles (for example all admins). No email.
export async function notifyStaff(roles, { type, title, body = '', link = '' }) {
  try {
    const ids = await User.find({ role: { $in: roles }, status: 'active' }).distinct('_id');
    if (ids.length) {
      await Notification.insertMany(ids.map((user) => ({ user, type, title, body, link })));
    }
  } catch (err) {
    console.error('notifyStaff failed:', err.message);
  }
}
