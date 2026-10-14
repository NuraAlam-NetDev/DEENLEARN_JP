import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth.js';
import Alert from './Alert.jsx';

// The teacher API answers 403 until an admin approves the account, so don't show the
// course pages (they would only show errors) until then.
export default function ApprovedTeacherRoute() {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (user.approvalStatus === 'pending') {
    return <Alert type="warning">{t('teacher.approval.pending')}</Alert>;
  }
  if (user.approvalStatus === 'rejected') {
    return (
      <Alert type="error">
        {user.rejectionReason
          ? t('teacher.approval.rejectedReason', { reason: user.rejectionReason })
          : t('teacher.approval.rejected')}
      </Alert>
    );
  }
  return <Outlet />;
}