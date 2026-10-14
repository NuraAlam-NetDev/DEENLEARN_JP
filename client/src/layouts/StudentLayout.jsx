import { useTranslation } from 'react-i18next';
import DashboardLayout from './DashboardLayout.jsx';

export default function StudentLayout() {
  const { t } = useTranslation();

  const links = [
    { to: '/student', label: t('student.nav.dashboard'), icon: 'home', end: true },
    { to: '/student/courses', label: t('student.nav.courses'), icon: 'book' },
    { to: '/student/bookmarks', label: t('student.nav.bookmarks'), icon: 'bookmark' },
    { to: '/student/notes', label: t('student.nav.notes'), icon: 'clipboard' },
    { to: '/student/certificates', label: t('student.nav.certificates'), icon: 'award' },
    { to: '/student/report', label: t('report.nav'), icon: 'chart' },
    { to: '/student/orders', label: t('orders.nav'), icon: 'award' },
    { to: '/student/notifications', label: t('extras.nav.notifications'), icon: 'chart' },
    { to: '/student/wishlist', label: t('extras.nav.wishlist'), icon: 'award' },
    { to: '/student/quran', label: 'Quran', icon: 'award' },
    { to: '/student/prayer', label: 'Prayer times', icon: 'chart' },
    { to: '/student/live', label: 'Live classes', icon: 'chart' },
    { to: '/student/parent', label: 'Parent view', icon: 'users' },
    { to: '/student/quiz-results', label: 'Quiz results', icon: 'chart' },
    { to: '/student/profile', label: t('student.nav.profile'), icon: 'user' },
  ];

  return <DashboardLayout portal="student" links={links} />;
}