import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';

const fmt = (n) => window.formatCurrency(n, { minimumFractionDigits: 2 });

const staffMember = {
    id: 1, employee_code: 'EMP-001', name: 'Musa Ibrahim', department: 'Production', job_title: 'Production Supervisor', employment_type: 'full_time', phone: '0803-456-7890', email: 'musa@company.com', address: '15 Factory Road, Kano', hire_date: '2023-03-15', status: 'active',
    bank_name: 'GTBank', account_number: '0123456789', account_name: 'Musa Ibrahim',
    salary: { basic: 250000, housing: 50000, transport: 30000, meal: 15000, gross: 345000, tax: 34500, pension: 20000, nhf: 6250, net: 284250 },
    emergency_contact: { name: 'Fatima Ibrahim', relationship: 'Wife', phone: '0812-345-6789' },
    documents: [
        { name: 'Employment Letter', date: '2023-03-15', type: 'pdf' },
        { name: 'NIN Certificate', date: '2023-03-10', type: 'pdf' },
        { name: 'Guarantor Form', date: '2023-03-12', type: 'pdf' },
    ]
};

const inputClass = 'w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
const readOnlyClass = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

function yearsOfService(hireDate) {
    const diff = new Date() - new Date(hireDate);
    const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    const months = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
    return years > 0 ? `${years} yr${years > 1 ? 's' : ''} ${months} mo` : `${months} mo`;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function StaffProfile() {
    const navigate = useNavigate();
    const { id } = useParams();
    const toast = useToast();
    const [editing, setEditing] = useState(false);

    const [form, setForm] = useState({
        name: staffMember.name,
        email: staffMember.email,
        phone: staffMember.phone,
        address: staffMember.address,
        hire_date: staffMember.hire_date,
        department: staffMember.department,
        job_title: staffMember.job_title,
        employment_type: staffMember.employment_type,
        status: staffMember.status,
        bank_name: staffMember.bank_name,
        account_number: staffMember.account_number,
        account_name: staffMember.account_name,
        salary: { ...staffMember.salary },
    });

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
    const setSalary = (key, val) => setForm(prev => ({ ...prev, salary: { ...prev.salary, [key]: Number(val) || 0 } }));

    const handleSave = () => {
        setEditing(false);
        toast.success('Staff profile updated');
    };

    const handleCancel = () => {
        setForm({
            name: staffMember.name, email: staffMember.email, phone: staffMember.phone, address: staffMember.address, hire_date: staffMember.hire_date, department: staffMember.department, job_title: staffMember.job_title, employment_type: staffMember.employment_type, status: staffMember.status,
            bank_name: staffMember.bank_name, account_number: staffMember.account_number, account_name: staffMember.account_name, salary: { ...staffMember.salary },
        });
        setEditing(false);
    };

    const employmentTypeLabel = { full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract' };
    const statusLabel = { active: 'Active', suspended: 'Suspended', terminated: 'Terminated' };

    const Field = ({ label, value, field, type = 'text' }) => (
        <div>
            <label className={labelClass}>{label}</label>
            {editing ? (
                <input type={type} value={value} onChange={(e) => set(field, e.target.value)} className={inputClass} />
            ) : (
                <p className={readOnlyClass}>{value || 'N/A'}</p>
            )}
        </div>
    );

    const SelectField = ({ label, value, field, options }) => (
        <div>
            <label className={labelClass}>{label}</label>
            {editing ? (
                <select value={value} onChange={(e) => set(field, e.target.value)} className={inputClass}>
                    {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            ) : (
                <p className={readOnlyClass}>{options[value]}</p>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/staff')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900">{form.name}</h1>
                            <Badge variant={form.employment_type === 'full_time' ? 'approved' : form.employment_type === 'contract' ? 'pending' : 'draft'}>
                                {employmentTypeLabel[form.employment_type]}
                            </Badge>
                        </div>
                        <p className="text-slate-500 font-mono text-sm mt-1">{staffMember.employee_code}</p>
                    </div>
                </div>
                {!editing ? (
                    <Button onClick={() => setEditing(true)}>Edit Profile</Button>
                ) : (
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                )}
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Info */}
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Full Name" value={form.name} field="name" />
                                <Field label="Email Address" value={form.email} field="email" type="email" />
                                <Field label="Phone Number" value={form.phone} field="phone" type="tel" />
                                <Field label="Address" value={form.address} field="address" />
                                <Field label="Hire Date" value={form.hire_date} field="hire_date" type="date" />
                            </div>
                        </CardBody>
                    </Card>

                    {/* Employment */}
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Employment Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Department" value={form.department} field="department" />
                                <Field label="Job Title" value={form.job_title} field="job_title" />
                                <SelectField label="Employment Type" value={form.employment_type} field="employment_type" options={employmentTypeLabel} />
                                <SelectField label="Status" value={form.status} field="status" options={statusLabel} />
                                <div>
                                    <label className={labelClass}>Hire Date</label>
                                    <p className={readOnlyClass}>{staffMember.hire_date}</p>
                                </div>
                                <div>
                                    <label className={labelClass}>Years of Service</label>
                                    <p className={readOnlyClass}>{yearsOfService(staffMember.hire_date)}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Bank Details */}
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Bank Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Bank Name" value={form.bank_name} field="bank_name" />
                                <Field label="Account Number" value={form.account_number} field="account_number" />
                                <Field label="Account Name" value={form.account_name} field="account_name" />
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    {/* Photo placeholder */}
                    <Card>
                        <CardBody className="flex flex-col items-center py-8">
                            <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                {getInitials(form.name)}
                            </div>
                            <p className="mt-4 font-semibold text-slate-900 text-lg">{form.name}</p>
                            <p className="text-slate-500 text-sm">{form.job_title}</p>
                        </CardBody>
                    </Card>

                    {/* Quick Stats */}
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Stats</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Years of Service', value: yearsOfService(staffMember.hire_date) },
                                    { label: 'Department', value: form.department },
                                    { label: 'Leave Balance', value: '18 days' },
                                    { label: 'Last Payroll', value: 'Jan 2026' },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                        <span className="text-sm text-slate-500">{item.label}</span>
                                        <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Emergency Contact */}
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Emergency Contact</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-500">Name</p>
                                    <p className="font-medium text-slate-900">{staffMember.emergency_contact.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Relationship</p>
                                    <p className="font-medium text-slate-900">{staffMember.emergency_contact.relationship}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Phone</p>
                                    <p className="font-medium text-slate-900">{staffMember.emergency_contact.phone}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Documents */}
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Documents</h3>
                            <div className="space-y-2">
                                {staffMember.documents.map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                                                <p className="text-xs text-slate-400">{doc.date}</p>
                                            </div>
                                        </div>
                                        <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Salary Structure - full width */}
            <Card>
                <CardBody>
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Salary Structure</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Earnings */}
                        <div>
                            <h4 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-4">Earnings</h4>
                            <div className="space-y-3">
                                {[
                                    { label: 'Basic Salary', key: 'basic' },
                                    { label: 'Housing Allowance', key: 'housing' },
                                    { label: 'Transport Allowance', key: 'transport' },
                                    { label: 'Meal Allowance', key: 'meal' },
                                ].map(({ label, key }) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">{label}</span>
                                        {editing ? (
                                            <input type="number" value={form.salary[key]} onChange={(e) => setSalary(key, e.target.value)} className="w-40 px-3 py-1.5 border border-slate-300 rounded-lg text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                                        ) : (
                                            <span className="text-sm font-medium text-slate-900">{fmt(form.salary[key])}</span>
                                        )}
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                                    <span className="text-sm font-semibold text-slate-900">Gross Salary</span>
                                    <span className="text-sm font-bold text-slate-900">{fmt(form.salary.gross)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div>
                            <h4 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-4">Deductions</h4>
                            <div className="space-y-3">
                                {[
                                    { label: 'Tax (PAYE)', key: 'tax' },
                                    { label: 'Pension', key: 'pension' },
                                    { label: 'NHF', key: 'nhf' },
                                ].map(({ label, key }) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">{label}</span>
                                        {editing ? (
                                            <input type="number" value={form.salary[key]} onChange={(e) => setSalary(key, e.target.value)} className="w-40 px-3 py-1.5 border border-slate-300 rounded-lg text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                                        ) : (
                                            <span className="text-sm font-medium text-red-600">-{fmt(form.salary[key])}</span>
                                        )}
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                                    <span className="text-sm font-semibold text-slate-900">Total Deductions</span>
                                    <span className="text-sm font-bold text-red-600">-{fmt(form.salary.tax + form.salary.pension + form.salary.nhf)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Salary */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center">
                        <span className="text-lg font-bold text-blue-900">Net Salary</span>
                        <span className="text-2xl font-bold text-blue-700">{fmt(form.salary.net)}</span>
                    </div>
                </CardBody>
            </Card>

            {/* Footer - edit mode */}
            {editing && (
                <div className="flex justify-end gap-3 pb-6">
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            )}
        </div>
    );
}
