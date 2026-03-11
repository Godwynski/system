import { getUserRole } from '@/lib/auth-helpers';
import { ReactNode } from 'react';

type AllowedRole = 'admin' | 'librarian' | 'staff' | 'student';

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: AllowedRole[];
}

export default async function RoleGate({ children, allowedRoles }: RoleGateProps) {
  const userRole = (await getUserRole()) as AllowedRole;

  if (!userRole) {
    return null; // Not authenticated
  }

  // Admin always has access to everything
  if (userRole === 'admin') {
    return <>{children}</>;
  }

  // Check if current role is in the allowed lists
  if (allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }

  // If role is not allowed, do not render children
  return null;
}
