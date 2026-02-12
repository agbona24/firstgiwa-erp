import { useState, useMemo, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import SearchBar from '../../components/ui/SearchBar';
import FilterDropdown from '../../components/ui/FilterDropdown';
import SlideOut from '../../components/ui/SlideOut';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import staffAPI from '../../services/staffAPI';
import departmentAPI from '../../services/departmentAPI';
import { branchesAPI } from '../../services/settingsAPI';
import { exportSelectedToCSV } from '../../utils/exportUtils';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

const inputClass = "w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

// ─── Reusable Staff Form (defined OUTSIDE component to avoid remount on every keystroke) ───
function StaffForm({ formData, setFormData, deptNames, branches, onSubmit, submitLabel, onCancel }) {
    const handleChange = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));
    const handleChecked = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.checked }));

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
            {/* Section 1: Personal Information */}
            <div>
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
                    Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                        <input type="text" required value={formData.first_name} onChange={handleChange('first_name')} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                        <input type="text" required value={formData.last_name} onChange={handleChange('last_name')} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                        <input type="date" value={formData.date_of_birth} onChange={handleChange('date_of_birth')} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                        <input type="tel" required value={formData.phone} onChange={handleChange('phone')} className={inputClass} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" value={formData.email} onChange={handleChange('email')} className={inputClass} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <textarea rows={2} value={formData.address} onChange={handleChange('address')} className={inputClass} placeholder="Home address" />
                    </div>
                </div>
            </div>

            {/* Section 2: Employment Details */}
            <div className="border-t pt-5">
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">2</span>
                    Employment Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                        <select value={formData.department} onChange={handleChange('department')} className={inputClass}>
                            <option value="">Select department...</option>
                            {deptNames.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Position/Job Title *</label>
                        <input type="text" required value={formData.position} onChange={handleChange('position')} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type *</label>
                        <select value={formData.employment_type} onChange={handleChange('employment_type')} className={inputClass}>
                            <option value="full-time">Full Time</option>
                            <option value="part-time">Part Time</option>
                            <option value="contract">Contract</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date Hired *</label>
                        <input type="date" required value={formData.date_hired} onChange={handleChange('date_hired')} className={inputClass} />
                    </div>
                    {branches.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                            <select value={formData.branch_id} onChange={handleChange('branch_id')} className={inputClass}>
                                <option value="">Select branch...</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 3: Salary & Allowances */}
            <div className="border-t pt-5">
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">3</span>
                    Salary & Allowances
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Basic Salary ({window.getCurrencySymbol()}) *</label>
                        <input type="number" required min="0" step="0.01" value={formData.basic_salary} onChange={handleChange('basic_salary')} className={inputClass} placeholder="0.00" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Salary Frequency *</label>
                        <select value={formData.salary_frequency} onChange={handleChange('salary_frequency')} className={inputClass}>
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="daily">Daily</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Housing Allowance ({window.getCurrencySymbol()})</label>
                        <input type="number" min="0" step="0.01" value={formData.housing_allowance} onChange={handleChange('housing_allowance')} className={inputClass} placeholder="0.00" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Transport Allowance ({window.getCurrencySymbol()})</label>
                        <input type="number" min="0" step="0.01" value={formData.transport_allowance} onChange={handleChange('transport_allowance')} className={inputClass} placeholder="0.00" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Other Allowances ({window.getCurrencySymbol()})</label>
                        <input type="number" min="0" step="0.01" value={formData.other_allowances} onChange={handleChange('other_allowances')} className={inputClass} placeholder="0.00" />
                    </div>
                </div>
            </div>

            {/* Section 4: Bank Details */}
            <div className="border-t pt-5">
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">4</span>
                    Bank Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                        <input type="text" value={formData.bank_name} onChange={handleChange('bank_name')} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                        <input type="text" value={formData.account_number} onChange={handleChange('account_number')} className={inputClass} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                        <input type="text" value={formData.account_name} onChange={handleChange('account_name')} className={inputClass} />
                    </div>
                </div>
            </div>

            {/* Section 5: Identification */}
            <div className="border-t pt-5">
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">5</span>
                    Identification
                </h4>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID (TIN)</label>
                        <input type="text" value={formData.tax_id} onChange={handleChange('tax_id')} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">National ID (NIN)</label>
                        <input type="text" value={formData.national_id} onChange={handleChange('national_id')} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pension Number</label>
                        <input type="text" value={formData.pension_number} onChange={handleChange('pension_number')} className={inputClass} />
                    </div>
                </div>
            </div>

            {/* Section 6: Emergency Contact */}
            <div className="border-t pt-5">
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold">6</span>
                    Emergency Contact
                </h4>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                        <input type="text" value={formData.emergency_contact_name} onChange={handleChange('emergency_contact_name')} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                        <input type="tel" value={formData.emergency_contact_phone} onChange={handleChange('emergency_contact_phone')} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                        <select value={formData.emergency_contact_relationship} onChange={handleChange('emergency_contact_relationship')} className={inputClass}>
                            <option value="">Select...</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Parent">Parent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Child">Child</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
                <Button type="submit">{submitLabel}</Button>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
        </form>
    );
}

// ─── Reusable Department Form (also outside to avoid remount) ───
function DeptForm({ deptFormData, setDeptFormData, onSubmit, submitLabel, onCancel, checkboxId }) {
    const handleChange = (field) => (e) => setDeptFormData(prev => ({ ...prev, [field]: e.target.value }));
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department Name *</label>
                    <input type="text" required value={deptFormData.name} onChange={handleChange('name')} className={inputClass} placeholder="e.g., Human Resources" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                    <input type="text" value={deptFormData.code} onChange={(e) => setDeptFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} className={inputClass} placeholder="e.g., HR" maxLength={20} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Head of Department</label>
                <input type="text" value={deptFormData.head_of_department} onChange={handleChange('head_of_department')} className={inputClass} placeholder="Name of department head" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={deptFormData.description} onChange={handleChange('description')} rows={3} className={inputClass} placeholder="Brief description of the department..." />
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id={checkboxId} checked={deptFormData.is_active} onChange={(e) => setDeptFormData(prev => ({ ...prev, is_active: e.target.checked }))} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor={checkboxId} className="text-sm text-slate-700">Active Department</label>
            </div>
            <div className="flex gap-3 pt-4 border-t">
                <Button type="submit">{submitLabel}</Button>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
        </form>
    );
}

const emptyForm = {
    first_name: '', last_name: '', email: '', phone: '', address: '',
    date_of_birth: '', department: '', position: '', employment_type: 'full-time',
    date_hired: new Date().toISOString().split('T')[0], branch_id: '',
    basic_salary: '', salary_frequency: 'monthly',
    housing_allowance: '', transport_allowance: '', other_allowances: '',
    bank_name: '', account_number: '', account_name: '',
    tax_id: '', national_id: '', pension_number: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: ''
};

export default function StaffList() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('staff');
    
    // Staff state
    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState([]);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [showStaffEdit, setShowStaffEdit] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [formData, setFormData] = useState({ ...emptyForm });

    // Department state
    const [deptLoading, setDeptLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [deptSearch, setDeptSearch] = useState('');
    const [showDeptCreate, setShowDeptCreate] = useState(false);
    const [showDeptEdit, setShowDeptEdit] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null);
    const [editingDept, setEditingDept] = useState(null);
    const [deptFormData, setDeptFormData] = useState({
        name: '', code: '', description: '', head_of_department: '', is_active: true
    });

    // Bulk action state
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(null);

    // Branches
    const [branches, setBranches] = useState([]);

    // Fetch data
    useEffect(() => {
        fetchStaff();
        fetchDepartments();
        fetchBranches();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await staffAPI.getAll();
            const list = Array.isArray(response) ? response : (response?.data || []);
            console.log('Staff loaded:', list.length, 'records');
            setStaff(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Error fetching staff:', error);
            toast.error('Failed to load staff');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            setDeptLoading(true);
            const response = await departmentAPI.getAll();
            setDepartments(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setDeptLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await branchesAPI.list();
            // Axios wraps in .data, Laravel may wrap in .data again
            const raw = response?.data;
            const list = Array.isArray(raw) ? raw : (raw?.data || raw || []);
            setBranches(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Error fetching branches:', error);
            setBranches([]);
        }
    };

    // Staff filtering
    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
            if (search && !fullName.includes(search.toLowerCase()) && !s.staff_number?.toLowerCase().includes(search.toLowerCase())) return false;
            if (deptFilter && s.department !== deptFilter) return false;
            if (typeFilter && s.employment_type !== typeFilter) return false;
            return true;
        });
    }, [staff, search, deptFilter, typeFilter]);

    // Department filtering
    const filteredDepts = useMemo(() => {
        return departments.filter(d => {
            if (deptSearch && !d.name?.toLowerCase().includes(deptSearch.toLowerCase()) && !d.code?.toLowerCase().includes(deptSearch.toLowerCase())) return false;
            return true;
        });
    }, [departments, deptSearch]);

    // Stats
    const stats = useMemo(() => ({
        total: staff.length,
        active: staff.filter(s => s.employment_status === 'active').length,
        totalPayroll: staff.filter(s => s.employment_status === 'active').reduce((sum, s) => sum + parseFloat(s.basic_salary || 0), 0),
        departments: [...new Set(staff.map(s => s.department).filter(Boolean))].length,
    }), [staff]);

    // Department names for dropdown
    const deptNames = useMemo(() => {
        return departments.filter(d => d.is_active !== false).map(d => d.name).sort();
    }, [departments]);

    // Populate form from staff member
    const populateForm = (s) => ({
        first_name: s.first_name || '', last_name: s.last_name || '',
        email: s.email || '', phone: s.phone || '', address: s.address || '',
        date_of_birth: s.date_of_birth ? s.date_of_birth.split('T')[0] : '',
        department: s.department || '', position: s.position || '',
        employment_type: s.employment_type || 'full-time',
        date_hired: s.date_hired ? s.date_hired.split('T')[0] : '',
        branch_id: s.branch_id || '',
        basic_salary: s.basic_salary || '', salary_frequency: s.salary_frequency || 'monthly',
        housing_allowance: s.housing_allowance || '', transport_allowance: s.transport_allowance || '', other_allowances: s.other_allowances || '',
        bank_name: s.bank_name || '', account_number: s.account_number || '', account_name: s.account_name || '',
        tax_id: s.tax_id || '', national_id: s.national_id || '', pension_number: s.pension_number || '',
        emergency_contact_name: s.emergency_contact_name || '', emergency_contact_phone: s.emergency_contact_phone || '', emergency_contact_relationship: s.emergency_contact_relationship || ''
    });

    // Staff handlers
    const handleCreateStaff = async () => {
        try {
            const payload = { ...formData };
            payload.basic_salary = parseFloat(payload.basic_salary) || 0;
            if (payload.housing_allowance) payload.housing_allowance = parseFloat(payload.housing_allowance);
            if (payload.transport_allowance) payload.transport_allowance = parseFloat(payload.transport_allowance);
            if (payload.other_allowances) payload.other_allowances = parseFloat(payload.other_allowances);
            if (payload.branch_id) payload.branch_id = parseInt(payload.branch_id);
            // Remove empty optional fields
            Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });
            // Keep required fields
            payload.basic_salary = payload.basic_salary || 0;
            payload.employment_type = payload.employment_type || 'full-time';
            payload.salary_frequency = payload.salary_frequency || 'monthly';
            payload.date_hired = payload.date_hired || formData.date_hired;

            await staffAPI.create(payload);
            toast.success('Staff member added');
            setShowCreate(false);
            setFormData({ ...emptyForm });
            fetchStaff();
        } catch (error) {
            console.error('Error creating staff:', error);
            toast.error(error.response?.data?.message || 'Failed to add staff member');
        }
    };

    const handleEditStaff = (staffMember) => {
        setEditingStaff(staffMember);
        setFormData(populateForm(staffMember));
        setShowStaffEdit(true);
    };

    const handleUpdateStaff = async () => {
        try {
            const payload = { ...formData };
            payload.basic_salary = parseFloat(payload.basic_salary) || 0;
            if (payload.housing_allowance) payload.housing_allowance = parseFloat(payload.housing_allowance);
            if (payload.transport_allowance) payload.transport_allowance = parseFloat(payload.transport_allowance);
            if (payload.other_allowances) payload.other_allowances = parseFloat(payload.other_allowances);
            if (payload.branch_id) payload.branch_id = parseInt(payload.branch_id);

            await staffAPI.update(editingStaff.id, payload);
            toast.success('Staff member updated');
            setShowStaffEdit(false);
            setEditingStaff(null);
            setFormData({ ...emptyForm });
            fetchStaff();
        } catch (error) {
            console.error('Error updating staff:', error);
            toast.error(error.response?.data?.message || 'Failed to update staff member');
        }
    };

    const handleDeleteStaff = async (staffMember) => {
        if (!confirm(`Delete staff "${staffMember.first_name} ${staffMember.last_name}"?`)) return;
        try {
            await staffAPI.delete(staffMember.id);
            toast.success('Staff member deleted');
            fetchStaff();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete staff member');
        }
    };

    // Department handlers
    const handleCreateDept = async () => {
        try {
            await departmentAPI.create(deptFormData);
            toast.success('Department created');
            setShowDeptCreate(false);
            setDeptFormData({ name: '', code: '', description: '', head_of_department: '', is_active: true });
            fetchDepartments();
        } catch (error) {
            console.error('Error creating department:', error);
            toast.error(error.response?.data?.message || 'Failed to create department');
        }
    };

    const handleDeleteDept = async (dept) => {
        if (!confirm(`Delete department "${dept.name}"?`)) return;
        try {
            await departmentAPI.delete(dept.id);
            toast.success('Department deleted');
            fetchDepartments();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete department');
        }
    };

    const handleEditDept = (dept) => {
        setEditingDept(dept);
        setDeptFormData({
            name: dept.name || '', code: dept.code || '', description: dept.description || '',
            head_of_department: dept.head_of_department || '', is_active: dept.is_active !== false
        });
        setShowDeptEdit(true);
    };

    const handleUpdateDept = async () => {
        try {
            await departmentAPI.update(editingDept.id, deptFormData);
            toast.success('Department updated');
            setShowDeptEdit(false);
            setEditingDept(null);
            setDeptFormData({ name: '', code: '', description: '', head_of_department: '', is_active: true });
            fetchDepartments();
        } catch (error) {
            console.error('Error updating department:', error);
            toast.error(error.response?.data?.message || 'Failed to update department');
        }
    };

    // Helper: get branch name
    const getBranchName = (id) => {
        if (!Array.isArray(branches) || !id) return null;
        const b = branches.find(br => br.id === id || br.id === Number(id));
        return b ? b.name : null;
    };

    // Staff columns
    const staffColumns = [
        { key: 'staff_number', label: 'ID', sortable: true, render: (val) => <span className="font-mono text-sm font-semibold text-blue-700">{val}</span> },
        { key: 'first_name', label: 'Name', sortable: true, render: (val, row) => (
            <div>
                <div className="font-medium text-slate-900">{val} {row.last_name}</div>
                <div className="text-xs text-slate-500">{row.position}</div>
            </div>
        )},
        { key: 'department', label: 'Department', sortable: true, render: (val) => val ? <Badge variant="draft">{val}</Badge> : '-' },
        { key: 'employment_type', label: 'Type', render: (val) => <Badge variant={val === 'full-time' ? 'approved' : 'pending'}>{val?.replace('-', ' ') || 'N/A'}</Badge> },
        { key: 'phone', label: 'Phone', render: (val) => val || '-' },
        { key: 'date_hired', label: 'Hire Date', sortable: true, render: (val) => val ? new Date(val).toLocaleDateString() : '-' },
        { key: 'basic_salary', label: 'Basic Salary', sortable: true, render: (val) => fmt(val) },
        { key: 'employment_status', label: 'Status', render: (val) => <Badge variant={val === 'active' ? 'approved' : val === 'on_leave' ? 'pending' : 'draft'}>{val?.replace('_', ' ') || 'Active'}</Badge> },
    ];

    // Department columns
    const deptColumns = [
        { key: 'code', label: 'Code', sortable: true, render: (val) => val ? <span className="font-mono text-sm font-semibold text-blue-700">{val}</span> : '-' },
        { key: 'name', label: 'Department Name', sortable: true, render: (val) => <span className="font-medium text-slate-900">{val}</span> },
        { key: 'head_of_department', label: 'Head of Dept', render: (val) => val || '-' },
        { key: 'staff_count', label: 'Staff Count', sortable: true, render: (val) => (
            <span className={`font-semibold ${val > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{val || 0}</span>
        )},
        { key: 'description', label: 'Description', render: (val) => val ? <span className="text-sm text-slate-600 truncate max-w-xs block">{val}</span> : '-' },
        { key: 'is_active', label: 'Status', render: (val) => <Badge variant={val ? 'approved' : 'draft'}>{val ? 'Active' : 'Inactive'}</Badge> },
    ];

    const staffActions = [
        { label: 'View', onClick: (row) => setSelectedStaff(row), variant: 'outline' },
        { label: 'Edit', onClick: handleEditStaff, variant: 'outline' },
        { label: 'Delete', onClick: handleDeleteStaff, variant: 'danger' },
    ];

    const deptActions = [
        { label: 'View', onClick: (row) => setSelectedDept(row), variant: 'outline' },
        { label: 'Edit', onClick: handleEditDept, variant: 'outline' },
        { label: 'Delete', onClick: handleDeleteDept, variant: 'danger' },
    ];

    // Export columns for CSV
    const staffExportColumns = [
        { key: 'staff_number', label: 'Staff ID' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'department', label: 'Department' },
        { key: 'position', label: 'Position' },
        { key: 'employment_type', label: 'Employment Type' },
        { key: 'date_hired', label: 'Date Hired' },
        { key: 'basic_salary', label: 'Basic Salary' },
        { key: 'employment_status', label: 'Status' },
    ];

    const deptExportColumns = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'head_of_department', label: 'Head of Department' },
        { key: 'staff_count', label: 'Staff Count' },
        { key: 'is_active', label: 'Active' },
        { key: 'description', label: 'Description' },
    ];

    // Bulk action handlers
    const handleBulkDeleteStaff = (selectedIndices) => {
        const selected = selectedIndices.map(i => filteredStaff[i]);
        setBulkDeleteConfirm({ type: 'staff', selectedIndices, count: selected.length });
    };

    const confirmBulkDelete = async () => {
        const selected = bulkDeleteConfirm.selectedIndices.map(i => filteredStaff[i]);
        let successCount = 0;
        for (const s of selected) {
            try {
                await staffAPI.delete(s.id);
                successCount++;
            } catch (error) {
                console.error(`Failed to delete staff ${s.id}:`, error);
            }
        }
        toast.success(`${successCount} staff member(s) deleted`);
        setBulkDeleteConfirm(null);
        fetchStaff();
    };

    const staffBulkActions = [
        {
            label: 'Export Selected',
            onClick: (selectedIndices) => exportSelectedToCSV(selectedIndices, filteredStaff, staffExportColumns, 'staff'),
        },
        {
            label: 'Delete Selected',
            onClick: handleBulkDeleteStaff,
            variant: 'danger',
        },
    ];

    const deptBulkActions = [
        {
            label: 'Export Selected',
            onClick: (selectedIndices) => exportSelectedToCSV(selectedIndices, filteredDepts, deptExportColumns, 'departments'),
        },
    ];

    // ─── Field display helper for View ───────────────────────────────────
    const Field = ({ label, value, mono = false, fullWidth = false }) => (
        <div className={fullWidth ? 'col-span-2' : ''}>
            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
            <p className={`font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>{value || <span className="text-slate-400">—</span>}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Staff</h1>
                    <p className="text-slate-600 mt-1">Manage employees and departments</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowDeptCreate(true)}>+ Add Department</Button>
                    <Button onClick={() => { setFormData({ ...emptyForm }); setShowCreate(true); }}>+ Add Staff</Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Staff', value: stats.total, color: 'blue' },
                    { label: 'Active', value: stats.active, color: 'green' },
                    { label: 'Monthly Payroll', value: fmt(stats.totalPayroll), color: 'purple' },
                    { label: 'Departments', value: departments.length || stats.departments, color: 'orange' },
                ].map((s, i) => (
                    <Card key={i}><CardBody className="p-4">
                        <p className="text-sm text-slate-500">{s.label}</p>
                        <p className={`text-2xl font-bold text-${s.color}-600 mt-1`}>{s.value}</p>
                    </CardBody></Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex gap-6">
                    <button onClick={() => setActiveTab('staff')} className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'staff' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                        Staff ({staff.length})
                    </button>
                    <button onClick={() => setActiveTab('departments')} className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'departments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                        Departments ({departments.length})
                    </button>
                </nav>
            </div>

            {/* Staff Tab */}
            {activeTab === 'staff' && (
                <>
                    <div className="flex flex-wrap items-center gap-3">
                        <SearchBar onSearch={setSearch} placeholder="Search staff..." />
                        <FilterDropdown label="Department" value={deptFilter} onChange={setDeptFilter} options={deptNames.map(d => ({ value: d, label: d }))} />
                        <FilterDropdown label="Type" value={typeFilter} onChange={setTypeFilter} options={[
                            { value: 'full-time', label: 'Full Time' },
                            { value: 'part-time', label: 'Part Time' },
                            { value: 'contract', label: 'Contract' },
                        ]} />
                    </div>
                    <DataTable columns={staffColumns} data={filteredStaff} actions={staffActions} isLoading={loading} pageSize={10} selectable bulkActions={staffBulkActions} />
                </>
            )}

            {/* Departments Tab */}
            {activeTab === 'departments' && (
                <>
                    <div className="flex flex-wrap items-center gap-3">
                        <SearchBar onSearch={setDeptSearch} placeholder="Search departments..." />
                    </div>
                    <DataTable columns={deptColumns} data={filteredDepts} actions={deptActions} isLoading={deptLoading} selectable bulkActions={deptBulkActions} />
                </>
            )}

            {/* ─── View Staff SlideOut ─────────────────────────────────────── */}
            <SlideOut isOpen={!!selectedStaff} onClose={() => setSelectedStaff(null)} title={`Staff: ${selectedStaff?.first_name || ''} ${selectedStaff?.last_name || ''}`} size="lg">
                {selectedStaff && (
                    <div className="space-y-6">
                        {/* Personal Info */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Personal Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Staff Number" value={selectedStaff.staff_number} mono />
                                <Field label="Status" value={
                                    <Badge variant={selectedStaff.employment_status === 'active' ? 'approved' : selectedStaff.employment_status === 'on_leave' ? 'pending' : 'draft'}>
                                        {selectedStaff.employment_status?.replace('_', ' ') || 'Active'}
                                    </Badge>
                                } />
                                <Field label="First Name" value={selectedStaff.first_name} />
                                <Field label="Last Name" value={selectedStaff.last_name} />
                                <Field label="Date of Birth" value={selectedStaff.date_of_birth ? new Date(selectedStaff.date_of_birth).toLocaleDateString() : null} />
                                <Field label="Phone" value={selectedStaff.phone} />
                                <Field label="Email" value={selectedStaff.email} />
                                <Field label="Address" value={selectedStaff.address} fullWidth />
                            </div>
                        </div>

                        {/* Employment */}
                        <div className="border-t pt-4">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Employment Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Department" value={selectedStaff.department} />
                                <Field label="Position" value={selectedStaff.position} />
                                <Field label="Employment Type" value={selectedStaff.employment_type?.replace('-', ' ')} />
                                <Field label="Date Hired" value={selectedStaff.date_hired ? new Date(selectedStaff.date_hired).toLocaleDateString() : null} />
                                <Field label="Branch" value={getBranchName(selectedStaff.branch_id)} />
                                {selectedStaff.date_terminated && <Field label="Date Terminated" value={new Date(selectedStaff.date_terminated).toLocaleDateString()} />}
                            </div>
                        </div>

                        {/* Salary & Allowances */}
                        <div className="border-t pt-4">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Salary & Allowances</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Basic Salary" value={fmt(selectedStaff.basic_salary)} />
                                <Field label="Salary Frequency" value={selectedStaff.salary_frequency} />
                                <Field label="Housing Allowance" value={fmt(selectedStaff.housing_allowance)} />
                                <Field label="Transport Allowance" value={fmt(selectedStaff.transport_allowance)} />
                                <Field label="Other Allowances" value={fmt(selectedStaff.other_allowances)} />
                                <Field label="Gross Salary" value={<span className="text-green-600 font-semibold">{fmt(selectedStaff.gross_salary)}</span>} />
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="border-t pt-4">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Bank Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Bank Name" value={selectedStaff.bank_name} />
                                <Field label="Account Number" value={selectedStaff.account_number} mono />
                                <Field label="Account Name" value={selectedStaff.account_name} fullWidth />
                            </div>
                        </div>

                        {/* Identification */}
                        <div className="border-t pt-4">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Identification</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <Field label="Tax ID (TIN)" value={selectedStaff.tax_id} mono />
                                <Field label="National ID (NIN)" value={selectedStaff.national_id} mono />
                                <Field label="Pension Number" value={selectedStaff.pension_number} mono />
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="border-t pt-4">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Emergency Contact</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <Field label="Contact Name" value={selectedStaff.emergency_contact_name} />
                                <Field label="Contact Phone" value={selectedStaff.emergency_contact_phone} />
                                <Field label="Relationship" value={selectedStaff.emergency_contact_relationship} />
                            </div>
                        </div>

                        <div className="pt-4 border-t flex gap-2">
                            <Button variant="outline" onClick={() => { const s = selectedStaff; setSelectedStaff(null); handleEditStaff(s); }}>Edit Staff</Button>
                            <Button variant="danger" onClick={() => { const s = selectedStaff; setSelectedStaff(null); handleDeleteStaff(s); }}>Delete Staff</Button>
                        </div>
                    </div>
                )}
            </SlideOut>

            {/* ─── Edit Staff SlideOut ─────────────────────────────────────── */}
            <SlideOut isOpen={showStaffEdit} onClose={() => { setShowStaffEdit(false); setEditingStaff(null); }} title={`Edit Staff: ${editingStaff?.first_name || ''} ${editingStaff?.last_name || ''}`} size="lg">
                <StaffForm formData={formData} setFormData={setFormData} deptNames={deptNames} branches={branches} onSubmit={handleUpdateStaff} submitLabel="Update Staff" onCancel={() => { setShowStaffEdit(false); setEditingStaff(null); }} />
            </SlideOut>

            {/* ─── Create Staff SlideOut ───────────────────────────────────── */}
            <SlideOut isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Staff Member" size="lg">
                <StaffForm formData={formData} setFormData={setFormData} deptNames={deptNames} branches={branches} onSubmit={handleCreateStaff} submitLabel="Add Staff" onCancel={() => setShowCreate(false)} />
            </SlideOut>

            {/* ─── View Department SlideOut ────────────────────────────────── */}
            <SlideOut isOpen={!!selectedDept} onClose={() => setSelectedDept(null)} title={`Department: ${selectedDept?.name || ''}`} size="md">
                {selectedDept && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Code" value={selectedDept.code} mono />
                            <Field label="Status" value={<Badge variant={selectedDept.is_active ? 'approved' : 'draft'}>{selectedDept.is_active ? 'Active' : 'Inactive'}</Badge>} />
                            <Field label="Name" value={selectedDept.name} />
                            <Field label="Staff Count" value={<span className="font-semibold text-blue-600">{selectedDept.staff_count || 0}</span>} />
                            <Field label="Head of Department" value={selectedDept.head_of_department || 'Not Assigned'} fullWidth />
                            <Field label="Description" value={selectedDept.description || 'No description'} fullWidth />
                        </div>
                        <div className="pt-4 border-t">
                            <Button variant="outline" onClick={() => { setSelectedDept(null); handleEditDept(selectedDept); }}>Edit Department</Button>
                        </div>
                    </div>
                )}
            </SlideOut>

            {/* ─── Edit Department SlideOut ────────────────────────────────── */}
            <SlideOut isOpen={showDeptEdit} onClose={() => { setShowDeptEdit(false); setEditingDept(null); }} title={`Edit Department: ${editingDept?.name || ''}`} size="md">
                <DeptForm deptFormData={deptFormData} setDeptFormData={setDeptFormData} onSubmit={handleUpdateDept} submitLabel="Update Department" onCancel={() => { setShowDeptEdit(false); setEditingDept(null); }} checkboxId="edit_is_active" />
            </SlideOut>

            {/* ─── Create Department SlideOut ──────────────────────────────── */}
            <SlideOut isOpen={showDeptCreate} onClose={() => setShowDeptCreate(false)} title="Add Department" size="md">
                <DeptForm deptFormData={deptFormData} setDeptFormData={setDeptFormData} onSubmit={handleCreateDept} submitLabel="Create Department" onCancel={() => setShowDeptCreate(false)} checkboxId="is_active" />
            </SlideOut>

            {/* Bulk Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(null)}
                onConfirm={confirmBulkDelete}
                title="Delete Staff Members"
                message={`Are you sure you want to delete ${bulkDeleteConfirm?.count || 0} staff member(s)? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}
