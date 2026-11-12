import { redirect } from 'next/navigation';
import { ADMIN_HOME } from '@/lib/app/admin-tabs';

export default function AdminIndex() {
  redirect(ADMIN_HOME);
}
