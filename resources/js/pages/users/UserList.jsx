import { useState, useEffect, useMemo } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import SearchBar from '../../components/ui/SearchBar';
import FilterDropdown from '../../components/ui/FilterDropdown';
import SlideOut from '../../components/ui/SlideOut';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import userAPI from '../../services/userAPI';
import { exportSelectedToCSV } from '../../utils/exportUtils';

export default function UserList() {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserDetail, setShowUserDetail] = useState(false);
    const [openActionMenu, setOpenActionMenu] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        roles: [],
        password: '',
        password_confirmation: '',
        send_invite: false
    });

    // Role management state
    const [showRoleManager, setShowRoleManager] = useState(false);
    const [permissions, setPermissions] = useState({});
    const [selectedRole, setSelectedRole] = useState(null);
    const [roleFormData, setRoleFormData] = useState({ name: '', permissions: [] });
    const [showRoleForm, setShowRoleForm] = useState(false);
    const [roleLoading, setRoleLoading] = useState(false);

    // Reset password state
    const [showResetPw, setShowResetPw] = useState(false);
    const [resetPwUser, setResetPwUser] = useState(null);
    const [resetPwData, setResetPwData] = useState({ password: '', password_confirmation: '' });

    // Set PIN state
    const [showSetPin, setShowSetPin] = useState(false);
    const [pinUser, setPinUser] = useState(null);
    const [pinValue, setPinValue] = useState('');

    const toast = useToast();
    const confirm = useConfirm();

    // Fetch users and roles from API
    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [searchQuery, roleFilter, statusFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (roleFilter) params.role = roleFilter;
            if (statusFilter === 'active') params.is_active = true;
            if (statusFilter === 'inactive') params.is_active = false;

            const response = await userAPI.getUsers(params);
            
            // Transform API data to match UI expectations
            const transformedUsers = (response.data || []).map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.roles?.[0] || 'No Role',
                roles: user.roles || [],
                status: user.status || (user.is_active ? 'active' : 'inactive'),
                last_login: user.last_login_at,
                created_at: user.created_at,
                phone: user.phone,
                department: user.department,
                permissions: user.permissions || [],
                has_pin: user.has_pin || false
            }));

            setUsers(transformedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await userAPI.getRoles();
            setRoles(response.data || []);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await userAPI.getPermissions();
            setPermissions(response.data || {});
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    const roleOptions = useMemo(() => {
        return roles.map(role => ({ value: role.name, label: role.name }));
    }, [roles]);

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
    ];

    const departments = [
        'Management',
        'Operations',
        'Finance',
        'Sales',
        'Procurement',
        'Production',
        'Admin',
        'Logistics',
        'General'
    ];

    // Mock activity log
    const getActivityLog = (user) => {
        const logs = [
            { action: 'Logged in', timestamp: '2026-01-31 10:30 AM' },
            { action: 'Created PO-2026-001', timestamp: '2026-01-31 09:15 AM' },
            { action: 'Approved SO-2026-045', timestamp: '2026-01-30 04:45 PM' },
            { action: 'Updated inventory item #1234', timestamp: '2026-01-30 02:20 PM' },
            { action: 'Generated sales report', timestamp: '2026-01-29 11:00 AM' }
        ];
        return logs;
    };

    // Calculate stats
    const stats = useMemo(() => ({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        inactiveUsers: users.filter(u => u.status === 'inactive').length,
        totalRoles: roles.length,
    }), [users, roles]);

    // Filter users (client-side filtering for search)
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = !searchQuery || 
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = !roleFilter || user.role === roleFilter;
            const matchesStatus = !statusFilter || user.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, roleFilter, statusFilter]);

    const handleViewUser = (user) => {
        setSelectedUser(user);
        setShowUserDetail(true);
    };

    const handleToggleStatus = async (user) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'inactive' ? 'Deactivate' : 'Activate';

        const confirmed = await confirm({
            title: `${action} User`,
            message: `Are you sure you want to ${action.toLowerCase()} ${user.name}?`,
            confirmText: action,
            variant: newStatus === 'inactive' ? 'danger' : 'primary'
        });

        if (confirmed) {
            try {
                await userAPI.toggleStatus(user.id);
                toast.success(`${user.name} has been ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
                fetchUsers();
                // Also update the detail view if open
                if (selectedUser?.id === user.id) {
                    setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
                }
            } catch (error) {
                toast.error(error.response?.data?.message || `Failed to ${action.toLowerCase()} user`);
            }
        }
    };

    const handleResetPassword = (user) => {
        setResetPwUser(user);
        setResetPwData({ password: '', password_confirmation: '' });
        setShowResetPw(true);
    };

    const handleSubmitResetPw = async (e) => {
        e.preventDefault();
        if (resetPwData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (resetPwData.password !== resetPwData.password_confirmation) {
            toast.error('Passwords do not match');
            return;
        }
        try {
            await userAPI.resetPassword(resetPwUser.id, resetPwData.password, resetPwData.password_confirmation);
            toast.success(`Password reset for ${resetPwUser.name}`);
            setShowResetPw(false);
        } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data?.errors?.password?.[0] || 'Failed to reset password');
        }
    };

    const handleSetPin = (user) => {
        setPinUser(user);
        setPinValue('');
        setShowSetPin(true);
    };

    const handleSubmitPin = async (e) => {
        e.preventDefault();
        if (!/^\d{4}$/.test(pinValue)) {
            toast.error('PIN must be exactly 4 digits');
            return;
        }
        try {
            await userAPI.setPin(pinUser.id, pinValue);
            toast.success(`PIN set for ${pinUser.name}`);
            setShowSetPin(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to set PIN');
        }
    };

    const handleRemovePin = async (user) => {
        const confirmed = await confirm({
            title: 'Remove PIN',
            message: `Remove PIN code for ${user.name}? They will no longer be able to login with PIN.`,
            confirmText: 'Remove PIN',
            variant: 'danger'
        });
        if (confirmed) {
            try {
                await userAPI.removePin(user.id);
                toast.success(`PIN removed for ${user.name}`);
                fetchUsers();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to remove PIN');
            }
        }
    };

    const handleDeleteUser = async (user) => {
        if (user.role === 'Super Admin') {
            toast.error('Cannot delete Super Admin account');
            return;
        }

        const confirmed = await confirm({
            title: 'Deactivate User',
            message: `Are you sure you want to deactivate ${user.name}?`,
            confirmText: 'Deactivate User',
            variant: 'danger'
        });

        if (confirmed) {
            try {
                await userAPI.deleteUser(user.id);
                toast.success(`${user.name} has been deactivated`);
                fetchUsers();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to deactivate user');
            }
        }
    };

    const handleExport = () => {
        toast.success('Exported user list to CSV');
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || !formData.roles.length || !formData.department) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            await userAPI.createUser(formData);
            toast.success(`User ${formData.name} created successfully!`);
            setShowCreate(false);
            fetchUsers();

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                department: '',
                roles: [],
                password: '',
                password_confirmation: '',
                send_invite: false
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create user');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRoleChange = (roleName) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(roleName) 
                ? prev.roles.filter(r => r !== roleName)
                : [...prev.roles, roleName]
        }));
    };

    const handleManageRoles = () => {
        fetchPermissions();
        fetchRoles();
        setShowRoleManager(true);
    };

    const handleSelectRole = (role) => {
        setSelectedRole(role);
        setRoleFormData({ name: role.name, permissions: [...(role.permissions || [])] });
        setShowRoleForm(true);
    };

    const handleNewRole = () => {
        setSelectedRole(null);
        setRoleFormData({ name: '', permissions: [] });
        setShowRoleForm(true);
    };

    const handleTogglePermission = (permName) => {
        setRoleFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permName)
                ? prev.permissions.filter(p => p !== permName)
                : [...prev.permissions, permName]
        }));
    };

    const handleToggleModule = (moduleName, modulePerms) => {
        const permNames = modulePerms.map(p => p.name || p);
        const allSelected = permNames.every(p => roleFormData.permissions.includes(p));
        setRoleFormData(prev => ({
            ...prev,
            permissions: allSelected
                ? prev.permissions.filter(p => !permNames.includes(p))
                : [...new Set([...prev.permissions, ...permNames])]
        }));
    };

    const handleSaveRole = async () => {
        if (!roleFormData.name.trim()) {
            toast.error('Role name is required');
            return;
        }
        try {
            setRoleLoading(true);
            if (selectedRole) {
                await userAPI.updateRole(selectedRole.id, roleFormData);
                toast.success(`Role "${roleFormData.name}" updated`);
            } else {
                await userAPI.createRole(roleFormData);
                toast.success(`Role "${roleFormData.name}" created`);
            }
            setShowRoleForm(false);
            fetchRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data?.errors?.name?.[0] || 'Failed to save role');
        } finally {
            setRoleLoading(false);
        }
    };

    const handleDeleteRole = async (role) => {
        const confirmed = await confirm({
            title: 'Delete Role',
            message: `Are you sure you want to delete the role "${role.name}"? This cannot be undone.`,
            confirmText: 'Delete Role',
            variant: 'danger'
        });
        if (confirmed) {
            try {
                await userAPI.deleteRole(role.id);
                toast.success(`Role "${role.name}" deleted`);
                if (selectedRole?.id === role.id) {
                    setShowRoleForm(false);
                    setSelectedRole(null);
                }
                fetchRoles();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete role');
            }
        }
    };

    const protectedRoles = ['Super Admin', 'Admin', 'Manager'];

    const handleEditUser = (user) => {
        setShowUserDetail(false);
        toast.info(`Editing ${user.name} - Edit form coming soon`);
    };

    // Export columns for CSV
    const exportColumns = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'department', label: 'Department' },
        { key: 'role', label: 'Role' },
        { key: 'status', label: 'Status' },
        { key: 'last_login', label: 'Last Login' },
        { key: 'created_at', label: 'Created At' },
    ];

    // Bulk actions
    const bulkActions = [
        {
            label: 'Export Selected',
            onClick: (selectedIndices) => {
                exportSelectedToCSV(selectedIndices, filteredUsers, exportColumns, 'users');
            }
        },
        {
            label: 'Activate Selected',
            onClick: async (selectedIndices) => {
                const selected = selectedIndices.map(i => filteredUsers[i]).filter(u => u.status === 'inactive');
                if (selected.length === 0) {
                    toast.error('No inactive users selected');
                    return;
                }
                const confirmed = await confirm({
                    title: 'Activate Users',
                    message: `Activate ${selected.length} selected user(s)?`,
                    confirmText: 'Activate',
                    variant: 'primary'
                });
                if (confirmed) {
                    let successCount = 0;
                    for (const user of selected) {
                        try {
                            await userAPI.toggleStatus(user.id);
                            successCount++;
                        } catch (error) {
                            console.error(`Failed to activate user ${user.id}:`, error);
                        }
                    }
                    toast.success(`${successCount} user(s) activated`);
                    fetchUsers();
                }
            }
        },
        {
            label: 'Deactivate Selected',
            onClick: async (selectedIndices) => {
                const selected = selectedIndices.map(i => filteredUsers[i]).filter(u => u.status === 'active' && u.role !== 'Super Admin');
                if (selected.length === 0) {
                    toast.error('No active users selected (Super Admins excluded)');
                    return;
                }
                const confirmed = await confirm({
                    title: 'Deactivate Users',
                    message: `Deactivate ${selected.length} selected user(s)?`,
                    confirmText: 'Deactivate',
                    variant: 'danger'
                });
                if (confirmed) {
                    let successCount = 0;
                    for (const user of selected) {
                        try {
                            await userAPI.toggleStatus(user.id);
                            successCount++;
                        } catch (error) {
                            console.error(`Failed to deactivate user ${user.id}:`, error);
                        }
                    }
                    toast.success(`${successCount} user(s) deactivated`);
                    fetchUsers();
                }
            },
            variant: 'danger'
        }
    ];

    // Table columns
    const columns = [
        {
            key: 'name',
            header: 'Name',
            render: (value, row) => (
                <button
                    onClick={() => handleViewUser(row)}
                    className="font-medium text-blue-600 hover:text-blue-800"
                >
                    {value}
                </button>
            )
        },
        {
            key: 'email',
            header: 'Email',
            render: (value) => <span className="text-slate-600">{value}</span>
        },
        {
            key: 'role',
            header: 'Role',
            render: (value) => {
                const variantMap = {
                    'Super Admin': 'rejected',
                    'Inventory Manager': 'pending',
                    'Accountant': 'approved',
                    'Cashier': 'completed',
                    'Purchase Manager': 'gold',
                    'Sales Manager': 'gold',
                    'Viewer': 'draft'
                };
                return <Badge variant={variantMap[value] || 'draft'}>{value}</Badge>;
            }
        },
        {
            key: 'status',
            header: 'Status',
            render: (value) => {
                const variantMap = {
                    active: 'approved',
                    suspended: 'pending',
                    inactive: 'draft'
                };
                return <Badge variant={variantMap[value]}>{value.charAt(0).toUpperCase() + value.slice(1)}</Badge>;
            }
        },
        {
            key: 'last_login',
            header: 'Last Login',
            render: (value) => {
                if (!value) return <span className="text-sm text-slate-400 italic">Never</span>;
                const d = new Date(value);
                return <span className="text-sm text-slate-600">{d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
            }
        },
        {
            key: 'actions',
            header: 'Actions',
            sortable: false,
            render: (value, row) => (
                <div className="relative">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenu(openActionMenu === row.id ? null : row.id);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm flex items-center gap-1"
                    >
                        Actions
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {openActionMenu === row.id && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenActionMenu(null)}></div>
                            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[160px]">
                                {/* View */}
                                <button
                                    onClick={() => { handleViewUser(row); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    View Details
                                </button>
                                
                                <div className="border-t border-slate-100 my-1"></div>
                                
                                {/* Toggle Status */}
                                <button
                                    onClick={() => { handleToggleStatus(row); setOpenActionMenu(null); }}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${row.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                                >
                                    {row.status === 'active' ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    )}
                                    {row.status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                                
                                {/* Reset Password */}
                                <button
                                    onClick={() => { handleResetPassword(row); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                    Reset Password
                                </button>
                                
                                {/* PIN Management */}
                                <button
                                    onClick={() => { row.has_pin ? handleRemovePin(row) : handleSetPin(row); setOpenActionMenu(null); }}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${row.has_pin ? 'text-orange-600 hover:bg-orange-50' : 'text-purple-600 hover:bg-purple-50'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    {row.has_pin ? 'Remove PIN' : 'Set PIN'}
                                </button>
                                
                                {/* Delete - only for non-Super Admin */}
                                {row.role !== 'Super Admin' && (
                                    <>
                                        <div className="border-t border-slate-100 my-1"></div>
                                        <button
                                            onClick={() => { handleDeleteUser(row); setOpenActionMenu(null); }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Delete User
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                <p className="text-slate-600 mt-2">Manage users, roles, and permissions</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-l-4 border-blue-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Total Users</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalUsers}</p>
                        <p className="text-xs text-slate-600 mt-1">All system users</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-green-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Active Users</p>
                        <p className="text-3xl font-bold text-green-700 mt-2">{stats.activeUsers}</p>
                        <p className="text-xs text-slate-600 mt-1">Currently active</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-purple-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Total Roles</p>
                        <p className="text-3xl font-bold text-purple-700 mt-2">{stats.totalRoles}</p>
                        <p className="text-xs text-slate-600 mt-1">Available roles</p>
                    </CardBody>
                </Card>
                <Card className="border-l-4 border-slate-600">
                    <CardBody>
                        <p className="text-sm font-semibold text-slate-700">Inactive</p>
                        <p className="text-3xl font-bold text-slate-700 mt-2">{stats.inactiveUsers}</p>
                        <p className="text-xs text-slate-600 mt-1">Deactivated users</p>
                    </CardBody>
                </Card>
            </div>

            {/* Actions Bar */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => setShowCreate(true)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add User
                    </Button>
                    <Button variant="ghost" onClick={handleManageRoles}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Manage Roles
                    </Button>
                    <Button variant="ghost" onClick={handleExport}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export All
                    </Button>
                </div>

                <div className="flex gap-3 w-full md:w-auto flex-wrap">
                    <SearchBar
                        placeholder="Search by name or email..."
                        onSearch={setSearchQuery}
                        className="flex-1 md:w-64"
                    />
                    <FilterDropdown
                        label="Role"
                        options={roleOptions}
                        value={roleFilter}
                        onChange={setRoleFilter}
                    />
                    <FilterDropdown
                        label="Status"
                        options={statusOptions}
                        value={statusFilter}
                        onChange={setStatusFilter}
                    />
                </div>
            </div>

            {/* Users DataTable */}
            <DataTable
                columns={columns}
                data={filteredUsers}
                selectable={true}
                bulkActions={bulkActions}
                emptyMessage="No users found"
                pageSize={20}
            />

            {/* User Detail SlideOut */}
            <SlideOut isOpen={showUserDetail} onClose={() => { setShowUserDetail(false); setSelectedUser(null); }} title={selectedUser?.name || ''} size="lg">
                {selectedUser && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div><p className="text-xs text-slate-500">Full Name</p><p className="font-medium">{selectedUser.name}</p></div>
                            <div><p className="text-xs text-slate-500">Email</p><p className="font-medium">{selectedUser.email}</p></div>
                            <div><p className="text-xs text-slate-500">Phone</p><p className="font-medium">{selectedUser.phone}</p></div>
                            <div><p className="text-xs text-slate-500">Department</p><p className="font-medium">{selectedUser.department}</p></div>
                            <div><p className="text-xs text-slate-500">Role</p><Badge variant="gold">{selectedUser.role}</Badge></div>
                            <div><p className="text-xs text-slate-500">Status</p><Badge variant={selectedUser.status === 'active' ? 'approved' : 'pending'}>{selectedUser.status}</Badge></div>
                            <div><p className="text-xs text-slate-500">Last Login</p><p className="font-medium">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}</p></div>
                            <div><p className="text-xs text-slate-500">Created</p><p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p></div>
                            <div><p className="text-xs text-slate-500">PIN Login</p><Badge variant={selectedUser.has_pin ? 'approved' : 'draft'}>{selectedUser.has_pin ? 'Enabled' : 'Not Set'}</Badge></div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500 mb-2">Permissions</p>
                            <div className="flex gap-2 flex-wrap">
                                {selectedUser.permissions.map((perm, idx) => (
                                    <Badge key={idx} variant="draft">{perm}</Badge>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3">Recent Activity</h4>
                            <div className="space-y-2">
                                {getActivityLog(selectedUser).map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                        <span className="text-sm text-slate-700">{log.action}</span>
                                        <span className="text-xs text-slate-400">{log.timestamp}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t flex-wrap">
                            <Button size="sm" onClick={() => handleEditUser(selectedUser)}>Edit User</Button>
                            <Button variant="outline" size="sm" onClick={() => handleResetPassword(selectedUser)}>Reset Password</Button>
                            <Button variant="outline" size="sm" onClick={() => selectedUser.has_pin ? handleRemovePin(selectedUser) : handleSetPin(selectedUser)}>
                                {selectedUser.has_pin ? 'Remove PIN' : 'Set PIN'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleToggleStatus(selectedUser)}>
                                {selectedUser.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                        </div>
                    </div>
                )}
            </SlideOut>

            {/* Role Management SlideOut */}
            <SlideOut isOpen={showRoleManager} onClose={() => { setShowRoleManager(false); setShowRoleForm(false); setSelectedRole(null); }} title="Manage Roles & Permissions" size="lg">
                <div className="space-y-4">
                    {!showRoleForm ? (
                        <>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-slate-500">{roles.length} roles configured</p>
                                <Button size="sm" onClick={handleNewRole}>+ New Role</Button>
                            </div>

                            <div className="space-y-2">
                                {roles.map(role => (
                                    <div key={role.id || role.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-900">{role.name}</span>
                                                {protectedRoles.includes(role.name) && (
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">System</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-slate-500">
                                                    {(role.permissions || []).length} permissions
                                                </span>
                                                <span className="text-xs text-slate-400">•</span>
                                                <span className="text-xs text-slate-500">
                                                    {role.users_count || 0} user{(role.users_count || 0) !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSelectRole(role)}
                                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                {role.name === 'Super Admin' ? 'View' : 'Edit'}
                                            </button>
                                            {!protectedRoles.includes(role.name) && (role.users_count || 0) === 0 && (
                                                <button
                                                    onClick={() => handleDeleteRole(role)}
                                                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => { setShowRoleForm(false); setSelectedRole(null); }}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2"
                            >
                                ← Back to Roles
                            </button>

                            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Role Name *</label>
                                    <input
                                        type="text"
                                        value={roleFormData.name}
                                        onChange={(e) => setRoleFormData(prev => ({ ...prev, name: e.target.value }))}
                                        disabled={selectedRole && protectedRoles.includes(selectedRole.name)}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
                                        placeholder="e.g. Branch Manager"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-slate-700">Permissions</label>
                                        <span className="text-xs text-slate-500">{roleFormData.permissions.length} selected</span>
                                    </div>

                                    {selectedRole?.name === 'Super Admin' ? (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                                            Super Admin has all permissions and cannot be modified.
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                                            {Object.entries(permissions).map(([module, modulePerms]) => {
                                                const permNames = (Array.isArray(modulePerms) ? modulePerms : []).map(p => p.name || p);
                                                const selectedCount = permNames.filter(p => roleFormData.permissions.includes(p)).length;
                                                const allSelected = permNames.length > 0 && selectedCount === permNames.length;
                                                const someSelected = selectedCount > 0 && !allSelected;

                                                return (
                                                    <div key={module} className="border border-slate-200 rounded-lg overflow-hidden">
                                                        <div
                                                            className="flex items-center gap-3 p-3 bg-slate-50 cursor-pointer hover:bg-slate-100"
                                                            onClick={() => handleToggleModule(module, modulePerms)}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={allSelected}
                                                                ref={el => { if (el) el.indeterminate = someSelected; }}
                                                                onChange={() => handleToggleModule(module, modulePerms)}
                                                                className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                                                            />
                                                            <span className="font-medium text-slate-800 capitalize text-sm">{module}</span>
                                                            <span className="text-xs text-slate-400 ml-auto">{selectedCount}/{permNames.length}</span>
                                                        </div>
                                                        <div className="p-3 grid grid-cols-2 gap-2">
                                                            {permNames.map(perm => (
                                                                <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={roleFormData.permissions.includes(perm)}
                                                                        onChange={() => handleTogglePermission(perm)}
                                                                        className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded"
                                                                    />
                                                                    <span className="text-slate-700">{perm.split('.').slice(1).join('.') || perm}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {!(selectedRole?.name === 'Super Admin') && (
                                    <div className="flex gap-3 pt-4 border-t">
                                        <Button onClick={handleSaveRole} disabled={roleLoading}>
                                            {roleLoading ? 'Saving...' : (selectedRole ? 'Update Role' : 'Create Role')}
                                        </Button>
                                        <Button variant="outline" onClick={() => { setShowRoleForm(false); setSelectedRole(null); }}>Cancel</Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </SlideOut>

            {/* Reset Password SlideOut */}
            <SlideOut isOpen={showResetPw} onClose={() => setShowResetPw(false)} title={`Reset Password — ${resetPwUser?.name || ''}`} size="sm">
                <form onSubmit={handleSubmitResetPw} className="space-y-5">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                        Enter a new password for <strong>{resetPwUser?.name}</strong> ({resetPwUser?.email}).
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password *</label>
                        <input type="password" required value={resetPwData.password} onChange={(e) => setResetPwData(prev => ({ ...prev, password: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Min 6 characters" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                        <input type="password" required value={resetPwData.password_confirmation} onChange={(e) => setResetPwData(prev => ({ ...prev, password_confirmation: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Re-enter password" />
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Reset Password</Button>
                        <Button variant="outline" onClick={() => setShowResetPw(false)}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>

            {/* Set PIN SlideOut */}
            <SlideOut isOpen={showSetPin} onClose={() => setShowSetPin(false)} title={`Set PIN — ${pinUser?.name || ''}`} size="sm">
                <form onSubmit={handleSubmitPin} className="space-y-5">
                    <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-800">
                        Set a 4-digit PIN for <strong>{pinUser?.name}</strong>. They can use this PIN instead of password to login.
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">4-Digit PIN *</label>
                        <input type="text" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required value={pinValue} onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-purple-100 text-center text-2xl font-mono tracking-[0.5em] letter-spacing-wide" placeholder="• • • •" />
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Set PIN</Button>
                        <Button variant="outline" onClick={() => setShowSetPin(false)}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>

            <SlideOut isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New User" size="md">
                <form onSubmit={handleCreateUser} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. Amina Ibrahim" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="user@company.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="+234 8XX XXX XXXX" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                            <select name="department" required value={formData.department} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="">Select...</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                            <select name="role" required value={formData.roles[0] || ''} onChange={(e) => setFormData(prev => ({ ...prev, roles: e.target.value ? [e.target.value] : [] }))} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                                <option value="">Select...</option>
                                {roles.map(r => <option key={r.id || r.name || r} value={r.name || r}>{r.name || r}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                            <input type="password" name="password" required value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                            <input type="password" name="confirm_password" required value={formData.confirm_password} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="send_invite" name="send_invite" checked={formData.send_invite} onChange={handleInputChange} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                        <label htmlFor="send_invite" className="text-sm text-slate-700">Send login credentials via email</label>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                        The user's permissions will be determined by their assigned role. You can manage role permissions in Settings.
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit">Create User</Button>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </form>
            </SlideOut>
        </div>
    );
}
