import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth.js';
import DashboardLayout from './DashboardLayout.jsx';

// Admin portal theme: the green "brand" palette becomes red. Active only while this layout is open.
const ADMIN_THEME_CSS = `
html.admin-theme {
  --color-brand-50: #fef2f2;
  --color-brand-100: #fee2e2;
  --color-brand-200: #fecaca;
  --color-brand-300: #fca5a5;
  --color-brand-400: #f87171;
  --color-brand-500: #ef4444;
  --color-brand-600: #dc2626;
  --color-brand-700: #b91c1c;
  --color-brand-800: #991b1b;
  --color-brand-900: #7f1d1d;
  --color-brand-950: #450a0a;
}`;

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Add the theme class to <html> (modals are portaled to <body>, so the class must sit on <html>)
  // and inject the CSS. Both are removed when the admin area is left.
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'admin-theme-style';
    style.textContent = ADMIN_THEME_CSS;
    document.head.appendChild(style);
    document.documentElement.classList.add('admin-theme');
    return () => {
      style.remove();
      document.documentElement.classList.remove('admin-theme');
    };
  }, []);

  const links = [
    { to: '/admin', label: t('admin.layout.overview'), icon: 'chart', end: true },
    { to: '/admin/users', label: t('admin.layout.users'), icon: 'users' },
    { to: '/admin/courses', label: t('admin.layout.courses'), icon: 'book' },
    { to: '/admin/students', label: t('progress.nav'), icon: 'users' },
    { to: '/admin/orders', label: t('adminOrders.nav'), icon: 'award' },
    { to: '/admin/finance', label: t('adminFinance.nav'), icon: 'chart' },
    { to: '/admin/coupons', label: t('extras.nav.coupons'), icon: 'award' },
    { to: '/admin/prices', label: 'Price changes', icon: 'chart' },
    { to: '/admin/plans', label: 'Installments owed', icon: 'chart' },
    { to: '/admin/overview', label: 'Overview', icon: 'chart' },
    { to: '/admin/access-requests', label: 'Free-access requests', icon: 'users' },
    { to: '/admin/refunds', label: 'Refunds', icon: 'award' },
    { to: '/admin/teacher-approvals', label: 'Teacher approvals', icon: 'users' },
    { to: '/admin/bulk-email', label: 'Bulk email', icon: 'chart' },
    { to: '/admin/coupon-report', label: 'Discount code report', icon: 'award' },
    { to: '/admin/monthly-report', label: 'Monthly report', icon: 'chart' },
    { to: '/admin/profile', label: 'My profile', icon: 'users' },
    { to: '/admin/student-contacts', label: 'Student contacts', icon: 'users' },
    { to: '/admin/email-log', label: 'Email log', icon: 'chart' },
  ];
  // Only the super admin manages other admins
  if (user?.role === 'super_admin') {
    links.push({ to: '/admin/admins', label: t('admin.layout.admins'), icon: 'users' });
    links.push({ to: '/admin/audit', label: t('auditLog.nav'), icon: 'chart' });
    links.push({ to: '/admin/grace-report', label: 'Grace report', icon: 'chart' });
  }

  return <DashboardLayout portal="admin" links={links} />;
}
