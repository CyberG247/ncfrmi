import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

export default function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { session, role, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="container-page py-20 text-center text-muted-foreground animate-pulse">Checking privileges…</div>;
  if (!session) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />; // unauthorized, redirect to home page
  }

  return <>{children}</>;
}
