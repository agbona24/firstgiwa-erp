import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Route-level permission guard.
 * Renders children if the user has at least one of the required permissions.
 * Super Admin and Admin roles bypass all checks.
 */
export default function PermissionGuard({ permissions = [], children }) {
    const { user } = useAuth();

    // No permissions required — allow everyone
    if (!permissions || permissions.length === 0) return children;

    const userRoles = (user?.roles || []).map(r => r.name);
    const isSuperAdmin = userRoles.includes('Super Admin') || userRoles.includes('Admin');
    if (isSuperAdmin) return children;

    const userPermissions = user?.all_permissions || [];
    const hasPermission = permissions.some(p => userPermissions.includes(p));

    if (hasPermission) return children;

    // Redirect to dashboard with no access
    return <Navigate to="/dashboard" replace />;
}
