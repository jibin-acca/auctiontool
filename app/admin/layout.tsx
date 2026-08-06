import { AdminGuard } from '@/components/arena/admin-guard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
