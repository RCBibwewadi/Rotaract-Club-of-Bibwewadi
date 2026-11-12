import { redirect } from 'next/navigation';
import { HOME_TAB } from '@/lib/app/tabs';

export default function AppIndex() {
  redirect(HOME_TAB);
}
