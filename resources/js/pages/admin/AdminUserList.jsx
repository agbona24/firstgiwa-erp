import { useState, useEffect } from 'react';
import { getAdminUsers, createAdminUser, deleteAdminUser } from '../../services/adminAPI';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

export default function AdminUserList() {
    const { t } = useAdminTheme();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            const res = await getAdminUsers();
            const payload = res?.data;
            const normalized = Array.isArray(payload?.admins)
                ? payload.admins
                : Array.isArray(payload?.data?.admins)
                    ? payload.data.admins
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : [];
            setAdmins(normalized);
        } catch (err) {
            console.error('Failed to load admins:', err);
            setAdmins([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        setErrors({});
        try {
            await createAdminUser(form);
            setShowCreate(false);
            setForm({ name: '', email: '', password: '' });
            loadAdmins();
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteAdminUser(id);
            setDeleteId(null);
            loadAdmins();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to remove admin');
            setDeleteId(null);
        }
    };

    const inputCls = `w-full px-4 py-2 border rounded-lg text-sm ${t.inputBg} ${t.inputText} ${t.inputFocus}`;
    const adminList = Array.isArray(admins) ? admins : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${t.textPrimary}`}>Admin Users</h1>
                    <p className={`text-sm mt-1 ${t.textSecondary}`}>System-level administrators with platform access</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    + Add Admin
                </button>
            </div>

            <div className={`border rounded-xl overflow-hidden ${t.cardBg}`}>
                <table className="w-full text-sm">
                    <thead>
                        <tr className={`border-b ${t.tableBorder}`}>
                            <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Name</th>
                            <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Email</th>
                            <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Status</th>
                            <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Last Login</th>
                            <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Joined</th>
                            <th className={`text-right px-5 py-3 text-xs font-semibold uppercase ${t.textTableHead}`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className={t.tableDivide}>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className={`px-5 py-8 text-center ${t.textMuted}`}>
                                    <div className="spinner w-8 h-8 mx-auto"></div>
                                </td>
                            </tr>
                        ) : adminList.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={`px-5 py-8 text-center ${t.textMuted}`}>No admin users found</td>
                            </tr>
                        ) : adminList.map((admin) => (
                            <tr key={admin.id} className={t.rowHover}>
                                <td className={`px-5 py-3 font-medium ${t.textPrimary}`}>{admin.name}</td>
                                <td className={`px-5 py-3 ${t.textSecondary}`}>{admin.email}</td>
                                <td className="px-5 py-3">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${admin.status === 'active' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-500/20 text-slate-500'}`}>
                                        {admin.status}
                                    </span>
                                </td>
                                <td className={`px-5 py-3 text-xs ${t.textMuted}`}>
                                    {admin.last_login_at ? new Date(admin.last_login_at).toLocaleString() : 'Never'}
                                </td>
                                <td className={`px-5 py-3 text-xs ${t.textMuted}`}>
                                    {new Date(admin.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-5 py-3 text-right">
                                    {deleteId === admin.id ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleDelete(admin.id)} className="text-xs text-red-500 hover:text-red-400">
                                                Confirm
                                            </button>
                                            <button onClick={() => setDeleteId(null)} className={`text-xs ${t.textMuted}`}>
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteId(admin.id)} className={`text-xs ${t.textMuted} hover:text-red-500`}>
                                            Remove
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Admin Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className={`fixed inset-0 ${t.overlay}`} onClick={() => setShowCreate(false)} />
                    <div className={`relative border rounded-xl p-6 w-full max-w-md ${t.modalBg}`}>
                        <h3 className={`text-lg font-bold mb-4 ${t.textPrimary}`}>Add System Admin</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className={`block text-sm mb-1 ${t.textLabel}`}>Name</label>
                                <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className={inputCls} required />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                            </div>
                            <div>
                                <label className={`block text-sm mb-1 ${t.textLabel}`}>Email</label>
                                <input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} className={inputCls} required />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
                            </div>
                            <div>
                                <label className={`block text-sm mb-1 ${t.textLabel}`}>Password</label>
                                <input type="password" value={form.password} onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} className={inputCls} required minLength={8} />
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className={`px-4 py-2 text-sm ${t.btnGhost}`}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={creating} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                    {creating ? 'Creating...' : 'Create Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
