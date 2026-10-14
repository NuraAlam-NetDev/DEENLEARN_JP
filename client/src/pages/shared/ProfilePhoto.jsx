import AvatarPicker from '../../components/AvatarPicker.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardBody } from '../../components/ui/Card.jsx';

// Profile for teachers and admins: the picture and the account details
export default function ProfilePhoto() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-brand-800">My profile</h1>
      <AvatarPicker />
      <Card>
        <CardBody className="space-y-1">
          <p className="font-display text-2xl font-bold text-brand-800" dir="auto">{user.name}</p>
          <p className="text-sm text-slate-500" dir="ltr">{user.email}</p>
          <p className="text-sm text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
        </CardBody>
      </Card>
    </div>
  );
}
