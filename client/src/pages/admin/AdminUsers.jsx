import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Card } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import QueryState from '../../components/ui/QueryState.jsx';
import Alert from '../../components/Alert.jsx';
import { Spinner } from '../../components/Spinner.jsx';

const ROLE_TONE = {
  student: 'gray',
  teacher: 'green',
  admin: 'green',
  super_admin: 'gold',
};

const selectClass =
  'h-10 rounded-lg border border-brand-100 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/20';

// Same rule as the server: super admin manages everyone except other super admins and themselves;
// admin manages only students and teachers.
function canManage(me, target) {
  if (String(me._id) === String(target._id)) return false;
  if (target.role === 'super_admin') return false;
  if (me.role === 'super_admin') return true;
  return target.role === 'student' || target.role === 'teacher';
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const { user: me } = useAuth();
  const toast = useToast();
  const isSuper = me?.role === 'super_admin';

  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [approval, setApproval] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);

  // Search waits 300ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (q) params.set('q', q);
  if (role) params.set('role', role);
  if (approval) params.set('approval', approval);
  if (status) params.set('status', status);

  const { data, loading, error, reload } = useFetch(`/admin/users?${params}`);

  async function run(id, request, message) {
    setBusyId(id);
    try {
      await request();
      toast.success(message);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function handleBan(u) {
    if (!window.confirm(t('admin.users.confirmBan', { name: u.name }))) return;
    run(u._id, () => api.patch(`/admin/users/${u._id}/ban`, {}), t('admin.users.bannedToast'));
  }

  function handleUnban(u) {
    run(u._id, () => api.patch(`/admin/users/${u._id}/unban`), t('admin.users.unbannedToast'));
  }

  function handleApprove(u) {
    run(u._id, () => api.patch(`/admin/teachers/${u._id}/approve`), t('admin.users.approvedToast'));
  }

  function handleReject(u) {
    if (!window.confirm(t('admin.users.confirmReject', { name: u.name }))) return;
    run(u._id, () => api.patch(`/admin/teachers/${u._id}/reject`, {}), t('admin.users.rejectedToast'));
  }

  function handleRoleChange(u, newRole) {
    if (!window.confirm(t('admin.users.confirmRole', { name: u.name, role: t(`admin.roles.${newRole}`) }))) return;
    run(u._id, () => api.patch(`/admin/users/${u._id}/role`, { role: newRole }), t('admin.users.roleUpdated'));
  }

  const roleOptions = isSuper ? ['student', 'teacher', 'admin', 'super_admin'] : ['student', 'teacher'];

  return (
    <div>
      <h1 className="mb-5 text-3xl font-bold text-brand-800">{t('admin.users.title')}</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.users.searchPlaceholder')}
          className="h-10 min-w-[220px] flex-1 rounded-lg border border-brand-100 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="">{t('admin.users.allRoles')}</option>
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {t(`admin.roles.${r}`)}
            </option>
          ))}
        </select>
        <select
          value={approval}
          onChange={(e) => {
            setApproval(e.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="">{t('admin.users.anyApproval')}</option>
          <option value="pending">{t('admin.users.pendingTeachers')}</option>
          <option value="approved">{t('admin.users.approved')}</option>
          <option value="rejected">{t('admin.users.rejected')}</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="">{t('admin.users.anyStatus')}</option>
          <option value="active">{t('admin.users.active')}</option>
          <option value="banned">{t('admin.users.banned')}</option>
        </select>
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.users.length === 0}
        emptyTitle={t('admin.users.empty')}
        emptyText={t('admin.users.emptyText')}
      >
              {data && data.users.length > 0 && (
        <div className="space-y-3">
          {data.users.map((u) => {
            const manageable = canManage(me, u);
            const busy = busyId === u._id;
            return (
              <Card key={u._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800" dir="auto">
                    {u.name}
                  </p>
                  <p className="truncate text-sm text-slate-500" dir="ltr">
                    {u.email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone={ROLE_TONE[u.role]}>{t(`admin.roles.${u.role}`)}</Badge>
                    {u.role === 'teacher' && u.approvalStatus === 'pending' && (
                      <Badge tone="gold">{t('admin.users.pendingBadge')}</Badge>
                    )}
                    {u.role === 'teacher' && u.approvalStatus === 'rejected' && (
                      <Badge tone="red">{t('admin.users.rejectedBadge')}</Badge>
                    )}
                    {u.status === 'banned' && <Badge tone="red">{t('admin.users.bannedBadge')}</Badge>}
                  </div>
                </div>

                {manageable && (
                  <div className="flex flex-wrap items-center gap-2">
                    {u.role === 'teacher' && u.approvalStatus !== 'approved' && (
                      <Button size="sm" loading={busy} onClick={() => handleApprove(u)}>
                        {t('admin.users.approve')}
                      </Button>
                    )}
                    {u.role === 'teacher' && u.approvalStatus === 'pending' && (
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => handleReject(u)}>
                        {t('admin.users.reject')}
                      </Button>
                    )}
                    {u.status === 'banned' ? (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => handleUnban(u)}>
                        {t('admin.users.unban')}
                      </Button>
                    ) : (
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => handleBan(u)}>
                        {t('admin.users.ban')}
                      </Button>
                    )}
                    {isSuper && (
                      <select
                        value={u.role}
                        disabled={busy}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className={selectClass}
                        aria-label={t('admin.users.changeRole', { name: u.name })}
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>
                            {t(`admin.roles.${r}`)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      </QueryState>

      {data && <Pagination page={page} pages={data.pages} onChange={setPage} />}
    </div>
  );
}
