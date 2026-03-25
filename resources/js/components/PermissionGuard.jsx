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

    const userRoles = Array.isArray(user?.roles)
        ? user.roles
            .map(role => (typeof role === 'string' ? role : role?.name))
            .filter(Boolean)
        : [];
    const isSuperAdmin = userRoles.some(role => {
        const normalizedRole = String(role).toLowerCase();
        return normalizedRole === 'super admin' || normalizedRole === 'admin' || normalizedRole.includes('super') || normalizedRole.includes('admin');
    });
    if (isSuperAdmin) return children;

    const normalizePermissionList = (value) => {
        if (!value) return [];

        if (Array.isArray(value)) {
            return value
                .map(permission => (typeof permission === 'string' ? permission : permission?.name))
                .filter(Boolean);
        }

        if (value && typeof value === 'object') {
            return Object.keys(value).filter(key => Boolean(value[key]));
        }

        return [];
    };

    const userPermissions = [
        ...new Set([
            ...normalizePermissionList(user?.all_permissions),
            ...normalizePermissionList(user?.permissions),
            ...(Array.isArray(user?.roles)
                ? user.roles.flatMap(role => normalizePermissionList(role?.permissions))
                : []),
        ]),
    ];
    const hasPermission = permissions.some(p => userPermissions.includes(p));

    if (hasPermission) return children;

    // Redirect to dashboard with no access
    return <Navigate to="/dashboard" replace />;
}
