import BottomNav from '@/components/app/BottomNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav variant="admin" />
    </>
  );
}
