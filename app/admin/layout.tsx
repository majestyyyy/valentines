import { ReactNode } from 'react';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Admin layout without MobileGuard - allows desktop access
  return <>{children}</>;
}
