import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { completeSetup } from '../../services/setupAPI';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../hooks/useAuth';
import { setAuthToken } from '../../services/api';

const fmt = (n) => '\u20a6' + Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 });

const STEP_LABELS = [
    'Company Profile',
    'Business Configuration',
    'Warehouses & Locations',
    'Departments',
    'Products & Units',
    'Admin Account',
    'Review & Launch',
];

const DEFAULT_DEPARTMENTS = [
    'Management',
    'Operations',
    'Production',
    'Sales & Marketing',
    'Finance & Accounts',
    'Procurement',
    'HR & Admin',
    'Quality Control',
    'Logistics',
];

const DEFAULT_CATEGORIES = [
    'Grains & Cereals',
    'Animal Feed',
    'Fertilizers',
    'Flour & Meals',
    'Oil & Fats',
    'Packaging Materials',
    'Chemicals & Additives',
    'Finished Products',
];

const DEFAULT_UNITS = [
    { name: 'Kilogram', abbreviation: 'kg' },
    { name: 'Tonne', abbreviation: 'tonnes' },
    { name: 'Bag (50kg)', abbreviation: 'bags (50kg)' },
    { name: 'Bag (100kg)', abbreviation: 'bags (100kg)' },
    { name: 'Litre', abbreviation: 'litres' },
    { name: 'Drum (25L)', abbreviation: 'drums (25L)' },
    { name: 'Drum (200L)', abbreviation: 'drums (200L)' },
    { name: 'Piece', abbreviation: 'pieces' },
    { name: 'Carton', abbreviation: 'cartons' },
];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function generateCode(name) {
    return name
        .replace(/&/g, '')
        .split(/[\s]+/)
        .filter(Boolean)
        .map((w) => w[0].toUpperCase())
        .join('');
}

const inputClass =
    'w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

function CheckIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Individual Step Components
// ---------------------------------------------------------------------------

function StepCompanyProfile({ data, onChange }) {
    const update = (field, value) => onChange({ ...data, [field]: value });

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome to FactoryPulse</h2>
            <p className="text-slate-500 mb-8">
                Let's get your agro-processing business set up. This wizard will walk you through the
                essential configuration. You can always adjust settings later.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className={labelClass}>
                        Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className={inputClass}
                        placeholder="e.g. ABC Manufacturing Ltd"
                        value={data.companyName}
                        onChange={(e) => update('companyName', e.target.value)}
                    />
                </div>

                <div>
                    <label className={labelClass}>RC/BN Number</label>
                    <input
                        type="text"
                        className={inputClass}
                        placeholder="e.g. RC-123456"
                        value={data.rcNumber}
                        onChange={(e) => update('rcNumber', e.target.value)}
                    />
                </div>

                <div>
                    <label className={labelClass}>Phone Number</label>
                    <input
                        type="text"
                        className={inputClass}
                        placeholder="e.g. +234 801 234 5678"
                        value={data.phone}
                        onChange={(e) => update('phone', e.target.value)}
                    />
                </div>

                <div>
                    <label className={labelClass}>Email</label>
                    <input
                        type="email"
                        className={inputClass}
                        placeholder="e.g. info@company.com"
                        value={data.email}
                        onChange={(e) => update('email', e.target.value)}
                    />
                </div>

                <div>
                    <label className={labelClass}>Company Address</label>
                    <textarea
                        className={inputClass + ' resize-none'}
                        rows={3}
                        placeholder="Full company address"
                        value={data.address}
                        onChange={(e) => update('address', e.target.value)}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className={labelClass}>Company Logo</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
                        <svg className="w-10 h-10 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <p className="text-sm text-slate-500 font-medium">Click to upload logo</p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 2MB</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepBusinessConfig({ data, onChange }) {
    const update = (field, value) => onChange({ ...data, [field]: value });

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Business Configuration</h2>
            <p className="text-slate-500 mb-8">
                Configure your financial and business preferences.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>Base Currency</label>
                    <select
                        className={inputClass}
                        value={data.currency}
                        onChange={(e) => update('currency', e.target.value)}
                    >
                        <option value="NGN">Nigerian Naira (NGN)</option>
                        <option value="USD">US Dollar (USD)</option>
                        <option value="GBP">British Pound (GBP)</option>
                        <option value="EUR">Euro (EUR)</option>
                    </select>
                </div>

                <div>
                    <label className={labelClass}>VAT Rate (%)</label>
                    <input
                        type="number"
                        className={inputClass}
                        step="0.1"
                        min="0"
                        value={data.vatRate}
                        onChange={(e) => update('vatRate', e.target.value)}
                    />
                </div>

                <div>
                    <label className={labelClass}>Fiscal Year Start</label>
                    <select
                        className={inputClass}
                        value={data.fiscalYearStart}
                        onChange={(e) => update('fiscalYearStart', e.target.value)}
                    >
                        {MONTHS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Date Format</label>
                    <select
                        className={inputClass}
                        value={data.dateFormat}
                        onChange={(e) => update('dateFormat', e.target.value)}
                    >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Number Format</label>
                    <select
                        className={inputClass}
                        value={data.numberFormat}
                        onChange={(e) => update('numberFormat', e.target.value)}
                    >
                        <option value="1,000.00">1,000.00</option>
                        <option value="1.000,00">1.000,00</option>
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Approval Threshold</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">{'\u20a6'}</span>
                        <input
                            type="number"
                            className={inputClass + ' pl-8'}
                            min="0"
                            value={data.approvalThreshold}
                            onChange={(e) => update('approvalThreshold', e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">Expenses above this amount will require approval</p>
                </div>
            </div>
        </div>
    );
}

function StepWarehouses({ data, onChange }) {
    const add = () =>
        onChange([...data, { name: '', address: '', type: 'Warehouse' }]);

    const remove = (idx) => onChange(data.filter((_, i) => i !== idx));

    const update = (idx, field, value) => {
        const next = [...data];
        next[idx] = { ...next[idx], [field]: value };
        onChange(next);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Warehouses & Locations</h2>
            <p className="text-slate-500 mb-8">
                Define the physical locations where your business operates.
            </p>

            <div className="space-y-4">
                {data.map((loc, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className={labelClass}>Name</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    placeholder="Location name"
                                    value={loc.name}
                                    onChange={(e) => update(idx, 'name', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Address</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    placeholder="Address"
                                    value={loc.address}
                                    onChange={(e) => update(idx, 'address', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Type</label>
                                <select
                                    className={inputClass}
                                    value={loc.type}
                                    onChange={(e) => update(idx, 'type', e.target.value)}
                                >
                                    <option value="Factory">Factory</option>
                                    <option value="Warehouse">Warehouse</option>
                                    <option value="Office">Office</option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="mt-7 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={add}
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
                <PlusIcon /> Add Location
            </button>

            <p className="text-xs text-slate-400 mt-4">You can add more locations later in Settings.</p>
        </div>
    );
}

function StepDepartments({ data, onChange }) {
    const add = () => onChange([...data, { name: '', code: '' }]);

    const remove = (idx) => onChange(data.filter((_, i) => i !== idx));

    const updateName = (idx, value) => {
        const next = [...data];
        next[idx] = { name: value, code: generateCode(value) };
        onChange(next);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Departments</h2>
            <p className="text-slate-500 mb-8">
                Define the departments in your organization. Codes are generated automatically.
            </p>

            <div className="space-y-3">
                {data.map((dept, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                        <div className="flex-1">
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="Department name"
                                value={dept.name}
                                onChange={(e) => updateName(idx, e.target.value)}
                            />
                        </div>
                        <div className="w-24 text-center">
                            <span className="inline-block px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-mono rounded-md">
                                {dept.code || '--'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={add}
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
                <PlusIcon /> Add Department
            </button>
        </div>
    );
}

function StepProductsUnits({ categories, units, onChangeCategories, onChangeUnits }) {
    const addCategory = () => onChangeCategories([...categories, '']);
    const removeCategory = (idx) => onChangeCategories(categories.filter((_, i) => i !== idx));
    const updateCategory = (idx, val) => {
        const next = [...categories];
        next[idx] = val;
        onChangeCategories(next);
    };

    const addUnit = () => onChangeUnits([...units, { name: '', abbreviation: '' }]);
    const removeUnit = (idx) => onChangeUnits(units.filter((_, i) => i !== idx));
    const updateUnit = (idx, field, val) => {
        const next = [...units];
        next[idx] = { ...next[idx], [field]: val };
        onChangeUnits(next);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Product Categories & Units</h2>
            <p className="text-slate-500 mb-8">
                Set up the categories for your products and units of measure used across the system.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Categories */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Product Categories</h3>
                    <div className="space-y-2">
                        {categories.map((cat, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    className={inputClass}
                                    placeholder="Category name"
                                    value={cat}
                                    onChange={(e) => updateCategory(idx, e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeCategory(idx)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addCategory}
                        className="mt-3 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                        <PlusIcon /> Add Category
                    </button>
                </div>

                {/* Units */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Units of Measure</h3>
                    <div className="space-y-2">
                        {units.map((unit, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    className={inputClass + ' flex-1'}
                                    placeholder="Unit name"
                                    value={unit.name}
                                    onChange={(e) => updateUnit(idx, 'name', e.target.value)}
                                />
                                <input
                                    type="text"
                                    className={inputClass + ' w-32'}
                                    placeholder="Abbr."
                                    value={unit.abbreviation}
                                    onChange={(e) => updateUnit(idx, 'abbreviation', e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeUnit(idx)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addUnit}
                        className="mt-3 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                        <PlusIcon /> Add Unit
                    </button>
                </div>
            </div>
        </div>
    );
}

function StepAdminAccount({ data, onChange }) {
    const update = (field, value) => onChange({ ...data, [field]: value });

    const passwordsMatch = data.password && data.confirmPassword && data.password === data.confirmPassword;
    const passwordsMismatch = data.confirmPassword && data.password !== data.confirmPassword;

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Create Admin Account</h2>
            <p className="text-slate-500 mb-8">
                Set up the primary administrator account for the system.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div className="md:col-span-2">
                    <label className={labelClass}>
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className={inputClass}
                        placeholder="e.g. Adamu Giwa"
                        value={data.fullName}
                        onChange={(e) => update('fullName', e.target.value)}
                    />
                </div>

                <div>
                    <label className={labelClass}>
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        className={inputClass}
                        placeholder="admin@company.com"
                        value={data.email}
                        onChange={(e) => update('email', e.target.value)}
                    />
                </div>

                <div>
                    <label className={labelClass}>Phone</label>
                    <input
                        type="text"
                        className={inputClass}
                        placeholder="+234 801 234 5678"
                        value={data.phone}
                        onChange={(e) => update('phone', e.target.value)}
                    />
                </div>

                <div>
                    <label className={labelClass}>
                        Password <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        className={inputClass}
                        placeholder="Min. 8 characters"
                        value={data.password}
                        onChange={(e) => update('password', e.target.value)}
                    />
                </div>

                <div>
                    <label className={labelClass}>
                        Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        className={inputClass + (passwordsMismatch ? ' border-red-400 focus:border-red-500 focus:ring-red-100' : '') + (passwordsMatch ? ' border-green-400 focus:border-green-500 focus:ring-green-100' : '')}
                        placeholder="Re-enter password"
                        value={data.confirmPassword}
                        onChange={(e) => update('confirmPassword', e.target.value)}
                    />
                    {passwordsMismatch && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                    {passwordsMatch && (
                        <p className="text-xs text-green-600 mt-1">Passwords match</p>
                    )}
                </div>

                <div className="md:col-span-2">
                    <label className={labelClass}>Role</label>
                    <div className="flex items-center gap-3">
                        <Badge>Super Admin</Badge>
                        <span className="text-xs text-slate-400">Locked — full system access</span>
                    </div>
                </div>
            </div>

            <p className="text-xs text-slate-400 mt-8">
                You can create additional users and assign roles after setup.
            </p>
        </div>
    );
}

function StepReview({ wizardData }) {
    const { company, business, warehouses, departments, categories, units, admin } = wizardData;

    const summaryCards = [
        {
            title: 'Company',
            items: [
                { label: 'Name', value: company.companyName || '-' },
                { label: 'Address', value: company.address || '-' },
            ],
        },
        {
            title: 'Business',
            items: [
                { label: 'Currency', value: business.currency },
                { label: 'VAT Rate', value: business.vatRate + '%' },
                { label: 'Fiscal Year', value: business.fiscalYearStart },
            ],
        },
        {
            title: 'Locations',
            items: [
                { label: 'Total', value: warehouses.filter((w) => w.name).length + ' location(s)' },
            ],
        },
        {
            title: 'Departments',
            items: [
                { label: 'Total', value: departments.filter((d) => d.name).length + ' department(s)' },
            ],
        },
        {
            title: 'Products',
            items: [
                { label: 'Categories', value: categories.filter(Boolean).length },
                { label: 'Units', value: units.filter((u) => u.name).length },
            ],
        },
        {
            title: 'Admin',
            items: [
                { label: 'Name', value: admin.fullName || '-' },
                { label: 'Email', value: admin.email || '-' },
            ],
        },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Review & Launch</h2>
            <p className="text-slate-500 mb-8">
                Review your configuration before launching the ERP system.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {summaryCards.map((card) => (
                    <Card key={card.title}>
                        <CardBody>
                            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                {card.title}
                            </h4>
                            <dl className="space-y-2">
                                {card.items.map((item) => (
                                    <div key={item.label} className="flex justify-between text-sm">
                                        <dt className="text-slate-500">{item.label}</dt>
                                        <dd className="font-medium text-slate-800">{item.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </CardBody>
                    </Card>
                ))}
            </div>

            <div className="text-center p-6 bg-green-50 border border-green-200 rounded-xl">
                <svg className="w-12 h-12 mx-auto text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-green-800 mb-1">Everything looks good?</h3>
                <p className="text-sm text-green-600">
                    Click "Launch FactoryPulse" below to complete setup and start using the system.
                </p>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Wizard Component
// ---------------------------------------------------------------------------

export default function SetupWizard() {
    const navigate = useNavigate();
    const { startTour } = useOnboarding();
    const { setUser } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const [wizardData, setWizardData] = useState({
        company: {
            companyName: '',
            rcNumber: '',
            address: '',
            phone: '',
            email: '',
        },
        business: {
            currency: 'NGN',
            vatRate: '7.5',
            fiscalYearStart: 'January',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: '1,000.00',
            approvalThreshold: '50000',
        },
        warehouses: [{ name: 'Main Factory', address: '', type: 'Factory' }],
        departments: DEFAULT_DEPARTMENTS.map((name) => ({ name, code: generateCode(name) })),
        categories: [...DEFAULT_CATEGORIES],
        units: [...DEFAULT_UNITS],
        admin: {
            fullName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
        },
    });

    const updateField = useCallback((section, value) => {
        setWizardData((prev) => ({ ...prev, [section]: value }));
    }, []);

    const canProceed = () => {
        switch (currentStep) {
            case 0:
                return wizardData.company.companyName.trim() !== '';
            case 5: {
                const a = wizardData.admin;
                return (
                    a.fullName.trim() !== '' &&
                    a.email.trim() !== '' &&
                    a.password.trim().length >= 8 &&
                    a.password === a.confirmPassword
                );
            }
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (currentStep < 6) setCurrentStep((s) => s + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep((s) => s - 1);
    };

    const handleLaunch = async () => {
        console.log('handleLaunch called');
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Transform wizard data to API format
            const apiData = {
                company: {
                    name: wizardData.company.companyName,
                    email: wizardData.company.email,
                    phone: wizardData.company.phone,
                    address: wizardData.company.address,
                    tax_id: wizardData.company.rcNumber,
                },
                business: {
                    currency: wizardData.business.currency,
                    vat_rate: parseFloat(wizardData.business.vatRate) || 7.5,
                    fiscal_year_start: wizardData.business.fiscalYearStart,
                    date_format: wizardData.business.dateFormat,
                    number_format: wizardData.business.numberFormat,
                    approval_threshold: parseFloat(wizardData.business.approvalThreshold) || 50000,
                },
                warehouses: wizardData.warehouses.filter(w => w.name && w.name.trim() !== ''),
                departments: wizardData.departments.filter(d => d.name && d.name.trim() !== ''),
                products: {
                    categories: wizardData.categories.filter(c => c && c.trim() !== ''),
                    units: wizardData.units.filter(u => u.name && u.name.trim() !== ''),
                },
                admin: {
                    name: wizardData.admin.fullName,
                    email: wizardData.admin.email,
                    phone: wizardData.admin.phone,
                    password: wizardData.admin.password,
                },
            };

            console.log('Submitting setup data:', apiData);
            const response = await completeSetup(apiData);
            console.log('Setup response:', response);

            if (response.success) {
                // Store auth token
                if (response.token) {
                    localStorage.setItem('auth_token', response.token);
                    setAuthToken(response.token);
                }
                if (response.user) {
                    setUser(response.user);
                }

                // Mark setup as complete
                localStorage.setItem('factorypulse_setup_complete', 'true');
                localStorage.setItem('factorypulse_setup_data', JSON.stringify(wizardData));
                localStorage.setItem('factorypulse_show_tour', 'true');

                // Navigate to dashboard and start the onboarding tour
                navigate('/dashboard');
                
                // Start the tour after a short delay to let dashboard render
                setTimeout(() => {
                    startTour();
                }, 1000);
            }
        } catch (error) {
            console.error('Setup failed:', error);
            let errorMessage = 'Setup failed. Please try again.';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.errors) {
                errorMessage = Object.values(error.response.data.errors).flat().join(', ');
            }
            
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <StepCompanyProfile data={wizardData.company} onChange={(v) => updateField('company', v)} />;
            case 1:
                return <StepBusinessConfig data={wizardData.business} onChange={(v) => updateField('business', v)} />;
            case 2:
                return <StepWarehouses data={wizardData.warehouses} onChange={(v) => updateField('warehouses', v)} />;
            case 3:
                return <StepDepartments data={wizardData.departments} onChange={(v) => updateField('departments', v)} />;
            case 4:
                return (
                    <StepProductsUnits
                        categories={wizardData.categories}
                        units={wizardData.units}
                        onChangeCategories={(v) => updateField('categories', v)}
                        onChangeUnits={(v) => updateField('units', v)}
                    />
                );
            case 5:
                return <StepAdminAccount data={wizardData.admin} onChange={(v) => updateField('admin', v)} />;
            case 6:
                return <StepReview wizardData={wizardData} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
                {/* Branding */}
                <div className="px-6 py-6 border-b border-slate-100">
                    <h1 className="text-xl font-bold text-slate-800">
                        <span className="text-blue-600">Factory</span>Pulse
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">Setup Wizard</p>
                </div>

                {/* Step List */}
                <nav className="flex-1 px-6 py-6 overflow-y-auto">
                    <ul className="space-y-1">
                        {STEP_LABELS.map((label, idx) => {
                            const isCompleted = idx < currentStep;
                            const isCurrent = idx === currentStep;

                            return (
                                <li key={label} className="relative">
                                    {/* Connecting line */}
                                    {idx < STEP_LABELS.length - 1 && (
                                        <div
                                            className={
                                                'absolute left-[17px] top-10 w-0.5 h-6 ' +
                                                (idx < currentStep ? 'bg-green-400' : 'bg-slate-200')
                                            }
                                        />
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (idx <= currentStep) setCurrentStep(idx);
                                        }}
                                        className={
                                            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors ' +
                                            (isCurrent
                                                ? 'bg-blue-50'
                                                : idx <= currentStep
                                                  ? 'hover:bg-slate-50 cursor-pointer'
                                                  : 'cursor-default')
                                        }
                                    >
                                        {/* Step circle */}
                                        <span
                                            className={
                                                'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 transition-colors ' +
                                                (isCompleted
                                                    ? 'bg-green-500 text-white'
                                                    : isCurrent
                                                      ? 'bg-blue-600 text-white'
                                                      : 'bg-slate-200 text-slate-500')
                                            }
                                        >
                                            {isCompleted ? <CheckIcon /> : idx + 1}
                                        </span>

                                        <span
                                            className={
                                                'text-sm font-medium ' +
                                                (isCurrent
                                                    ? 'text-blue-700'
                                                    : isCompleted
                                                      ? 'text-slate-700'
                                                      : 'text-slate-400')
                                            }
                                        >
                                            {label}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Sidebar footer */}
                <div className="px-6 py-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 text-center">
                        Step {currentStep + 1} of 7
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0">
                {/* Top bar */}
                <header className="shrink-0 px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500">
                            Step {currentStep + 1} of 7
                        </p>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {STEP_LABELS[currentStep]}
                        </h2>
                    </div>

                    {/* Progress bar */}
                    <div className="w-48">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${((currentStep + 1) / 7) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 text-right mt-1">
                            {Math.round(((currentStep + 1) / 7) * 100)}% complete
                        </p>
                    </div>
                </header>

                {/* Step content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {renderStep()}
                </div>

                {/* Footer navigation */}
                <footer className="shrink-0 px-8 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
                    <div>
                        {currentStep > 0 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                                Back
                            </button>
                        )}
                    </div>

                    <div>
                        {currentStep < 6 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className={
                                    'inline-flex items-center px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ' +
                                    (canProceed()
                                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                                        : 'text-slate-400 bg-slate-100 cursor-not-allowed')
                                }
                            >
                                Next
                                <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <div className="flex items-center gap-4">
                                {submitError && (
                                    <p className="text-sm text-red-600 max-w-xs">{submitError}</p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleLaunch}
                                    disabled={isSubmitting}
                                    className={
                                        'inline-flex items-center px-8 py-3 text-base font-semibold text-white rounded-lg shadow-lg transition-colors ' +
                                        (isSubmitting
                                            ? 'bg-green-400 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700 shadow-green-200')
                                    }
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Setting up...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                            </svg>
                                            Launch FactoryPulse
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </footer>
            </main>
        </div>
    );
}
