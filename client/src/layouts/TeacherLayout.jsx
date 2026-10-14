import { useTranslation } from 'react-i18next';
import DashboardLayout from './DashboardLayout.jsx';

export default function TeacherLayout() {
  const { t } = useTranslation();

  const links = [
    { to: '/teacher', label: t('teacher.nav.dashboard'), icon: 'home', end: true },
    { to: '/teacher/courses', label: t('teacher.nav.courses'), icon: 'book' },
    { to: '/teacher/students', label: t('progress.nav'), icon: 'users' },
    { to: '/teacher/cash', label: t('cash.navTeacher'), icon: 'award' },
    { to: '/teacher/coupons', label: t('extras.nav.coupons'), icon: 'award' },
    { to: '/teacher/plans', label: 'Student installments', icon: 'users' },
    { to: '/teacher/earnings', label: 'Earnings', icon: 'chart' },
    { to: '/teacher/live', label: 'Live classes', icon: 'chart' },
    { to: '/teacher/profile', label: 'My profile', icon: 'users' },
  ];

  return <DashboardLayout portal="teacher" links={links} />;
}