import { useState, useEffect, useCallback, useRef } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import settingsAPI, {
    companyAPI, branchesAPI, inventorySettingsAPI, salesSettingsAPI,
    taxesAPI, paymentMethodsAPI, bankAccountsAPI, sequencesAPI,
    approvalsAPI, payrollSettingsAPI, fiscalYearAPI, notificationSettingsAPI,
    smsSettingsAPI, emailSettingsAPI, printSettingsAPI, creditSettingsAPI, 
    creditFacilityTypesAPI, backupAPI, templatesAPI, apiSettingsAPI
} from '../../services/settingsAPI';
import documentAPI, { openPdfInNewTab } from '../../services/documentAPI';
import warehouseAPI from '../../services/warehouseAPI';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import userAPI from '../../services/userAPI';

const fmt = (n) => formatCurrency(n, { minimumFractionDigits: 2 });

const sections = [
    { key: 'company', label: 'Company Profile', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { key: 'branches', label: 'Branches', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { key: 'inventory', label: 'Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { key: 'sales', label: 'Sales & Billing', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'taxes', label: 'Taxes & Charges', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
    { key: 'payment_methods', label: 'Payment Methods', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { key: 'banks', label: 'Banks & Accounts', icon: 'M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4z' },
    { key: 'sequences', label: 'Number Sequences', icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14' },
    { key: 'approvals', label: 'Approval Workflows', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'payroll', label: 'Payroll & HR', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'fiscal', label: 'Fiscal Year', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { key: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { key: 'sms', label: 'SMS / WhatsApp', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { key: 'roles', label: 'Roles & Permissions', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { key: 'email', label: 'Email Setup', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { key: 'print', label: 'Print & Receipts', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
    { key: 'templates', label: 'Doc Templates', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { key: 'credit', label: 'Credit Facility', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { key: 'backup', label: 'Backup & Data', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
    { key: 'api', label: 'API & Integrations', icon: 'M4 6h16M4 12h16M4 18h16M9 6v12' },
];

export default function Settings() {
    const toast = useToast();
    const { startTour, resetTour, tourComplete } = useOnboarding();
    const [activeSection, setActiveSection] = useState('company');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const logoInputRef = useRef(null);

    const handleStartTour = () => {
        resetTour();
        startTour();
        toast.success('Tour started! Follow the highlights to learn about FactoryPulse.');
    };

    // Company Profile
    const [company, setCompany] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        rc_number: '',
        tin: '',
        logo_url: '',
        website: '',
    });

    // Inventory Settings
    const [inventory, setInventory] = useState({
        default_warehouse: '',
        sku_prefix_raw: '',
        sku_prefix_finished: '',
        auto_generate_sku: true,
        enable_batch_tracking: true,
        enable_expiry_tracking: true,
        drying_loss_tolerance: 5,
        low_stock_threshold: 20,
        critical_stock_threshold: 10,
    });
    const [warehouses, setWarehouses] = useState([]);
    const [showAddWarehouse, setShowAddWarehouse] = useState(false);
    const [warehouseForm, setWarehouseForm] = useState({
        name: '',
        code: '',
        location: '',
        address: '',
        phone: '',
    });

    // Sales & Billing
    const [sales, setSales] = useState({
        invoice_prefix: 'INV',
        invoice_next_number: 1,
        receipt_prefix: 'RCT',
        default_payment_terms: 30,
        credit_enforcement: true,
        global_credit_limit: 0,
        allow_partial_payments: true,
        invoice_footer: '',
        currency: 'NGN',
        currency_symbol: getCurrencySymbol(),
    });

    // Taxes & Statutory Charges
    const [taxes, setTaxes] = useState([]);
    const [showAddTax, setShowAddTax] = useState(false);
    const [editingTax, setEditingTax] = useState(null);
    const [taxForm, setTaxForm] = useState({
        name: '', code: '', rate: '', type: 'percentage', applies_to: 'sales', is_compound: false,
    });

    const handleSaveTax = async () => {
        if (!taxForm.name || !taxForm.code || !taxForm.rate) {
            toast.error('Please fill in all required fields');
            return;
        }
        setSaving(true);
        try {
            if (editingTax) {
                await taxesAPI.update(editingTax.id, { ...taxForm, rate: Number(taxForm.rate) });
                setTaxes(prev => prev.map(t => t.id === editingTax.id ? { ...t, ...taxForm, rate: Number(taxForm.rate) } : t));
                toast.success('Tax/charge updated');
            } else {
                const res = await taxesAPI.create({ ...taxForm, rate: Number(taxForm.rate) });
                const newTax = res.data?.data?.tax || res.data?.data || { id: Date.now(), ...taxForm, rate: Number(taxForm.rate), is_active: true };
                setTaxes(prev => [...prev, newTax]);
                toast.success('Tax/charge created');
            }
            setShowAddTax(false);
            setEditingTax(null);
            setTaxForm({ name: '', code: '', rate: '', type: 'percentage', applies_to: 'sales', is_compound: false });
        } catch (error) {
            console.error('Failed to save tax:', error);
            toast.error('Failed to save tax/charge');
        } finally {
            setSaving(false);
        }
    };

    const handleEditTax = (t) => {
        setEditingTax(t);
        setTaxForm({ name: t.name, code: t.code, rate: t.rate, type: t.type, applies_to: t.applies_to, is_compound: t.is_compound });
        setShowAddTax(true);
    };

    // Payment Methods
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [showAddPayMethod, setShowAddPayMethod] = useState(false);
    const [payMethodForm, setPayMethodForm] = useState({ name: '', code: '', bank_account: '', requires_reference: false });

    // Banks & Accounts
    const [bankAccounts, setBankAccounts] = useState([]);
    const [showAddBank, setShowAddBank] = useState(false);
    const [bankForm, setBankForm] = useState({ bank_name: '', account_name: '', account_number: '', account_type: 'current' });

    // Number Sequences
    const [sequences, setSequences] = useState([]);

    // Branches
    const [branches, setBranches] = useState([]);
    const [showAddBranch, setShowAddBranch] = useState(false);
    const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', phone: '' });

    // SMS / WhatsApp
    const [sms, setSms] = useState({
        provider: 'termii',
        api_key: '',
        sender_id: 'FactoryPulse',
        enable_sms: false,
        enable_whatsapp: false,
        order_confirmation: true,
        payment_receipt: true,
        delivery_alert: true,
        payment_reminder: false,
    });

    // Fiscal Year
    const [fiscal, setFiscal] = useState({
        start_month: 1,
        start_day: 1,
        current_year_label: 'FY 2026',
        auto_close: false,
        lock_closed_periods: true,
    });

    // Print & Receipts
    const [print, setPrint] = useState({
        receipt_paper_size: '80mm',
        auto_print_pos: true,
        show_logo_on_receipt: true,
        show_company_address: true,
        receipt_footer: 'Thank you for your patronage!',
        copies_invoice: 2,
        copies_delivery: 3,
        copies_receipt: 1,
    });

    // Document Templates
    const [templates, setTemplates] = useState([]);
    const [showAddTemplate, setShowAddTemplate] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        description: '',
        fields: '',
    });

    // Approval Workflows
    const [approvals, setApprovals] = useState({
        // Per-module toggles & thresholds
        sales_order_require_approval: true,
        sales_order_threshold: 1000000,
        purchase_order_require_approval: true,
        purchase_order_threshold: 500000,
        expense_require_approval: true,
        expense_threshold: 100000,
        payroll_require_approval: true,
        inventory_adjustment_approval: true,
        credit_over_limit_approval: true,
        production_require_approval: false,
        production_threshold: 0,
        // Discount
        sales_discount_threshold: 10,
        // Escalation
        require_dual_approval_above: 2000000,
        auto_escalate_after_hours: 24,
        max_approval_levels: 2,
        // Role separation
        creator_cannot_approve: true,
        booking_cannot_cashier: true,
        cashier_cannot_accountant: true,
        same_user_cannot_receive_po: true,
        // Notifications
        notify_on_pending_approval: true,
        notify_on_approval_complete: true,
        notify_on_rejection: true,
        reminder_hours: 12,
        // Workflow builder
        workflow: {
            sales_order: [
                { min: 0, max: 100000, role: 'Manager' },
                { min: 100001, max: 500000, role: 'Finance' },
                { min: 500001, max: null, role: 'Admin' },
            ],
            purchase_order: [
                { min: 0, max: 100000, role: 'Manager' },
                { min: 100001, max: 500000, role: 'Finance' },
                { min: 500001, max: null, role: 'Admin' },
            ],
            expense: [
                { min: 0, max: 50000, role: 'Manager' },
                { min: 50001, max: 200000, role: 'Finance' },
                { min: 200001, max: null, role: 'Admin' },
            ],
        },
    });
    const [approvalRoles, setApprovalRoles] = useState([]);
    const [approvalModule, setApprovalModule] = useState('sales_order');

    // Roles & Permissions
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [showAddRole, setShowAddRole] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm, setRoleForm] = useState({ name: '', permissions: [] });
    const [roleSearch, setRoleSearch] = useState('');
    const [permissionGroupsOpen, setPermissionGroupsOpen] = useState({});

    // API & Integrations
    const [apiSettings, setApiSettings] = useState({
        api_enabled: false,
        api_key: '',
        allowed_ips: [],
        webhook_url: '',
        webhook_secret: '',
        rate_limit_per_min: 60,
    });
    const [showApiKey, setShowApiKey] = useState(false);
    const [apiDocsSearch, setApiDocsSearch] = useState('');

    // Payroll
    const [payroll, setPayroll] = useState({
        pay_period: 'monthly',
        pay_day: 25,
        tax_enabled: true,
        pension_rate: 8,
        pension_employer_rate: 10,
        nhf_rate: 2.5,
        default_allowance_types: 'Housing, Transport, Meal, Medical',
        default_deduction_types: 'Tax, Pension, NHF, Loan',
    });

    // Notifications
    const [notifications, setNotifications] = useState({
        // Stock
        low_stock_alert: true,
        critical_stock_alert: true,
        
        // Sales & Orders
        new_sales_order: true,
        sales_order_approved: true,
        sales_order_cancelled: true,
        order_confirmation: true,
        
        // POS
        pos_sale_complete: true,
        pos_refund_processed: true,
        pos_shift_end_summary: true,
        
        // Payments
        payment_received: true,
        payment_overdue: true,
        payment_due_reminder: true,
        payment_due_days_before: 3,
        
        // Credit
        credit_limit_warning: true,
        credit_limit_exceeded: true,
        
        // Production
        production_started: true,
        production_complete: true,
        production_materials_low: true,
        
        // Purchases
        purchase_order_created: true,
        purchase_order_received: true,
        
        // Workflow
        approval_request_notify: true,
        expense_approved_notify: true,
        payroll_processed_notify: true,
        
        // Summaries
        daily_summary_email: false,
        weekly_summary: true,
    });

    // Email Setup
    const [email, setEmail] = useState({
        driver: 'smtp',
        host: '',
        port: 587,
        encryption: 'tls',
        username: '',
        password: '',
        from_address: 'info@factorypulse.com',
        from_name: 'FactoryPulse',
    });
    const [testEmail, setTestEmail] = useState('');
    const [testStatus, setTestStatus] = useState(null); // null | 'sending' | 'success' | 'error'
    const [testMessage, setTestMessage] = useState('');

    const handleTestEmail = () => {
        if (!testEmail) { toast.error('Please enter a test email address'); return; }
        if (!email.host || !email.username) { toast.error('Please configure SMTP settings first'); return; }
        setTestStatus('sending');
        setTestMessage('');
        // Simulate sending
        setTimeout(() => {
            if (email.host && email.username && email.password) {
                setTestStatus('success');
                setTestMessage(`Test email sent successfully to ${testEmail}`);
                toast.success('Test email sent!');
            } else {
                setTestStatus('error');
                setTestMessage('Connection failed: Please verify your SMTP credentials');
                toast.error('Test email failed');
            }
        }, 2000);
    };

    // Backup
    const [backup, setBackup] = useState({
        auto_backup_enabled: true,
        backup_frequency: 'daily',
        backup_time: '02:00',
        backup_retention_days: 30,
        backup_to_cloud: false,
        cloud_provider: 's3',
        last_backup_at: null,
        last_backup_size: null,
        database_size: null,
    });
    const [restoreFile, setRestoreFile] = useState(null);

    // Credit Facility Types
    const [creditFacilities, setCreditFacilities] = useState([]);
    const [creditSettings, setCreditSettings] = useState({
        enable_credit_sales: true,
        default_credit_limit: 500000,
        credit_period_days: 30,
        auto_block_overdue: true,
        overdue_block_days: 7,
        require_approval_over_limit: true,
        credit_check_on_order: true,
        send_credit_alerts: true,
        credit_alert_threshold: 80,
        allow_partial_credit: true,
    });
    const [showAddFacility, setShowAddFacility] = useState(false);
    const [editingFacility, setEditingFacility] = useState(null);
    const [facilityForm, setFacilityForm] = useState({
        name: '', 
        code: '', 
        default_limit: '', 
        max_limit: '', 
        payment_terms: 30, 
        payment_terms_unit: 'days',
        interest_rate: 0, 
        grace_period: 0,
        grace_period_unit: 'days',
        description: '',
    });

    const handleSaveFacility = async () => {
        if (!facilityForm.name || !facilityForm.code || !facilityForm.default_limit) {
            toast.error('Please fill in all required fields');
            return;
        }
        
        try {
            setSaving(true);
            const data = {
                ...facilityForm,
                default_limit: Number(facilityForm.default_limit),
                max_limit: Number(facilityForm.max_limit) || Number(facilityForm.default_limit) * 2,
                interest_rate: Number(facilityForm.interest_rate) || 0,
                grace_period: Number(facilityForm.grace_period) || 0,
            };
            
            if (editingFacility) {
                await creditFacilityTypesAPI.update(editingFacility.id, data);
                toast.success('Credit facility updated');
            } else {
                await creditFacilityTypesAPI.create(data);
                toast.success('Credit facility created');
            }
            
            // Refresh list
            const res = await creditFacilityTypesAPI.getAll();
            setCreditFacilities(res.data?.data || []);
            
            setShowAddFacility(false);
            setEditingFacility(null);
            setFacilityForm({ 
                name: '', code: '', default_limit: '', max_limit: '', 
                payment_terms: 30, payment_terms_unit: 'days',
                interest_rate: 0, grace_period: 0, grace_period_unit: 'days', description: ''
            });
        } catch (error) {
            console.error('Error saving facility:', error);
            toast.error(error.response?.data?.message || 'Failed to save credit facility');
        } finally {
            setSaving(false);
        }
    };

    const handleEditFacility = (f) => {
        setEditingFacility(f);
        setFacilityForm({ 
            name: f.name, 
            code: f.code, 
            default_limit: f.default_limit, 
            max_limit: f.max_limit, 
            payment_terms: f.payment_terms, 
            payment_terms_unit: f.payment_terms_unit || 'days',
            interest_rate: f.interest_rate, 
            grace_period: f.grace_period,
            grace_period_unit: f.grace_period_unit || 'days',
            description: f.description || ''
        });
        setShowAddFacility(true);
    };

    // Branch API handlers
    const handleCreateBranch = async () => {
        if (!branchForm.name || !branchForm.code) {
            toast.error('Name and code required');
            return;
        }
        setSaving(true);
        try {
            const res = await branchesAPI.create({
                name: branchForm.name,
                branch_code: branchForm.code,
                address: branchForm.address,
                phone: branchForm.phone,
            });
            const newBranch = res.data?.data?.branch || res.data?.data || res.data;
            setBranches(prev => [...prev, newBranch]);
            setShowAddBranch(false);
            setBranchForm({ name: '', code: '', address: '', phone: '' });
            toast.success('Branch created');
        } catch (error) {
            console.error('Failed to create branch:', error);
            toast.error('Failed to create branch');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleBranchActive = async (branch) => {
        try {
            await branchesAPI.toggleActive(branch.id);
            setBranches(prev => prev.map(b => b.id === branch.id ? { ...b, is_active: !b.is_active } : b));
            toast.success(branch.is_active ? 'Branch deactivated' : 'Branch activated');
        } catch (error) {
            console.error('Failed to toggle branch:', error);
            toast.error('Failed to update branch');
        }
    };

    // Payment Method API handlers
    const handleCreatePaymentMethod = async () => {
        if (!payMethodForm.name || !payMethodForm.code) {
            toast.error('Name and code required');
            return;
        }
        setSaving(true);
        try {
            const res = await paymentMethodsAPI.create(payMethodForm);
            const newMethod = res.data?.data?.payment_method || res.data?.data || res.data;
            setPaymentMethods(prev => [...prev, newMethod]);
            setShowAddPayMethod(false);
            setPayMethodForm({ name: '', code: '', bank_account: '', requires_reference: false });
            toast.success('Payment method created');
        } catch (error) {
            console.error('Failed to create payment method:', error);
            toast.error('Failed to create payment method');
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePaymentMethodActive = async (method) => {
        try {
            await paymentMethodsAPI.toggleActive(method.id);
            setPaymentMethods(prev => prev.map(m => m.id === method.id ? { ...m, is_active: !m.is_active } : m));
            toast.success(method.is_active ? 'Method deactivated' : 'Method activated');
        } catch (error) {
            console.error('Failed to toggle payment method:', error);
            toast.error('Failed to update payment method');
        }
    };

    // Bank Account API handlers
    const handleCreateBankAccount = async () => {
        if (!bankForm.bank_name || !bankForm.account_number) {
            toast.error('Bank name and account number required');
            return;
        }
        setSaving(true);
        try {
            const res = await bankAccountsAPI.create(bankForm);
            const newAccount = res.data?.data?.bank_account || res.data?.data || res.data;
            setBankAccounts(prev => [...prev, newAccount]);
            setShowAddBank(false);
            setBankForm({ bank_name: '', account_name: '', account_number: '', account_type: 'current' });
            toast.success('Bank account created');
        } catch (error) {
            console.error('Failed to create bank account:', error);
            toast.error('Failed to create bank account');
        } finally {
            setSaving(false);
        }
    };

    const handleSetDefaultBankAccount = async (account) => {
        try {
            await bankAccountsAPI.setDefault(account.id);
            setBankAccounts(prev => prev.map(b => ({ ...b, is_default: b.id === account.id })));
            toast.success('Default account updated');
        } catch (error) {
            console.error('Failed to set default:', error);
            toast.error('Failed to update default account');
        }
    };

    const handleToggleTaxActive = async (tax) => {
        try {
            await taxesAPI.toggleActive(tax.id);
            setTaxes(prev => prev.map(t => t.id === tax.id ? { ...t, is_active: !t.is_active } : t));
            toast.success(tax.is_active ? 'Tax deactivated' : 'Tax activated');
        } catch (error) {
            console.error('Failed to toggle tax:', error);
            toast.error('Failed to update tax');
        }
    };

    const handleDeleteTax = async (tax) => {
        try {
            await taxesAPI.delete(tax.id);
            setTaxes(prev => prev.filter(t => t.id !== tax.id));
            toast.success(`${tax.name} deleted`);
        } catch (error) {
            console.error('Failed to delete tax:', error);
            toast.error('Failed to delete tax');
        }
    };

    const handleSaveWarehouse = async () => {
        if (!warehouseForm.name || !warehouseForm.code) {
            toast.error('Please enter warehouse name and code');
            return;
        }
        setSaving(true);
        try {
            const res = await warehouseAPI.createWarehouse({
                ...warehouseForm,
                code: warehouseForm.code.toUpperCase(),
            });
            const newWarehouse = res?.warehouse || res?.data || res;
            if (newWarehouse) {
                setWarehouses((prev) => [...prev, newWarehouse].sort((a, b) => a.name.localeCompare(b.name)));
                if (!inventory.default_warehouse) {
                    setInventory((prev) => ({ ...prev, default_warehouse: newWarehouse.name }));
                }
            }
            setShowAddWarehouse(false);
            setWarehouseForm({ name: '', code: '', location: '', address: '', phone: '' });
            toast.success('Warehouse created');
        } catch (error) {
            console.error('Failed to create warehouse:', error);
            toast.error('Failed to create warehouse');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteWarehouse = async (warehouse) => {
        try {
            await warehouseAPI.deleteWarehouse(warehouse.id, 'Deleted from settings');
            setWarehouses((prev) => prev.filter((w) => w.id !== warehouse.id));
            toast.success('Warehouse removed');
        } catch (error) {
            console.error('Failed to delete warehouse:', error);
            toast.error('Failed to delete warehouse');
        }
    };

    const [backupHistory, setBackupHistory] = useState([]);

    // Fetch data based on active section
    const fetchSectionData = useCallback(async (section) => {
        setLoading(true);
        try {
            switch (section) {
                case 'company': {
                    const res = await companyAPI.get();
                    if (res.data?.data) {
                        const normalizedLogoUrl = normalizeLogoUrl(res.data.data.logo_url);
                        setCompany({ ...res.data.data, logo_url: normalizedLogoUrl });
                        if (normalizedLogoUrl) {
                            localStorage.setItem('company_logo_url', normalizedLogoUrl);
                        }
                        if (res.data.data.name) {
                            localStorage.setItem('company_name', res.data.data.name);
                        }
                        window.dispatchEvent(new Event('company-logo-updated'));
                    }
                    break;
                }
                case 'branches': {
                    const res = await branchesAPI.list();
                    const branches = res.data?.data?.branches || res.data?.data || [];
                    setBranches(branches);
                    break;
                }
                case 'inventory': {
                    const [settingsRes, warehousesRes] = await Promise.all([
                        inventorySettingsAPI.get(),
                        warehouseAPI.getWarehouses()
                    ]);
                    if (settingsRes.data?.data) setInventory(settingsRes.data.data);
                    const list = Array.isArray(warehousesRes)
                        ? warehousesRes
                        : (warehousesRes?.data || []);
                    setWarehouses(list);
                    break;
                }
                case 'sales': {
                    const res = await salesSettingsAPI.get();
                    if (res.data?.data) {
                        setSales(res.data.data);
                        if (res.data.data.currency) {
                            localStorage.setItem('currency_code', res.data.data.currency);
                        }
                        if (res.data.data.currency_symbol) {
                            localStorage.setItem('currency_symbol', res.data.data.currency_symbol);
                        }
                        window.dispatchEvent(new Event('currency-updated'));
                    }
                    break;
                }
                case 'taxes': {
                    const res = await taxesAPI.list();
                    const taxes = res.data?.data?.taxes || res.data?.data || [];
                    setTaxes(taxes);
                    break;
                }
                case 'payment_methods': {
                    const res = await paymentMethodsAPI.list();
                    const methods = res.data?.data?.payment_methods || res.data?.data || [];
                    setPaymentMethods(methods);
                    break;
                }
                case 'banks': {
                    const res = await bankAccountsAPI.list();
                    const accounts = res.data?.data?.bank_accounts || res.data?.data || [];
                    setBankAccounts(accounts);
                    break;
                }
                case 'sequences': {
                    const res = await sequencesAPI.list();
                    const sequences = res.data?.data?.sequences || res.data?.data || [];
                    setSequences(sequences);
                    break;
                }
                case 'approvals': {
                    const [res, rolesRes] = await Promise.all([
                        approvalsAPI.get(),
                        userAPI.getRoles()
                    ]);
                    if (res.data?.data) {
                        setApprovals((prev) => ({
                            ...prev,
                            ...res.data.data,
                            workflow: normalizeWorkflow(res.data.data.workflow),
                        }));
                    }
                    const roles = rolesRes?.data || rolesRes || [];
                    setApprovalRoles(roles);
                    break;
                }
                case 'payroll': {
                    const res = await payrollSettingsAPI.get();
                    if (res.data?.data) setPayroll(res.data.data);
                    break;
                }
                case 'fiscal': {
                    const res = await fiscalYearAPI.get();
                    if (res.data?.data) setFiscal(res.data.data);
                    break;
                }
                case 'notifications': {
                    const res = await notificationSettingsAPI.get();
                    if (res.data?.data) setNotifications(res.data.data);
                    break;
                }
                case 'sms': {
                    const res = await smsSettingsAPI.get();
                    if (res.data?.data) setSms(res.data.data);
                    break;
                }
                case 'email': {
                    const res = await emailSettingsAPI.get();
                    if (res.data?.data) setEmail(res.data.data);
                    break;
                }
                case 'print': {
                    const res = await printSettingsAPI.get();
                    if (res.data?.data) setPrint(res.data.data);
                    break;
                }
                case 'templates': {
                    const res = await templatesAPI.get();
                    const templates = res.data?.data || res.data || [];
                    setTemplates(templates);
                    break;
                }
                case 'roles': {
                    const [rolesRes, permissionsRes] = await Promise.all([
                        userAPI.getRoles(),
                        userAPI.getPermissions()
                    ]);
                    const roles = rolesRes?.data || rolesRes || [];
                    const perms = permissionsRes?.data || permissionsRes || {};
                    setRoles(roles);
                    setPermissions(perms);
                    setPermissionGroupsOpen((prev) => {
                        const next = { ...prev };
                        Object.keys(perms).forEach((key) => {
                            if (typeof next[key] === 'undefined') next[key] = true;
                        });
                        return next;
                    });
                    break;
                }
                case 'credit': {
                    const [settingsRes, typesRes] = await Promise.all([
                        creditSettingsAPI.get(),
                        creditFacilityTypesAPI.getAll()
                    ]);
                    if (settingsRes.data?.data) {
                        setCreditSettings(settingsRes.data.data);
                    }
                    setCreditFacilities(typesRes.data?.data || []);
                    break;
                }
                case 'backup': {
                    const [settingsRes, historyRes] = await Promise.all([
                        backupAPI.getSettings(),
                        backupAPI.getHistory()
                    ]);
                    if (settingsRes.data?.data) setBackup(settingsRes.data.data);
                    const backups = historyRes.data?.data || historyRes.data || [];
                    setBackupHistory(backups);
                    break;
                }
                case 'api': {
                    const res = await apiSettingsAPI.get();
                    if (res.data?.data) setApiSettings(res.data.data);
                    break;
                }
            }
        } catch (error) {
            console.error(`Failed to fetch ${section} data:`, error);
            // Don't show error for initial load - data may not exist yet
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch data when section changes
    useEffect(() => {
        fetchSectionData(activeSection);
    }, [activeSection, fetchSectionData]);

    // Save handlers for each section
    const handleSave = async (section) => {
        setSaving(true);
        try {
            switch (section) {
                case 'Company Profile':
                    await companyAPI.update(company);
                    break;
                case 'Inventory':
                    await inventorySettingsAPI.update(inventory);
                    break;
                case 'Sales & Billing':
                    await salesSettingsAPI.update(sales);
                    if (sales.currency) {
                        localStorage.setItem('currency_code', sales.currency);
                    }
                    if (sales.currency_symbol) {
                        localStorage.setItem('currency_symbol', sales.currency_symbol);
                    }
                    window.dispatchEvent(new Event('currency-updated'));
                    break;
                case 'Approval Workflows':
                    await approvalsAPI.update(approvals);
                    break;
                case 'Payroll & HR':
                    await payrollSettingsAPI.update(payroll);
                    break;
                case 'Fiscal Year':
                    await fiscalYearAPI.update(fiscal);
                    break;
                case 'Notifications':
                    await notificationSettingsAPI.update(notifications);
                    break;
                case 'SMS / WhatsApp':
                    await smsSettingsAPI.update(sms);
                    break;
                case 'Email':
                    await emailSettingsAPI.update(email);
                    break;
                case 'Print & Receipts':
                    await printSettingsAPI.update(print);
                    break;
                case 'Doc Templates':
                    await templatesAPI.update(templates);
                    break;
                case 'Backup':
                    await backupAPI.updateSettings(backup);
                    break;
                case 'API & Integrations':
                    await apiSettingsAPI.update(apiSettings);
                    break;
                default:
                    break;
            }
            toast.success(`${section} settings saved successfully`);
        } catch (error) {
            console.error(`Failed to save ${section}:`, error);
            toast.error(`Failed to save ${section} settings`);
        } finally {
            setSaving(false);
        }
    };

    const normalizeLogoUrl = (value) => {
        if (!value) return '';
        if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/storage/')) {
            return value;
        }
        return `/storage/${value.replace(/^\/+/, '')}`;
    };

    const handleLogoUpload = async (file) => {
        if (!file) return;
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('logo', file);
            const res = await companyAPI.uploadLogo(formData);
            const logoUrl = normalizeLogoUrl(res.data?.data?.logo_url);
            if (logoUrl) {
                setCompany((prev) => ({ ...prev, logo_url: logoUrl }));
                localStorage.setItem('company_logo_url', logoUrl);
                window.dispatchEvent(new Event('company-logo-updated'));
            }
            toast.success('Logo uploaded successfully');
        } catch (error) {
            console.error('Failed to upload logo:', error);
            toast.error('Failed to upload logo');
        } finally {
            setSaving(false);
            if (logoInputRef.current) {
                logoInputRef.current.value = '';
            }
        }
    };

    const normalizeWorkflow = (workflow) => {
        const fallback = {
            sales_order: [
                { min: 0, max: 100000, role: 'Manager' },
                { min: 100001, max: 500000, role: 'Finance' },
                { min: 500001, max: null, role: 'Admin' },
            ],
            purchase_order: [
                { min: 0, max: 100000, role: 'Manager' },
                { min: 100001, max: 500000, role: 'Finance' },
                { min: 500001, max: null, role: 'Admin' },
            ],
            expense: [
                { min: 0, max: 50000, role: 'Manager' },
                { min: 50001, max: 200000, role: 'Finance' },
                { min: 200001, max: null, role: 'Admin' },
            ],
        };
        if (!workflow || typeof workflow !== 'object') return fallback;
        return {
            sales_order: Array.isArray(workflow.sales_order) ? workflow.sales_order : fallback.sales_order,
            purchase_order: Array.isArray(workflow.purchase_order) ? workflow.purchase_order : fallback.purchase_order,
            expense: Array.isArray(workflow.expense) ? workflow.expense : fallback.expense,
        };
    };

    const updateWorkflow = (moduleKey, idx, field, value) => {
        setApprovals((prev) => {
            const current = normalizeWorkflow(prev.workflow);
            const list = [...current[moduleKey]];
            list[idx] = { ...list[idx], [field]: value };
            return { ...prev, workflow: { ...current, [moduleKey]: list } };
        });
    };

    const addWorkflowBand = (moduleKey) => {
        setApprovals((prev) => {
            const current = normalizeWorkflow(prev.workflow);
            const list = [...current[moduleKey]];
            const last = list[list.length - 1] || { max: null };
            const min = typeof last.max === 'number' ? last.max + 1 : 0;
            list.push({ min, max: null, role: approvalRoles[0]?.name || 'Manager' });
            return { ...prev, workflow: { ...current, [moduleKey]: list } };
        });
    };

    const removeWorkflowBand = (moduleKey, idx) => {
        setApprovals((prev) => {
            const current = normalizeWorkflow(prev.workflow);
            const list = current[moduleKey].filter((_, i) => i !== idx);
            return { ...prev, workflow: { ...current, [moduleKey]: list } };
        });
    };

    const moveWorkflowBand = (moduleKey, idx, direction) => {
        setApprovals((prev) => {
            const current = normalizeWorkflow(prev.workflow);
            const list = [...current[moduleKey]];
            const newIdx = idx + direction;
            if (newIdx < 0 || newIdx >= list.length) return prev;
            const temp = list[idx];
            list[idx] = list[newIdx];
            list[newIdx] = temp;
            return { ...prev, workflow: { ...current, [moduleKey]: list } };
        });
    };

    const handleSaveTemplate = () => {
        if (!templateForm.name.trim()) {
            toast.error('Template name is required');
            return;
        }
        const normalizedName = templateForm.name.trim().toLowerCase();
        const duplicate = templates.some((t) => {
            if (editingTemplateId && t.id === editingTemplateId) return false;
            return (t.name || '').trim().toLowerCase() === normalizedName;
        });
        if (duplicate) {
            toast.error('Template name must be unique');
            return;
        }
        const fields = templateForm.fields
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean);
        setTemplates((prev) => {
            if (editingTemplateId) {
                return prev.map((t) => t.id === editingTemplateId
                    ? {
                        ...t,
                        name: templateForm.name.trim(),
                        description: templateForm.description.trim(),
                        fields,
                        last_modified: new Date().toISOString().slice(0, 10),
                    }
                    : t
                );
            }
            return [
                ...prev,
                {
                    id: Date.now(),
                    name: templateForm.name.trim(),
                    description: templateForm.description.trim(),
                    fields,
                    last_modified: new Date().toISOString().slice(0, 10),
                }
            ];
        });
        setTemplateForm({ name: '', description: '', fields: '' });
        setShowAddTemplate(false);
        setEditingTemplateId(null);
    };

    const handleEditTemplate = (t) => {
        setTemplateForm({
            name: t.name || '',
            description: t.description || '',
            fields: (t.fields || []).join(', '),
        });
        setShowAddTemplate(true);
        setEditingTemplateId(t.id);
    };

    const handleDeleteTemplate = (t) => {
        setTemplates((prev) => prev.filter((x) => x.id !== t.id));
    };

    const handlePreviewTemplatePdf = async (t) => {
        try {
            setPreviewLoading(true);
            toast.info(`Generating ${t.name} preview...`);
            await openPdfInNewTab(documentAPI.previewTemplate(t.name), `${t.name}-Preview.pdf`);
        } catch (error) {
            console.error('Error generating template preview:', error);
            toast.error('Failed to generate template preview');
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSaveRole = async () => {
        if (!roleForm.name.trim()) {
            toast.error('Role name is required');
            return;
        }
        setSaving(true);
        try {
            if (editingRole) {
                await userAPI.updateRole(editingRole.id, {
                    name: roleForm.name.trim(),
                    permissions: roleForm.permissions,
                });
                setRoles((prev) => prev.map((r) => r.id === editingRole.id
                    ? { ...r, name: roleForm.name.trim(), permissions: roleForm.permissions }
                    : r
                ));
                toast.success('Role updated');
            } else {
                const res = await userAPI.createRole({
                    name: roleForm.name.trim(),
                    permissions: roleForm.permissions,
                });
                const role = res?.data || res;
                if (role) setRoles((prev) => [...prev, role]);
                toast.success('Role created');
            }
            setShowAddRole(false);
            setEditingRole(null);
            setRoleForm({ name: '', permissions: [] });
        } catch (error) {
            console.error('Failed to save role:', error);
            const message =
                error.response?.data?.message ||
                error.response?.data?.errors?.name?.[0] ||
                error.response?.data?.errors?.permissions?.[0] ||
                'Failed to save role';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleEditRole = (role) => {
        setEditingRole(role);
        setRoleForm({
            name: role.name || '',
            permissions: role.permissions || [],
        });
        setShowAddRole(true);
    };

    const handleDeleteRole = async (role) => {
        setSaving(true);
        try {
            await userAPI.deleteRole(role.id);
            setRoles((prev) => prev.filter((r) => r.id !== role.id));
            toast.success('Role deleted');
        } catch (error) {
            console.error('Failed to delete role:', error);
            toast.error(error.response?.data?.message || 'Failed to delete role');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateBackup = async () => {
        setSaving(true);
        try {
            await backupAPI.create('manual');
            toast.success('Backup started');
            const historyRes = await backupAPI.getHistory();
            const backups = historyRes.data?.data || historyRes.data || [];
            setBackupHistory(backups);
        } catch (error) {
            console.error('Failed to create backup:', error);
            toast.error('Failed to start backup');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadBackup = async (filename) => {
        try {
            const res = await backupAPI.download(filename);
            const blob = new Blob([res.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download backup:', error);
            toast.error('Failed to download backup');
        }
    };

    const handleDeleteBackup = async (filename) => {
        try {
            await backupAPI.delete(filename);
            setBackupHistory((prev) => prev.filter((b) => b.filename !== filename));
            toast.success('Backup deleted');
        } catch (error) {
            console.error('Failed to delete backup:', error);
            toast.error('Failed to delete backup');
        }
    };

    const handleExportData = async (type, format) => {
        setSaving(true);
        try {
            const res = await backupAPI.export(type, format);
            const blob = new Blob([res.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `export_${type}_${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : 'csv'}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`${type} data exported successfully`);
        } catch (error) {
            console.error('Failed to export data:', error);
            toast.error('Failed to export data');
        } finally {
            setSaving(false);
        }
    };

    const handleRestoreBackup = async () => {
        if (!restoreFile) return;
        
        if (!window.confirm('Are you sure you want to restore this backup? This will OVERWRITE all current data. This action cannot be undone.')) {
            return;
        }

        setSaving(true);
        try {
            await backupAPI.restore(restoreFile);
            toast.success('Backup restored successfully. Please log in again.');
            // Clear auth and redirect to login
            localStorage.clear();
            window.location.href = '/login';
        } catch (error) {
            console.error('Failed to restore backup:', error);
            toast.error(error.response?.data?.message || 'Failed to restore backup');
        } finally {
            setSaving(false);
            setRestoreFile(null);
        }
    };

    const handleRotateApiKey = async () => {
        setSaving(true);
        try {
            const res = await apiSettingsAPI.rotateKey();
            const key = res.data?.data?.api_key || '';
            setApiSettings((prev) => ({ ...prev, api_key: key }));
            toast.success('API key rotated');
        } catch (error) {
            console.error('Failed to rotate API key:', error);
            toast.error('Failed to rotate API key');
        } finally {
            setSaving(false);
        }
    };

    const handleCopyApiKey = async () => {
        if (!apiSettings.api_key) return;
        try {
            await navigator.clipboard.writeText(apiSettings.api_key);
            toast.success('API key copied');
        } catch {
            toast.error('Failed to copy API key');
        }
    };

    const apiDocs = [
        {
            title: 'Auth',
            endpoints: [
                { method: 'POST', path: '/login', description: 'Login and retrieve token' },
                { method: 'POST', path: '/logout', description: 'Invalidate token' },
                { method: 'GET', path: '/me', description: 'Current authenticated user' },
            ],
        },
        {
            title: 'Core',
            endpoints: [
                { method: 'GET', path: '/branches', description: 'List branches' },
                { method: 'GET', path: '/products', description: 'List products' },
                { method: 'GET', path: '/categories', description: 'List categories' },
                { method: 'GET', path: '/warehouses', description: 'List warehouses' },
                { method: 'GET', path: '/inventory', description: 'Inventory summary' },
                { method: 'GET', path: '/customers', description: 'List customers' },
                { method: 'GET', path: '/suppliers', description: 'List suppliers' },
                { method: 'GET', path: '/sales-orders', description: 'List sales orders' },
                { method: 'GET', path: '/purchase-orders', description: 'List purchase orders' },
                { method: 'GET', path: '/payments', description: 'List payments' },
                { method: 'GET', path: '/expenses', description: 'List expenses' },
                { method: 'GET', path: '/production', description: 'List production runs' },
                { method: 'GET', path: '/audit-logs', description: 'Audit trail' },
                { method: 'GET', path: '/staff', description: 'List staff' },
                { method: 'GET', path: '/payroll', description: 'Payroll runs' },
            ],
        },
        {
            title: 'Settings',
            endpoints: [
                { method: 'GET', path: '/settings/company', description: 'Company profile' },
                { method: 'PUT', path: '/settings/company', description: 'Update company profile' },
                { method: 'GET', path: '/settings/branches', description: 'List branches (settings)' },
                { method: 'GET', path: '/settings/inventory', description: 'Inventory settings' },
                { method: 'PUT', path: '/settings/inventory', description: 'Update inventory settings' },
                { method: 'GET', path: '/settings/sales', description: 'Sales settings' },
                { method: 'PUT', path: '/settings/sales', description: 'Update sales settings' },
                { method: 'GET', path: '/settings/approvals', description: 'Approval workflows' },
                { method: 'PUT', path: '/settings/approvals', description: 'Update approval workflows' },
                { method: 'GET', path: '/settings/backup', description: 'Backup settings' },
                { method: 'PUT', path: '/settings/backup', description: 'Update backup settings' },
            ],
        },
        {
            title: 'Credit & Analytics',
            endpoints: [
                { method: 'GET', path: '/credit-analytics/summary', description: 'Credit analytics summary' },
                { method: 'GET', path: '/customers/{id}/credit-summary', description: 'Customer credit summary' },
            ],
        },
    ];

    const filteredApiDocs = apiDocs
        .map((group) => ({
            ...group,
            endpoints: group.endpoints.filter((e) => {
                const q = apiDocsSearch.trim().toLowerCase();
                if (!q) return true;
                return (
                    e.path.toLowerCase().includes(q) ||
                    e.method.toLowerCase().includes(q) ||
                    e.description.toLowerCase().includes(q)
                );
            }),
        }))
        .filter((group) => group.endpoints.length > 0);

    const generateApiMarkdown = () => {
        const baseUrl = `${window.location.origin}/api/v1`;
        let md = `# FactoryPulse API\\n\\n`;
        md += `Base URL: ${baseUrl}\\n\\n`;
        md += `Auth: Bearer token or API key (Authorization: Bearer <token> or X-API-KEY)\\n\\n`;
        filteredApiDocs.forEach((group) => {
            md += `## ${group.title}\\n\\n`;
            group.endpoints.forEach((e) => {
                md += `- **${e.method}** \`${e.path}\` — ${e.description}\\n`;
            });
            md += `\\n`;
        });
        md += `\\n### Example\\n\\n`;
        md += '```bash\\n';
        md += `curl -H \"Authorization: Bearer YOUR_TOKEN\" \\\\\\n${baseUrl}/products\\n`;
        md += '```\\n';
        return md;
    };

    const handleDownloadApiMarkdown = () => {
        const md = generateApiMarkdown();
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'factorypulse-api-docs.md';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleDownloadApiPdf = () => {
        const md = generateApiMarkdown();
        const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>FactoryPulse API Docs</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
    h1, h2, h3 { margin: 16px 0 8px; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    pre { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 8px; }
    ul { padding-left: 18px; }
  </style>
</head>
<body>
${md
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^\\- \\*\\*(.*)\\*\\* \\`(.*)\\` — (.*)$/gm, '<li><strong>$1</strong> <code>$2</code> — $3</li>')
    .replace(/\\n\\n/g, '<br/><br/>')
    .replace(/```bash([\\s\\S]*?)```/g, '<pre>$1</pre>')
    .replace(/<br\/><br\/><li/g, '<ul><li')
    .replace(/<\/li><br\/><br\/>/g, '</li></ul>')}
</body>
</html>`;
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
    };

    const inputClass = 'w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm';
    const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

    const renderSection = () => {
        switch (activeSection) {
            case 'branches':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Branches & Locations</h3>
                                <p className="text-sm text-slate-500 mt-1">Manage business locations, offices, and warehouses</p>
                            </div>
                            <Button onClick={() => { setBranchForm({ name: '', code: '', address: '', phone: '' }); setShowAddBranch(true); }}>+ Add Branch</Button>
                        </div>

                        {showAddBranch && (
                            <Card><CardBody className="p-4 space-y-4 border-2 border-blue-200">
                                <h4 className="font-semibold text-slate-800">New Branch</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Branch Name *</label>
                                        <input type="text" value={branchForm.name} onChange={(e) => setBranchForm({...branchForm, name: e.target.value})} className={inputClass} placeholder="e.g. Lagos Sales Office" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Code *</label>
                                        <input type="text" value={branchForm.code} onChange={(e) => setBranchForm({...branchForm, code: e.target.value.toUpperCase()})} className={inputClass} placeholder="e.g. LAG" maxLength={5} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Address</label>
                                        <input type="text" value={branchForm.address} onChange={(e) => setBranchForm({...branchForm, address: e.target.value})} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phone</label>
                                        <input type="text" value={branchForm.phone} onChange={(e) => setBranchForm({...branchForm, phone: e.target.value})} className={inputClass} />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={handleCreateBranch} disabled={saving}>{saving ? 'Creating...' : 'Create Branch'}</Button>
                                    <Button variant="outline" onClick={() => setShowAddBranch(false)}>Cancel</Button>
                                </div>
                            </CardBody></Card>
                        )}

                        <div className="space-y-3">
                            {branches.map(b => (
                                <Card key={b.id}><CardBody className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg ${b.is_main_branch ? 'bg-blue-100' : 'bg-slate-100'} flex items-center justify-center`}>
                                                <span className="text-sm font-bold text-slate-600">{b.branch_code || b.code}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-900">{b.name}</span>
                                                    {b.is_main_branch && <Badge variant="approved">Default</Badge>}
                                                    {!b.is_active && <Badge variant="draft">Inactive</Badge>}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">{b.address} &middot; {b.phone}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {!b.is_main_branch && <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => { setBranches(prev => prev.map(x => ({...x, is_main_branch: x.id === b.id}))); toast.success('Default branch updated'); }}>Set Default</button>}
                                            <button className="text-sm text-slate-500 hover:text-slate-700" onClick={() => handleToggleBranchActive(b)}>{b.is_active ? 'Deactivate' : 'Activate'}</button>
                                        </div>
                                    </div>
                                </CardBody></Card>
                            ))}
                        </div>
                    </div>
                );

            case 'company':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Company Profile</h3>
                            <p className="text-sm text-slate-500 mt-1">Business identity, registration, and contact details</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Company Name *</label>
                                <input type="text" value={company.name} onChange={(e) => setCompany({...company, name: e.target.value})} className={inputClass} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Address *</label>
                                <input type="text" value={company.address} onChange={(e) => setCompany({...company, address: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Phone *</label>
                                <input type="text" value={company.phone} onChange={(e) => setCompany({...company, phone: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Email *</label>
                                <input type="email" value={company.email} onChange={(e) => setCompany({...company, email: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>RC Number</label>
                                <input type="text" value={company.rc_number} onChange={(e) => setCompany({...company, rc_number: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Tax ID (TIN)</label>
                                <input type="text" value={company.tin} onChange={(e) => setCompany({...company, tin: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Website</label>
                                <input type="text" value={company.website} onChange={(e) => setCompany({...company, website: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Company Logo</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 overflow-hidden">
                                        {company.logo_url ? (
                                            <img src={company.logo_url} alt="Company logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        )}
                                    </div>
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => logoInputRef.current?.click()}
                                    >
                                        Upload Logo
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('Company Profile')}>Update Profile</Button>
                        </div>

                        {/* Onboarding & Tour Section */}
                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="text-base font-semibold text-slate-900">Guided Tour</h4>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Take a guided tour of FactoryPulse to learn about all the features and how to use them effectively.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {tourComplete && (
                                        <Badge variant="success">Completed</Badge>
                                    )}
                                    <Button variant="outline" onClick={handleStartTour}>
                                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {tourComplete ? 'Restart Tour' : 'Start Tour'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'inventory':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Inventory Settings</h3>
                            <p className="text-sm text-slate-500 mt-1">Stock management, warehouses, SKU generation, and tracking</p>
                        </div>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Warehouses</h4>
                            <div>
                                <label className={labelClass}>Default Warehouse</label>
                                <select value={inventory.default_warehouse} onChange={(e) => setInventory({...inventory, default_warehouse: e.target.value})} className={inputClass}>
                                    <option value="">Select default...</option>
                                    {warehouses.map((w) => (
                                        <option key={w.id} value={w.name}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Manage Warehouses</label>
                                {warehouses.map((w) => (
                                    <div key={w.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <span className="font-medium text-slate-900">{w.name}</span>
                                            <span className="text-xs text-slate-500 ml-2">{inventory.default_warehouse === w.name ? 'Default' : ''}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="text-sm text-red-600 hover:text-red-800" onClick={() => handleDeleteWarehouse(w)}>Remove</button>
                                        </div>
                                    </div>
                                ))}
                                {!showAddWarehouse && (
                                    <Button variant="outline" size="sm" onClick={() => setShowAddWarehouse(true)}>+ Add Warehouse</Button>
                                )}
                            </div>
                            {showAddWarehouse && (
                                <div className="p-4 border border-blue-200 rounded-lg space-y-3 bg-blue-50/50">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Name *</label>
                                            <input
                                                type="text"
                                                value={warehouseForm.name}
                                                onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                                                className={inputClass}
                                                placeholder="e.g. Main Warehouse"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Code *</label>
                                            <input
                                                type="text"
                                                value={warehouseForm.code}
                                                onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value.toUpperCase() })}
                                                className={inputClass}
                                                placeholder="e.g. MAIN"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Location</label>
                                            <input
                                                type="text"
                                                value={warehouseForm.location}
                                                onChange={(e) => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Phone</label>
                                            <input
                                                type="text"
                                                value={warehouseForm.phone}
                                                onChange={(e) => setWarehouseForm({ ...warehouseForm, phone: e.target.value })}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className={labelClass}>Address</label>
                                            <input
                                                type="text"
                                                value={warehouseForm.address}
                                                onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={handleSaveWarehouse}>Save Warehouse</Button>
                                        <Button size="sm" variant="ghost" onClick={() => { setShowAddWarehouse(false); setWarehouseForm({ name: '', code: '', location: '', address: '', phone: '' }); }}>Cancel</Button>
                                    </div>
                                </div>
                            )}
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">SKU Generation</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Raw Material Prefix</label>
                                    <input type="text" value={inventory.sku_prefix_raw} onChange={(e) => setInventory({...inventory, sku_prefix_raw: e.target.value.toUpperCase()})} className={inputClass} maxLength={5} />
                                    <p className="text-xs text-slate-400 mt-1">Preview: {inventory.sku_prefix_raw}-001</p>
                                </div>
                                <div>
                                    <label className={labelClass}>Finished Good Prefix</label>
                                    <input type="text" value={inventory.sku_prefix_finished} onChange={(e) => setInventory({...inventory, sku_prefix_finished: e.target.value.toUpperCase()})} className={inputClass} maxLength={5} />
                                    <p className="text-xs text-slate-400 mt-1">Preview: {inventory.sku_prefix_finished}-001</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="auto_sku" checked={inventory.auto_generate_sku} onChange={(e) => setInventory({...inventory, auto_generate_sku: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                <label htmlFor="auto_sku" className="text-sm text-slate-700">Auto-generate SKU for new products</label>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Tracking & Thresholds</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="batch_track" checked={inventory.enable_batch_tracking} onChange={(e) => setInventory({...inventory, enable_batch_tracking: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                    <label htmlFor="batch_track" className="text-sm text-slate-700">Enable batch/lot tracking</label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="expiry_track" checked={inventory.enable_expiry_tracking} onChange={(e) => setInventory({...inventory, enable_expiry_tracking: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                    <label htmlFor="expiry_track" className="text-sm text-slate-700">Enable expiry date tracking</label>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>Low Stock Threshold (%)</label>
                                    <input type="number" min="1" max="100" value={inventory.low_stock_threshold} onChange={(e) => setInventory({...inventory, low_stock_threshold: parseInt(e.target.value)})} className={inputClass} />
                                    <p className="text-xs text-slate-400 mt-1">Alert when stock falls below this % of reorder level</p>
                                </div>
                                <div>
                                    <label className={labelClass}>Critical Stock Threshold (%)</label>
                                    <input type="number" min="1" max="100" value={inventory.critical_stock_threshold} onChange={(e) => setInventory({...inventory, critical_stock_threshold: parseInt(e.target.value)})} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Drying Loss Tolerance (%)</label>
                                    <input type="number" min="0" max="20" step="0.5" value={inventory.drying_loss_tolerance} onChange={(e) => setInventory({...inventory, drying_loss_tolerance: parseFloat(e.target.value)})} className={inputClass} />
                                    <p className="text-xs text-slate-400 mt-1">Acceptable drying loss before flagging</p>
                                </div>
                            </div>
                        </CardBody></Card>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('Inventory')}>Save Changes</Button>
                        </div>
                    </div>
                );

            case 'sales':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Sales & Billing</h3>
                            <p className="text-sm text-slate-500 mt-1">Invoice settings, currency, credit rules, and payment terms</p>
                        </div>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Currency</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Currency</label>
                                    <select value={sales.currency} onChange={(e) => setSales({...sales, currency: e.target.value})} className={inputClass}>
                                        <option value="NGN">Nigerian Naira (NGN)</option>
                                        <option value="USD">US Dollar (USD)</option>
                                        <option value="GBP">British Pound (GBP)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Currency Symbol</label>
                                    <input type="text" value={sales.currency_symbol} onChange={(e) => setSales({...sales, currency_symbol: e.target.value})} className={inputClass} maxLength={3} />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">To manage taxes (VAT, WHT, etc.), go to <strong>Taxes & Charges</strong> in the sidebar.</p>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Invoice & Receipt Numbering</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Invoice Prefix</label>
                                    <input type="text" value={sales.invoice_prefix} onChange={(e) => setSales({...sales, invoice_prefix: e.target.value.toUpperCase()})} className={inputClass} maxLength={5} />
                                    <p className="text-xs text-slate-400 mt-1">Next: {sales.invoice_prefix}-{String(sales.invoice_next_number).padStart(4, '0')}</p>
                                </div>
                                <div>
                                    <label className={labelClass}>Next Invoice Number</label>
                                    <input type="number" min="1" value={sales.invoice_next_number} onChange={(e) => setSales({...sales, invoice_next_number: parseInt(e.target.value)})} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Receipt Prefix</label>
                                    <input type="text" value={sales.receipt_prefix} onChange={(e) => setSales({...sales, receipt_prefix: e.target.value.toUpperCase()})} className={inputClass} maxLength={5} />
                                </div>
                                <div>
                                    <label className={labelClass}>Default Payment Terms (days)</label>
                                    <input type="number" min="0" value={sales.default_payment_terms} onChange={(e) => setSales({...sales, default_payment_terms: parseInt(e.target.value)})} className={inputClass} />
                                </div>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Credit & Payment Rules</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="credit_enforce" checked={sales.credit_enforcement} onChange={(e) => setSales({...sales, credit_enforcement: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                    <div>
                                        <label htmlFor="credit_enforce" className="text-sm font-medium text-slate-700">Enforce credit limits</label>
                                        <p className="text-xs text-slate-400">Block orders when customer exceeds their credit limit</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="partial_pay" checked={sales.allow_partial_payments} onChange={(e) => setSales({...sales, allow_partial_payments: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                    <div>
                                        <label htmlFor="partial_pay" className="text-sm font-medium text-slate-700">Allow partial payments</label>
                                        <p className="text-xs text-slate-400">Accept payments less than the full invoice amount</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Global Maximum Credit Limit</label>
                                <input type="number" min="0" value={sales.global_credit_limit} onChange={(e) => setSales({...sales, global_credit_limit: parseInt(e.target.value)})} className={inputClass} />
                                <p className="text-xs text-slate-400 mt-1">No customer can have a credit limit above {fmt(sales.global_credit_limit)}</p>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Invoice Footer</h4>
                            <textarea value={sales.invoice_footer} onChange={(e) => setSales({...sales, invoice_footer: e.target.value})} rows={3} className={inputClass} placeholder="Text to appear at the bottom of invoices..." />
                        </CardBody></Card>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('Sales & Billing')}>Save Changes</Button>
                        </div>
                    </div>
                );

            case 'taxes':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Taxes & Statutory Charges</h3>
                                <p className="text-sm text-slate-500 mt-1">Manage all taxes, levies, and statutory charges applied to transactions</p>
                            </div>
                            <Button onClick={() => { setEditingTax(null); setTaxForm({ name: '', code: '', rate: '', type: 'percentage', applies_to: 'sales', is_compound: false }); setShowAddTax(true); }}>+ Add Tax/Charge</Button>
                        </div>

                        {showAddTax && (
                            <Card><CardBody className="p-4 space-y-4 border-2 border-blue-200">
                                <h4 className="font-semibold text-slate-800">{editingTax ? 'Edit' : 'New'} Tax / Charge</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Name *</label>
                                        <input type="text" value={taxForm.name} onChange={(e) => setTaxForm({...taxForm, name: e.target.value})} className={inputClass} placeholder="e.g. VAT, WHT, Import Duty" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Code *</label>
                                        <input type="text" value={taxForm.code} onChange={(e) => setTaxForm({...taxForm, code: e.target.value.toUpperCase()})} className={inputClass} placeholder="e.g. VAT, WHT" maxLength={10} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Rate *</label>
                                        <div className="flex gap-2">
                                            <input type="number" min="0" step="0.01" value={taxForm.rate} onChange={(e) => setTaxForm({...taxForm, rate: e.target.value})} className={`${inputClass} flex-1`} placeholder="e.g. 7.5" />
                                            <select value={taxForm.type} onChange={(e) => setTaxForm({...taxForm, type: e.target.value})} className={`${inputClass} w-36`}>
                                                <option value="percentage">% (Percent)</option>
                                                <option value="fixed">{getCurrencySymbol()} (Fixed)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Applies To</label>
                                        <select value={taxForm.applies_to} onChange={(e) => setTaxForm({...taxForm, applies_to: e.target.value})} className={inputClass}>
                                            <option value="sales">Sales only</option>
                                            <option value="purchases">Purchases only</option>
                                            <option value="both">Sales & Purchases</option>
                                            <option value="payroll">Payroll</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="is_compound" checked={taxForm.is_compound} onChange={(e) => setTaxForm({...taxForm, is_compound: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                    <div>
                                        <label htmlFor="is_compound" className="text-sm font-medium text-slate-700">Compound tax</label>
                                        <p className="text-xs text-slate-400">Calculate on top of other taxes (e.g. tax on tax)</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button onClick={handleSaveTax}>{editingTax ? 'Update' : 'Create'}</Button>
                                    <Button variant="outline" onClick={() => { setShowAddTax(false); setEditingTax(null); }}>Cancel</Button>
                                </div>
                            </CardBody></Card>
                        )}

                        {/* Active Taxes */}
                        <div>
                            <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Active ({taxes.filter(t => t.is_active).length})</h4>
                            <div className="space-y-2">
                                {taxes.filter(t => t.is_active).map(t => (
                                    <Card key={t.id}><CardBody className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-green-700">{t.type === 'percentage' ? '%' : getCurrencySymbol()}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-900">{t.name}</span>
                                                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t.code}</span>
                                                        {t.is_compound && <Badge variant="draft">Compound</Badge>}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        {t.type === 'percentage' ? `${t.rate}%` : fmt(t.rate)} &middot; {t.applies_to === 'both' ? 'Sales & Purchases' : t.applies_to === 'sales' ? 'Sales' : t.applies_to === 'purchases' ? 'Purchases' : 'Payroll'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => handleEditTax(t)}>Edit</button>
                                                <button className="text-sm text-amber-600 hover:text-amber-800" onClick={() => handleToggleTaxActive(t)}>Deactivate</button>
                                            </div>
                                        </div>
                                    </CardBody></Card>
                                ))}
                            </div>
                        </div>

                        {/* Inactive Taxes */}
                        {taxes.some(t => !t.is_active) && (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Inactive ({taxes.filter(t => !t.is_active).length})</h4>
                                <div className="space-y-2">
                                    {taxes.filter(t => !t.is_active).map(t => (
                                        <Card key={t.id}><CardBody className="p-4 opacity-60">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                                        <span className="text-sm font-bold text-slate-400">{t.type === 'percentage' ? '%' : getCurrencySymbol()}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-700">{t.name}</span>
                                                            <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{t.code}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-400 mt-1">
                                                            {t.type === 'percentage' ? `${t.rate}%` : fmt(t.rate)} &middot; {t.applies_to === 'both' ? 'Sales & Purchases' : t.applies_to === 'sales' ? 'Sales' : t.applies_to === 'purchases' ? 'Purchases' : 'Payroll'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => handleEditTax(t)}>Edit</button>
                                                    <button className="text-sm text-green-600 hover:text-green-800" onClick={() => handleToggleTaxActive(t)}>Activate</button>
                                                    <button className="text-sm text-red-600 hover:text-red-800" onClick={() => handleDeleteTax(t)}>Delete</button>
                                                </div>
                                            </div>
                                        </CardBody></Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-amber-50 p-4 rounded-lg text-sm text-amber-800">
                            <strong>Note:</strong> Only active taxes/charges will appear in Sales Orders, Purchase Orders, and Invoices. Deactivating a tax does not affect existing transactions.
                        </div>
                    </div>
                );

            case 'payment_methods':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Payment Methods</h3>
                                <p className="text-sm text-slate-500 mt-1">Define accepted payment methods and link them to bank accounts</p>
                            </div>
                            <Button onClick={() => { setPayMethodForm({ name: '', code: '', bank_account: '', requires_reference: false }); setShowAddPayMethod(true); }}>+ Add Method</Button>
                        </div>

                        {showAddPayMethod && (
                            <Card><CardBody className="p-4 space-y-4 border-2 border-blue-200">
                                <h4 className="font-semibold text-slate-800">New Payment Method</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Method Name *</label>
                                        <input type="text" value={payMethodForm.name} onChange={(e) => setPayMethodForm({...payMethodForm, name: e.target.value})} className={inputClass} placeholder="e.g. Mobile Money" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Code *</label>
                                        <input type="text" value={payMethodForm.code} onChange={(e) => setPayMethodForm({...payMethodForm, code: e.target.value.toUpperCase()})} className={inputClass} placeholder="e.g. MOMO" maxLength={10} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Linked Bank Account</label>
                                        <select value={payMethodForm.bank_account} onChange={(e) => setPayMethodForm({...payMethodForm, bank_account: e.target.value})} className={inputClass}>
                                            <option value="">-- None --</option>
                                            {bankAccounts.filter(b => b.is_active).map(b => (
                                                <option key={b.id} value={`${b.bank_name} - ${b.account_number}`}>{b.bank_name} - {b.account_number}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3 pt-6">
                                        <input type="checkbox" checked={payMethodForm.requires_reference} onChange={(e) => setPayMethodForm({...payMethodForm, requires_reference: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                        <label className="text-sm text-slate-700">Requires reference number</label>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={handleCreatePaymentMethod} disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button>
                                    <Button variant="outline" onClick={() => setShowAddPayMethod(false)}>Cancel</Button>
                                </div>
                            </CardBody></Card>
                        )}

                        <div className="space-y-2">
                            {paymentMethods.map(m => (
                                <Card key={m.id}><CardBody className={`p-4 ${!m.is_active ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg ${m.is_active ? 'bg-green-100' : 'bg-slate-100'} flex items-center justify-center`}>
                                                <span className="text-xs font-bold text-slate-600">{m.code}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-900">{m.name}</span>
                                                    {m.requires_reference && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Ref Required</span>}
                                                    {!m.is_active && <Badge variant="draft">Inactive</Badge>}
                                                </div>
                                                {m.bank_account && <div className="text-xs text-slate-500 mt-1">Linked: {m.bank_account}</div>}
                                            </div>
                                        </div>
                                        <button className="text-sm text-slate-500 hover:text-slate-700" onClick={() => handleTogglePaymentMethodActive(m)}>{m.is_active ? 'Deactivate' : 'Activate'}</button>
                                    </div>
                                </CardBody></Card>
                            ))}
                        </div>
                    </div>
                );

            case 'banks':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Banks & Accounts</h3>
                                <p className="text-sm text-slate-500 mt-1">Company bank accounts for payments, reconciliation, and payroll</p>
                            </div>
                            <Button onClick={() => { setBankForm({ bank_name: '', account_name: '', account_number: '', account_type: 'current' }); setShowAddBank(true); }}>+ Add Account</Button>
                        </div>

                        {showAddBank && (
                            <Card><CardBody className="p-4 space-y-4 border-2 border-blue-200">
                                <h4 className="font-semibold text-slate-800">New Bank Account</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Bank Name *</label>
                                        <input type="text" value={bankForm.bank_name} onChange={(e) => setBankForm({...bankForm, bank_name: e.target.value})} className={inputClass} placeholder="e.g. Guaranty Trust Bank" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Account Name *</label>
                                        <input type="text" value={bankForm.account_name} onChange={(e) => setBankForm({...bankForm, account_name: e.target.value})} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Account Number *</label>
                                        <input type="text" value={bankForm.account_number} onChange={(e) => setBankForm({...bankForm, account_number: e.target.value.replace(/\D/g, '')})} className={inputClass} maxLength={10} placeholder="10-digit NUBAN" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Account Type</label>
                                        <select value={bankForm.account_type} onChange={(e) => setBankForm({...bankForm, account_type: e.target.value})} className={inputClass}>
                                            <option value="current">Current</option>
                                            <option value="savings">Savings</option>
                                            <option value="domiciliary">Domiciliary</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={handleCreateBankAccount} disabled={saving}>{saving ? 'Adding...' : 'Add Account'}</Button>
                                    <Button variant="outline" onClick={() => setShowAddBank(false)}>Cancel</Button>
                                </div>
                            </CardBody></Card>
                        )}

                        <div className="space-y-3">
                            {bankAccounts.map(b => (
                                <Card key={b.id}><CardBody className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-lg ${b.is_default ? 'bg-blue-100 border-2 border-blue-300' : 'bg-slate-100'} flex items-center justify-center`}>
                                                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4z" /></svg>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-900">{b.bank_name}</span>
                                                    {b.is_default && <Badge variant="approved">Default</Badge>}
                                                </div>
                                                <div className="text-sm text-slate-600">{b.account_name}</div>
                                                <div className="text-xs text-slate-400 font-mono mt-0.5">{b.account_number} &middot; {b.account_type}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {!b.is_default && <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => handleSetDefaultBankAccount(b)}>Set Default</button>}
                                            <button className="text-sm text-slate-500 hover:text-slate-700" onClick={() => handleTogglePaymentMethodActive(b)}>{b.is_active ? 'Deactivate' : 'Activate'}</button>
                                        </div>
                                    </div>
                                </CardBody></Card>
                            ))}
                        </div>
                    </div>
                );

            case 'sequences':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Number Sequences</h3>
                            <p className="text-sm text-slate-500 mt-1">Control document numbering formats across all modules</p>
                        </div>

                        <div className="space-y-3">
                            {sequences.map(s => (
                                <Card key={s.id}><CardBody className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-semibold text-slate-900">{s.document}</span>
                                            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded ml-2">{s.prefix}{s.separator}{String(s.next_number).padStart(s.padding, '0')}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-slate-500">Prefix:</label>
                                                <input type="text" value={s.prefix} onChange={(e) => setSequences(prev => prev.map(x => x.id === s.id ? {...x, prefix: e.target.value.toUpperCase()} : x))} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm text-center" maxLength={5} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-slate-500">Next #:</label>
                                                <input type="number" min="1" value={s.next_number} onChange={(e) => setSequences(prev => prev.map(x => x.id === s.id ? {...x, next_number: parseInt(e.target.value) || 1} : x))} className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-center" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-slate-500">Pad:</label>
                                                <select value={s.padding} onChange={(e) => setSequences(prev => prev.map(x => x.id === s.id ? {...x, padding: parseInt(e.target.value)} : x))} className="w-14 px-1 py-1 border border-slate-300 rounded text-sm">
                                                    <option value={3}>3</option>
                                                    <option value={4}>4</option>
                                                    <option value={5}>5</option>
                                                    <option value={6}>6</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody></Card>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('Number Sequences')}>Save Changes</Button>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-lg text-sm text-amber-800">
                            <strong>Warning:</strong> Changing a prefix or next number on a live system may cause gaps or duplicates. Only modify if you are certain.
                        </div>
                    </div>
                );

            case 'approvals':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Approval Workflows</h3>
                            <p className="text-sm text-slate-500 mt-1">Multi-step approvals, thresholds, and role separation</p>
                        </div>

                        <Card><CardBody className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-slate-800">Approval Builder</h4>
                                    <p className="text-xs text-slate-500 mt-1">Define amount bands and roles per step</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {['sales_order', 'purchase_order', 'expense'].map((k) => (
                                        <button
                                            key={k}
                                            onClick={() => setApprovalModule(k)}
                                            className={`px-3 py-1.5 text-xs rounded-full border ${
                                                approvalModule === k
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
                                            }`}
                                        >
                                            {k === 'sales_order' ? 'Sales Orders' : k === 'purchase_order' ? 'Purchase Orders' : 'Expenses'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {(normalizeWorkflow(approvals.workflow)[approvalModule] || []).map((step, idx) => (
                                    <div key={`${approvalModule}-${idx}`} className="relative p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="absolute -left-2 top-4 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                                            {idx + 1}
                                        </div>
                                        <div className="grid grid-cols-12 gap-3 items-end pl-4">
                                            <div className="col-span-3">
                                                <label className={labelClass}>Min</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={step.min ?? 0}
                                                    onChange={(e) => updateWorkflow(approvalModule, idx, 'min', parseInt(e.target.value) || 0)}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <label className={labelClass}>Max</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={step.max ?? ''}
                                                    onChange={(e) => updateWorkflow(approvalModule, idx, 'max', e.target.value === '' ? null : parseInt(e.target.value))}
                                                    className={inputClass}
                                                    placeholder="No limit"
                                                />
                                            </div>
                                            <div className="col-span-4">
                                                <label className={labelClass}>Approver Role</label>
                                                <select
                                                    value={step.role || ''}
                                                    onChange={(e) => updateWorkflow(approvalModule, idx, 'role', e.target.value)}
                                                    className={inputClass}
                                                >
                                                    <option value="">Select role...</option>
                                                    {approvalRoles.map((r) => {
                                                        const name = r?.name || r;
                                                        return <option key={name} value={name}>{name}</option>;
                                                    })}
                                                </select>
                                            </div>
                                            <div className="col-span-2 flex items-center gap-2">
                                                <button
                                                    className="text-xs text-slate-500 hover:text-slate-700"
                                                    onClick={() => moveWorkflowBand(approvalModule, idx, -1)}
                                                    disabled={idx === 0}
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    className="text-xs text-slate-500 hover:text-slate-700"
                                                    onClick={() => moveWorkflowBand(approvalModule, idx, 1)}
                                                    disabled={idx === normalizeWorkflow(approvals.workflow)[approvalModule].length - 1}
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    className="text-xs text-red-600 hover:text-red-800"
                                                    onClick={() => removeWorkflowBand(approvalModule, idx)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-2 pl-4">
                                            {fmt(step.min || 0)} – {step.max === null || step.max === '' ? 'No limit' : fmt(step.max)}
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => addWorkflowBand(approvalModule)}>
                                    + Add Band
                                </Button>
                            </div>
                        </CardBody></Card>

                        {/* ── Module Approval Rules ── */}
                        <Card><CardBody className="p-4 space-y-4">
                            <div>
                                <h4 className="font-semibold text-slate-800">Module Approval Rules</h4>
                                <p className="text-xs text-slate-500 mt-1">Enable or disable approval requirements per module and set amount thresholds</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Sales Orders */}
                                <div className={`p-4 rounded-lg border ${approvals.sales_order_require_approval ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            <span className="font-medium text-slate-900 text-sm">Sales Orders</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={approvals.sales_order_require_approval} onChange={(e) => setApprovals({...approvals, sales_order_require_approval: e.target.checked})} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    {approvals.sales_order_require_approval && (
                                        <div>
                                            <label className="text-xs text-slate-500">Threshold Amount</label>
                                            <input type="number" min="0" value={approvals.sales_order_threshold} onChange={(e) => setApprovals({...approvals, sales_order_threshold: parseInt(e.target.value) || 0})} className={inputClass} />
                                            <p className="text-xs text-slate-400 mt-1">Orders above {fmt(approvals.sales_order_threshold)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Purchase Orders */}
                                <div className={`p-4 rounded-lg border ${approvals.purchase_order_require_approval ? 'border-green-200 bg-green-50/50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                                            <span className="font-medium text-slate-900 text-sm">Purchase Orders</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={approvals.purchase_order_require_approval} onChange={(e) => setApprovals({...approvals, purchase_order_require_approval: e.target.checked})} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                    {approvals.purchase_order_require_approval && (
                                        <div>
                                            <label className="text-xs text-slate-500">Threshold Amount</label>
                                            <input type="number" min="0" value={approvals.purchase_order_threshold} onChange={(e) => setApprovals({...approvals, purchase_order_threshold: parseInt(e.target.value) || 0})} className={inputClass} />
                                            <p className="text-xs text-slate-400 mt-1">POs above {fmt(approvals.purchase_order_threshold)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Expenses */}
                                <div className={`p-4 rounded-lg border ${approvals.expense_require_approval ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            <span className="font-medium text-slate-900 text-sm">Expenses</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={approvals.expense_require_approval} onChange={(e) => setApprovals({...approvals, expense_require_approval: e.target.checked})} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                                        </label>
                                    </div>
                                    {approvals.expense_require_approval && (
                                        <div>
                                            <label className="text-xs text-slate-500">Threshold Amount</label>
                                            <input type="number" min="0" value={approvals.expense_threshold} onChange={(e) => setApprovals({...approvals, expense_threshold: parseInt(e.target.value) || 0})} className={inputClass} />
                                            <p className="text-xs text-slate-400 mt-1">Expenses above {fmt(approvals.expense_threshold)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Payroll */}
                                <div className={`p-4 rounded-lg border ${approvals.payroll_require_approval ? 'border-purple-200 bg-purple-50/50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            <span className="font-medium text-slate-900 text-sm">Payroll</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={approvals.payroll_require_approval} onChange={(e) => setApprovals({...approvals, payroll_require_approval: e.target.checked})} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-400">All payroll runs require approval before processing</p>
                                </div>

                                {/* Inventory Adjustment */}
                                <div className={`p-4 rounded-lg border ${approvals.inventory_adjustment_approval ? 'border-teal-200 bg-teal-50/50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                            <span className="font-medium text-slate-900 text-sm">Inventory Adjustments</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={approvals.inventory_adjustment_approval} onChange={(e) => setApprovals({...approvals, inventory_adjustment_approval: e.target.checked})} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-400">Stock adjustments require supervisor sign-off</p>
                                </div>

                                {/* Credit Over-Limit */}
                                <div className={`p-4 rounded-lg border ${approvals.credit_over_limit_approval ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                            <span className="font-medium text-slate-900 text-sm">Credit Over-Limit</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={approvals.credit_over_limit_approval} onChange={(e) => setApprovals({...approvals, credit_over_limit_approval: e.target.checked})} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-400">Sales exceeding customer credit limit require approval</p>
                                </div>

                                {/* Production */}
                                <div className={`p-4 rounded-lg border ${approvals.production_require_approval ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 bg-slate-50'} col-span-1 sm:col-span-2`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                            <span className="font-medium text-slate-900 text-sm">Production Orders</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={approvals.production_require_approval} onChange={(e) => setApprovals({...approvals, production_require_approval: e.target.checked})} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                    {approvals.production_require_approval && (
                                        <div>
                                            <label className="text-xs text-slate-500">Threshold Amount</label>
                                            <input type="number" min="0" value={approvals.production_threshold} onChange={(e) => setApprovals({...approvals, production_threshold: parseInt(e.target.value) || 0})} className={inputClass} />
                                            <p className="text-xs text-slate-400 mt-1">Production orders above {fmt(approvals.production_threshold)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardBody></Card>

                        {/* ── Escalation & Dual Approval ── */}
                        <Card><CardBody className="p-4 space-y-4">
                            <div>
                                <h4 className="font-semibold text-slate-800">Escalation & Dual Approval</h4>
                                <p className="text-xs text-slate-500 mt-1">Configure automatic escalation and multi-level approval thresholds</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Dual Approval Above</label>
                                    <input type="number" min="0" value={approvals.require_dual_approval_above} onChange={(e) => setApprovals({...approvals, require_dual_approval_above: parseInt(e.target.value) || 0})} className={inputClass} />
                                    <p className="text-xs text-slate-400 mt-1">Transactions above {fmt(approvals.require_dual_approval_above)} require 2 approvers</p>
                                </div>
                                <div>
                                    <label className={labelClass}>Sales Discount Threshold (%)</label>
                                    <input type="number" min="0" max="100" value={approvals.sales_discount_threshold} onChange={(e) => setApprovals({...approvals, sales_discount_threshold: parseInt(e.target.value) || 0})} className={inputClass} />
                                    <p className="text-xs text-slate-400 mt-1">Discounts above {approvals.sales_discount_threshold}% need manager approval</p>
                                </div>
                                <div>
                                    <label className={labelClass}>Auto-Escalate After (Hours)</label>
                                    <input type="number" min="1" max="168" value={approvals.auto_escalate_after_hours} onChange={(e) => setApprovals({...approvals, auto_escalate_after_hours: parseInt(e.target.value) || 24})} className={inputClass} />
                                    <p className="text-xs text-slate-400 mt-1">Pending approvals escalate to next level after {approvals.auto_escalate_after_hours}h</p>
                                </div>
                                <div>
                                    <label className={labelClass}>Max Approval Levels</label>
                                    <input type="number" min="1" max="10" value={approvals.max_approval_levels} onChange={(e) => setApprovals({...approvals, max_approval_levels: parseInt(e.target.value) || 2})} className={inputClass} />
                                    <p className="text-xs text-slate-400 mt-1">Maximum {approvals.max_approval_levels} levels of approval chain</p>
                                </div>
                            </div>
                        </CardBody></Card>

                        {/* ── Role Separation Rules ── */}
                        <Card><CardBody className="p-4 space-y-4">
                            <div>
                                <h4 className="font-semibold text-slate-800">Role Separation Rules</h4>
                                <p className="text-xs text-slate-500 mt-1">Enforce separation of duties for internal controls and audit compliance</p>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <span>These rules are critical for preventing fraud and ensuring proper segregation of duties. Changes take effect immediately.</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div>
                                        <span className="font-medium text-slate-900">Creator cannot approve own transactions</span>
                                        <p className="text-xs text-slate-500">Person who creates an order/expense cannot approve it</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={approvals.creator_cannot_approve} onChange={(e) => setApprovals({...approvals, creator_cannot_approve: e.target.checked})} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div>
                                        <span className="font-medium text-slate-900">Booking officer cannot be cashier</span>
                                        <p className="text-xs text-slate-500">Person who books an order cannot collect payment for it</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={approvals.booking_cannot_cashier} onChange={(e) => setApprovals({...approvals, booking_cannot_cashier: e.target.checked})} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div>
                                        <span className="font-medium text-slate-900">Cashier cannot be accountant</span>
                                        <p className="text-xs text-slate-500">Person who collects cash cannot record ledger entries</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={approvals.cashier_cannot_accountant} onChange={(e) => setApprovals({...approvals, cashier_cannot_accountant: e.target.checked})} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div>
                                        <span className="font-medium text-slate-900">PO receiver cannot be PO creator</span>
                                        <p className="text-xs text-slate-500">Person who receives goods cannot be the one who created the purchase order</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={approvals.same_user_cannot_receive_po} onChange={(e) => setApprovals({...approvals, same_user_cannot_receive_po: e.target.checked})} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </CardBody></Card>

                        {/* ── Approval Notifications ── */}
                        <Card><CardBody className="p-4 space-y-4">
                            <div>
                                <h4 className="font-semibold text-slate-800">Approval Notifications</h4>
                                <p className="text-xs text-slate-500 mt-1">Configure when stakeholders receive notifications about approval actions</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className={`p-4 rounded-lg border text-center ${approvals.notify_on_pending_approval ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-blue-100">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    </div>
                                    <span className="text-sm font-medium text-slate-900">Pending Approval</span>
                                    <p className="text-xs text-slate-400 mt-1">Notify approvers of new items</p>
                                    <label className="relative inline-flex items-center cursor-pointer mt-3">
                                        <input type="checkbox" checked={approvals.notify_on_pending_approval} onChange={(e) => setApprovals({...approvals, notify_on_pending_approval: e.target.checked})} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className={`p-4 rounded-lg border text-center ${approvals.notify_on_approval_complete ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-green-100">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <span className="text-sm font-medium text-slate-900">Approval Complete</span>
                                    <p className="text-xs text-slate-400 mt-1">Notify requester on approval</p>
                                    <label className="relative inline-flex items-center cursor-pointer mt-3">
                                        <input type="checkbox" checked={approvals.notify_on_approval_complete} onChange={(e) => setApprovals({...approvals, notify_on_approval_complete: e.target.checked})} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                    </label>
                                </div>
                                <div className={`p-4 rounded-lg border text-center ${approvals.notify_on_rejection ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-red-100">
                                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <span className="text-sm font-medium text-slate-900">Rejection</span>
                                    <p className="text-xs text-slate-400 mt-1">Notify requester on rejection</p>
                                    <label className="relative inline-flex items-center cursor-pointer mt-3">
                                        <input type="checkbox" checked={approvals.notify_on_rejection} onChange={(e) => setApprovals({...approvals, notify_on_rejection: e.target.checked})} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                                    </label>
                                </div>
                            </div>
                            <div className="pt-2">
                                <label className={labelClass}>Reminder Interval (Hours)</label>
                                <div className="flex items-center gap-3">
                                    <input type="number" min="1" max="168" value={approvals.reminder_hours} onChange={(e) => setApprovals({...approvals, reminder_hours: parseInt(e.target.value) || 12})} className={`${inputClass} max-w-[120px]`} />
                                    <p className="text-xs text-slate-400">Send reminder every {approvals.reminder_hours}h for pending approvals</p>
                                </div>
                            </div>
                        </CardBody></Card>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('Approval Workflows')}>Save All Changes</Button>
                        </div>
                    </div>
                );

            case 'roles':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Roles & Permissions</h3>
                                <p className="text-sm text-slate-500 mt-1">Manage roles and their permissions</p>
                            </div>
                            <Button onClick={() => { setShowAddRole(true); setEditingRole(null); setRoleForm({ name: '', permissions: [] }); }}>
                                + New Role
                            </Button>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Search roles..."
                                value={roleSearch}
                                onChange={(e) => setRoleSearch(e.target.value)}
                                className={`${inputClass} max-w-sm`}
                            />
                            <button
                                className="text-xs text-slate-500 hover:text-slate-700"
                                onClick={() => setRoleSearch('')}
                            >
                                Clear
                            </button>
                        </div>

                        {showAddRole && (
                            <Card><CardBody className="p-4 space-y-4 border-2 border-blue-200">
                                <h4 className="font-semibold text-slate-800">{editingRole ? 'Edit Role' : 'Create Role'}</h4>
                                <div>
                                    <label className={labelClass}>Role Name</label>
                                    <input
                                        type="text"
                                        value={roleForm.name}
                                        onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className={labelClass}>Permissions</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(permissions).map(([group, perms]) => (
                                            <div key={group} className="p-3 bg-slate-50 rounded-lg">
                                                <button
                                                    className="w-full flex items-center justify-between text-xs font-semibold uppercase text-slate-500 mb-2"
                                                    onClick={() => setPermissionGroupsOpen((prev) => ({ ...prev, [group]: !prev[group] }))}
                                                >
                                                    <span>{group}</span>
                                                    <span>{permissionGroupsOpen[group] ? '−' : '+'}</span>
                                                </button>
                                                {permissionGroupsOpen[group] && (
                                                    <div className="space-y-2">
                                                        {(perms || []).map((p) => (
                                                            <label key={p.name} className="flex items-center gap-2 text-sm text-slate-700">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={roleForm.permissions.includes(p.name)}
                                                                    onChange={(e) => {
                                                                        const next = e.target.checked
                                                                            ? [...roleForm.permissions, p.name]
                                                                            : roleForm.permissions.filter((x) => x !== p.name);
                                                                        setRoleForm({ ...roleForm, permissions: next });
                                                                    }}
                                                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                                                                />
                                                                {p.name}
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSaveRole}>{editingRole ? 'Update Role' : 'Save Role'}</Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setShowAddRole(false); setEditingRole(null); }}>Cancel</Button>
                                </div>
                            </CardBody></Card>
                        )}

                        <div className="space-y-3">
                            {roles
                                .filter((r) => r.name?.toLowerCase().includes(roleSearch.trim().toLowerCase()))
                                .map((r) => (
                                <Card key={r.id}><CardBody className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-slate-900">{r.name}</div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                {(r.permissions || []).length} permission(s)
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => handleEditRole(r)}>Edit</button>
                                            <button className="text-sm text-red-600 hover:text-red-800" onClick={() => handleDeleteRole(r)}>Delete</button>
                                        </div>
                                    </div>
                                </CardBody></Card>
                            ))}
                        </div>
                    </div>
                );

            case 'fiscal':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Fiscal Year</h3>
                            <p className="text-sm text-slate-500 mt-1">Define financial year for reporting and period closures</p>
                        </div>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Financial Year Start</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Start Month</label>
                                    <select value={fiscal.start_month} onChange={(e) => setFiscal({...fiscal, start_month: parseInt(e.target.value)})} className={inputClass}>
                                        {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Start Day</label>
                                    <input type="number" min="1" max="28" value={fiscal.start_day} onChange={(e) => setFiscal({...fiscal, start_day: parseInt(e.target.value)})} className={inputClass} />
                                </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                                Current fiscal year: <strong>{fiscal.current_year_label}</strong> ({['January','February','March','April','May','June','July','August','September','October','November','December'][fiscal.start_month - 1]} {fiscal.start_day}, 2026 &mdash; {['January','February','March','April','May','June','July','August','September','October','November','December'][(fiscal.start_month - 2 + 12) % 12]} {fiscal.start_day > 1 ? fiscal.start_day - 1 : 28}, 2027)
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Period Management</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <span className="font-medium text-slate-900">Auto-close periods</span>
                                        <p className="text-xs text-slate-500">Automatically close accounting periods at month-end</p>
                                    </div>
                                    <input type="checkbox" checked={fiscal.auto_close} onChange={(e) => setFiscal({...fiscal, auto_close: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <span className="font-medium text-slate-900">Lock closed periods</span>
                                        <p className="text-xs text-slate-500">Prevent modifications to transactions in closed periods</p>
                                    </div>
                                    <input type="checkbox" checked={fiscal.lock_closed_periods} onChange={(e) => setFiscal({...fiscal, lock_closed_periods: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                </div>
                            </div>
                        </CardBody></Card>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('Fiscal Year')}>Save Changes</Button>
                        </div>
                    </div>
                );

            case 'payroll':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Payroll & HR Settings</h3>
                            <p className="text-sm text-slate-500 mt-1">Pay periods, statutory deductions, and allowance types</p>
                        </div>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Pay Schedule</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Pay Period</label>
                                    <select value={payroll.pay_period} onChange={(e) => setPayroll({...payroll, pay_period: e.target.value})} className={inputClass}>
                                        <option value="monthly">Monthly</option>
                                        <option value="bi-weekly">Bi-Weekly</option>
                                        <option value="weekly">Weekly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Pay Day (Day of Month)</label>
                                    <input type="number" min="1" max="31" value={payroll.pay_day} onChange={(e) => setPayroll({...payroll, pay_day: parseInt(e.target.value)})} className={inputClass} />
                                </div>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Statutory Deductions</h4>
                            <div className="flex items-center gap-3 mb-3">
                                <input type="checkbox" id="tax_enabled" checked={payroll.tax_enabled} onChange={(e) => setPayroll({...payroll, tax_enabled: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                <label htmlFor="tax_enabled" className="text-sm font-medium text-slate-700">Enable PAYE Tax calculation</label>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>Employee Pension (%)</label>
                                    <input type="number" step="0.5" value={payroll.pension_rate} onChange={(e) => setPayroll({...payroll, pension_rate: parseFloat(e.target.value)})} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Employer Pension (%)</label>
                                    <input type="number" step="0.5" value={payroll.pension_employer_rate} onChange={(e) => setPayroll({...payroll, pension_employer_rate: parseFloat(e.target.value)})} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>NHF Rate (%)</label>
                                    <input type="number" step="0.5" value={payroll.nhf_rate} onChange={(e) => setPayroll({...payroll, nhf_rate: parseFloat(e.target.value)})} className={inputClass} />
                                </div>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Allowance & Deduction Types</h4>
                            <div>
                                <label className={labelClass}>Default Allowance Types</label>
                                <input type="text" value={payroll.default_allowance_types} onChange={(e) => setPayroll({...payroll, default_allowance_types: e.target.value})} className={inputClass} />
                                <p className="text-xs text-slate-400 mt-1">Comma-separated list of allowance categories</p>
                            </div>
                            <div>
                                <label className={labelClass}>Default Deduction Types</label>
                                <input type="text" value={payroll.default_deduction_types} onChange={(e) => setPayroll({...payroll, default_deduction_types: e.target.value})} className={inputClass} />
                                <p className="text-xs text-slate-400 mt-1">Comma-separated list of deduction categories</p>
                            </div>
                        </CardBody></Card>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('Payroll')}>Save Changes</Button>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
                            <p className="text-sm text-slate-500 mt-1">Alerts, reminders, and email notification preferences</p>
                        </div>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Stock Alerts</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <span className="font-medium text-slate-900">Low stock alert</span>
                                        <p className="text-xs text-slate-500">Notify when products fall below reorder level</p>
                                    </div>
                                    <input type="checkbox" checked={notifications.low_stock_alert} onChange={(e) => setNotifications({...notifications, low_stock_alert: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <span className="font-medium text-slate-900">Critical stock alert</span>
                                        <p className="text-xs text-slate-500">Urgent notification when stock reaches critical level</p>
                                    </div>
                                    <input type="checkbox" checked={notifications.critical_stock_alert} onChange={(e) => setNotifications({...notifications, critical_stock_alert: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                </div>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Sales Orders</h4>
                            <div className="space-y-3">
                                {[
                                    { key: 'new_sales_order', label: 'New sales order', desc: 'Notify when a new sales order is created' },
                                    { key: 'sales_order_approved', label: 'Sales order approved', desc: 'Notify when a sales order is approved' },
                                    { key: 'sales_order_cancelled', label: 'Sales order cancelled', desc: 'Notify when a sales order is cancelled' },
                                    { key: 'order_confirmation', label: 'Order confirmation', desc: 'Send confirmation to customer when order is placed' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <span className="font-medium text-slate-900">{item.label}</span>
                                            <p className="text-xs text-slate-500">{item.desc}</p>
                                        </div>
                                        <input type="checkbox" checked={notifications[item.key]} onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                    </div>
                                ))}
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">POS Terminal</h4>
                            <div className="space-y-3">
                                {[
                                    { key: 'pos_sale_complete', label: 'POS sale complete', desc: 'Notify when a POS transaction is completed' },
                                    { key: 'pos_refund_processed', label: 'POS refund processed', desc: 'Notify when a refund is processed at POS' },
                                    { key: 'pos_shift_end_summary', label: 'Shift end summary', desc: 'Send summary report when cashier ends shift' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <span className="font-medium text-slate-900">{item.label}</span>
                                            <p className="text-xs text-slate-500">{item.desc}</p>
                                        </div>
                                        <input type="checkbox" checked={notifications[item.key]} onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                    </div>
                                ))}
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Payments & Credit</h4>
                            <div className="space-y-3">
                                {[
                                    { key: 'payment_received', label: 'Payment received', desc: 'Notify when a payment is received' },
                                    { key: 'payment_overdue', label: 'Payment overdue', desc: 'Alert when customer payment is overdue' },
                                    { key: 'credit_limit_warning', label: 'Credit limit warning', desc: 'Warn when customer approaches credit limit' },
                                    { key: 'credit_limit_exceeded', label: 'Credit limit exceeded', desc: 'Alert when customer exceeds credit limit' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <span className="font-medium text-slate-900">{item.label}</span>
                                            <p className="text-xs text-slate-500">{item.desc}</p>
                                        </div>
                                        <input type="checkbox" checked={notifications[item.key]} onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                    </div>
                                ))}
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <span className="font-medium text-slate-900">Payment due reminder</span>
                                        <p className="text-xs text-slate-500">Remind customers before payment is due</p>
                                    </div>
                                    <input type="checkbox" checked={notifications.payment_due_reminder} onChange={(e) => setNotifications({...notifications, payment_due_reminder: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                </div>
                                {notifications.payment_due_reminder && (
                                    <div className="ml-4">
                                        <label className={labelClass}>Days before due date</label>
                                        <input type="number" min="1" max="30" value={notifications.payment_due_days_before} onChange={(e) => setNotifications({...notifications, payment_due_days_before: parseInt(e.target.value)})} className={`${inputClass} w-32`} />
                                    </div>
                                )}
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Production</h4>
                            <div className="space-y-3">
                                {[
                                    { key: 'production_started', label: 'Production started', desc: 'Notify when a production run begins' },
                                    { key: 'production_complete', label: 'Production complete', desc: 'Notify when a production run is finished' },
                                    { key: 'production_materials_low', label: 'Materials running low', desc: 'Alert when raw materials for production are low' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <span className="font-medium text-slate-900">{item.label}</span>
                                            <p className="text-xs text-slate-500">{item.desc}</p>
                                        </div>
                                        <input type="checkbox" checked={notifications[item.key]} onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                    </div>
                                ))}
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Purchases</h4>
                            <div className="space-y-3">
                                {[
                                    { key: 'purchase_order_created', label: 'Purchase order created', desc: 'Notify when a new purchase order is created' },
                                    { key: 'purchase_order_received', label: 'Goods received', desc: 'Notify when purchase order items are received' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <span className="font-medium text-slate-900">{item.label}</span>
                                            <p className="text-xs text-slate-500">{item.desc}</p>
                                        </div>
                                        <input type="checkbox" checked={notifications[item.key]} onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                    </div>
                                ))}
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Workflow & Summaries</h4>
                            <div className="space-y-3">
                                {[
                                    { key: 'approval_request_notify', label: 'Approval requests', desc: 'Notify approvers when items need their attention' },
                                    { key: 'payroll_processed_notify', label: 'Payroll processed', desc: 'Notify HR when payroll run is completed' },
                                    { key: 'expense_approved_notify', label: 'Expense approved/rejected', desc: 'Notify submitter of expense decision' },
                                    { key: 'daily_summary_email', label: 'Daily summary email', desc: 'Send daily recap of key business metrics' },
                                    { key: 'weekly_summary', label: 'Weekly summary email', desc: 'Send weekly business performance summary' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <span className="font-medium text-slate-900">{item.label}</span>
                                            <p className="text-xs text-slate-500">{item.desc}</p>
                                        </div>
                                        <input type="checkbox" checked={notifications[item.key]} onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                    </div>
                                ))}
                            </div>
                        </CardBody></Card>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('Notifications')}>Save Changes</Button>
                        </div>
                    </div>
                );

            case 'sms':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">SMS / WhatsApp</h3>
                            <p className="text-sm text-slate-500 mt-1">Configure SMS and WhatsApp messaging for customer notifications</p>
                        </div>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Provider Settings</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>SMS Provider</label>
                                    <select value={sms.provider} onChange={(e) => setSms({...sms, provider: e.target.value})} className={inputClass}>
                                        <option value="termii">Termii</option>
                                        <option value="africastalking">Africa's Talking</option>
                                        <option value="twilio">Twilio</option>
                                        <option value="infobip">Infobip</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Sender ID</label>
                                    <input type="text" value={sms.sender_id} onChange={(e) => setSms({...sms, sender_id: e.target.value})} className={inputClass} placeholder="e.g. FactoryPulse" />
                                    <p className="text-xs text-slate-400 mt-1">Max 11 characters. Must be registered with provider.</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>API Key *</label>
                                    <input type="password" value={sms.api_key} onChange={(e) => setSms({...sms, api_key: e.target.value})} className={inputClass} placeholder="Enter your provider API key" />
                                </div>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Channels</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-slate-700">SMS</div>
                                        <div className="text-xs text-slate-500">Send text messages to customers</div>
                                    </div>
                                    <input type="checkbox" checked={sms.enable_sms} onChange={(e) => setSms({...sms, enable_sms: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-slate-700">WhatsApp</div>
                                        <div className="text-xs text-slate-500">Send WhatsApp messages (requires WhatsApp Business API)</div>
                                    </div>
                                    <input type="checkbox" checked={sms.enable_whatsapp} onChange={(e) => setSms({...sms, enable_whatsapp: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                </div>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Notification Triggers</h4>
                            <div className="space-y-3">
                                {[
                                    { key: 'order_confirmation', label: 'Order Confirmation', desc: 'Send when a sales order is created' },
                                    { key: 'payment_receipt', label: 'Payment Receipt', desc: 'Send when payment is recorded' },
                                    { key: 'delivery_alert', label: 'Delivery Alert', desc: 'Send when goods are dispatched' },
                                    { key: 'payment_reminder', label: 'Payment Reminder', desc: 'Send reminders for outstanding invoices' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <div className="font-medium text-slate-700">{item.label}</div>
                                            <div className="text-xs text-slate-500">{item.desc}</div>
                                        </div>
                                        <input type="checkbox" checked={sms[item.key]} onChange={(e) => setSms({...sms, [item.key]: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                    </div>
                                ))}
                            </div>
                        </CardBody></Card>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('SMS/WhatsApp')}>Save Settings</Button>
                            <Button variant="outline">Send Test SMS</Button>
                        </div>
                    </div>
                );

            case 'email':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Email Setup</h3>
                            <p className="text-sm text-slate-500 mt-1">Configure outgoing email (SMTP) for notifications, invoices, and reports</p>
                        </div>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Mail Driver</h4>
                            <div>
                                <label className={labelClass}>Driver</label>
                                <select value={email.driver} onChange={(e) => setEmail({...email, driver: e.target.value})} className={inputClass}>
                                    <option value="smtp">SMTP</option>
                                    <option value="mailgun">Mailgun</option>
                                    <option value="ses">Amazon SES</option>
                                    <option value="postmark">Postmark</option>
                                </select>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">SMTP Configuration</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>SMTP Host *</label>
                                    <input type="text" value={email.host} onChange={(e) => setEmail({...email, host: e.target.value})} className={inputClass} placeholder="e.g. smtp.gmail.com" />
                                </div>
                                <div>
                                    <label className={labelClass}>Port *</label>
                                    <select value={email.port} onChange={(e) => setEmail({...email, port: parseInt(e.target.value)})} className={inputClass}>
                                        <option value={25}>25 (Unencrypted)</option>
                                        <option value={465}>465 (SSL)</option>
                                        <option value={587}>587 (TLS - Recommended)</option>
                                        <option value={2525}>2525 (Alternative)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Encryption</label>
                                    <select value={email.encryption} onChange={(e) => setEmail({...email, encryption: e.target.value})} className={inputClass}>
                                        <option value="tls">TLS</option>
                                        <option value="ssl">SSL</option>
                                        <option value="">None</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Username *</label>
                                    <input type="text" value={email.username} onChange={(e) => setEmail({...email, username: e.target.value})} className={inputClass} placeholder="SMTP username or email" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Password *</label>
                                    <input type="password" value={email.password} onChange={(e) => setEmail({...email, password: e.target.value})} className={inputClass} placeholder="SMTP password or app password" />
                                    <p className="text-xs text-slate-400 mt-1">For Gmail, use an App Password (not your regular password)</p>
                                </div>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Sender Identity</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>From Address *</label>
                                    <input type="email" value={email.from_address} onChange={(e) => setEmail({...email, from_address: e.target.value})} className={inputClass} placeholder="noreply@factorypulse.com" />
                                </div>
                                <div>
                                    <label className={labelClass}>From Name *</label>
                                    <input type="text" value={email.from_name} onChange={(e) => setEmail({...email, from_name: e.target.value})} className={inputClass} placeholder="FactoryPulse" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">This is how your emails will appear in recipients' inboxes: <strong>{email.from_name} &lt;{email.from_address}&gt;</strong></p>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Test Email</h4>
                            <p className="text-sm text-slate-500">Send a test email to verify your configuration is working correctly.</p>
                            <div className="flex gap-3">
                                <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className={`${inputClass} flex-1`} placeholder="Enter recipient email address..." />
                                <Button onClick={handleTestEmail} disabled={testStatus === 'sending'}>
                                    {testStatus === 'sending' ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                            Sending...
                                        </span>
                                    ) : 'Send Test'}
                                </Button>
                            </div>
                            {testStatus && testStatus !== 'sending' && (
                                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${testStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {testStatus === 'success'
                                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        }
                                    </svg>
                                    {testMessage}
                                </div>
                            )}
                        </CardBody></Card>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('Email')}>Save Email Settings</Button>
                        </div>
                    </div>
                );

            case 'print':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Print & Receipts</h3>
                            <p className="text-sm text-slate-500 mt-1">Configure printing preferences for receipts, invoices, and other documents</p>
                        </div>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">POS Receipt Settings</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Paper Size</label>
                                    <select value={print.receipt_paper_size} onChange={(e) => setPrint({...print, receipt_paper_size: e.target.value})} className={inputClass}>
                                        <option value="58mm">58mm (Small Thermal)</option>
                                        <option value="80mm">80mm (Standard Thermal)</option>
                                        <option value="A4">A4 (Full Page)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Copies per Receipt</label>
                                    <input type="number" min="1" max="5" value={print.copies_receipt} onChange={(e) => setPrint({...print, copies_receipt: parseInt(e.target.value) || 1})} className={inputClass} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-slate-700">Auto-Print POS Receipts</div>
                                        <div className="text-xs text-slate-500">Automatically print after each POS transaction</div>
                                    </div>
                                    <input type="checkbox" checked={print.auto_print_pos} onChange={(e) => setPrint({...print, auto_print_pos: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-slate-700">Show Logo on Receipt</div>
                                        <div className="text-xs text-slate-500">Print company logo at the top of receipts</div>
                                    </div>
                                    <input type="checkbox" checked={print.show_logo_on_receipt} onChange={(e) => setPrint({...print, show_logo_on_receipt: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-slate-700">Show Company Address</div>
                                        <div className="text-xs text-slate-500">Print full company address on receipts</div>
                                    </div>
                                    <input type="checkbox" checked={print.show_company_address} onChange={(e) => setPrint({...print, show_company_address: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                </div>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Document Copies</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Invoice Copies</label>
                                    <input type="number" min="1" max="5" value={print.copies_invoice} onChange={(e) => setPrint({...print, copies_invoice: parseInt(e.target.value) || 1})} className={inputClass} />
                                    <p className="text-xs text-slate-400 mt-1">Customer copy + Factory copy</p>
                                </div>
                                <div>
                                    <label className={labelClass}>Delivery Note Copies</label>
                                    <input type="number" min="1" max="5" value={print.copies_delivery} onChange={(e) => setPrint({...print, copies_delivery: parseInt(e.target.value) || 1})} className={inputClass} />
                                    <p className="text-xs text-slate-400 mt-1">Customer + Driver + Office</p>
                                </div>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Receipt Footer</h4>
                            <textarea value={print.receipt_footer} onChange={(e) => setPrint({...print, receipt_footer: e.target.value})} className={inputClass} rows={3} placeholder="Thank you for your patronage!" />
                            <p className="text-xs text-slate-400">This text will appear at the bottom of all receipts</p>
                        </CardBody></Card>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('Print & Receipts')}>Save Settings</Button>
                            <Button variant="outline">Print Test Receipt</Button>
                        </div>
                    </div>
                );

            case 'templates':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Document Templates</h3>
                                <p className="text-sm text-slate-500 mt-1">Manage printable document layouts</p>
                            </div>
                            <Button onClick={() => { setShowAddTemplate(true); setEditingTemplateId(null); setTemplateForm({ name: '', description: '', fields: '' }); }}>
                                + Add Template
                            </Button>
                        </div>

                        {showAddTemplate && (
                            <Card><CardBody className="p-4 space-y-4 border-2 border-blue-200">
                                <h4 className="font-semibold text-slate-800">{editingTemplateId ? 'Edit Template' : 'New Template'}</h4>
                                <div>
                                    <label className={labelClass}>Name</label>
                                    <input
                                        type="text"
                                        value={templateForm.name}
                                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Description</label>
                                    <input
                                        type="text"
                                        value={templateForm.description}
                                        onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Fields (comma separated)</label>
                                    <input
                                        type="text"
                                        value={templateForm.fields}
                                        onChange={(e) => setTemplateForm({ ...templateForm, fields: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSaveTemplate}>{editingTemplateId ? 'Update Template' : 'Add Template'}</Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setShowAddTemplate(false); setEditingTemplateId(null); setTemplateForm({ name: '', description: '', fields: '' }); }}>Cancel</Button>
                                </div>
                            </CardBody></Card>
                        )}

                        <div className="space-y-3">
                            {templates.map((t) => (
                                <Card key={t.id}><CardBody className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-slate-900">{t.name}</div>
                                            <div className="text-xs text-slate-500 mt-1">{t.description}</div>
                                            <div className="text-xs text-slate-400 mt-1">Fields: {(t.fields || []).join(', ')}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => handleEditTemplate(t)}>Edit</button>
                                            <button className="text-sm text-red-600 hover:text-red-800" onClick={() => handleDeleteTemplate(t)}>Delete</button>
                                            <button className="text-sm text-slate-500 hover:text-slate-700" onClick={() => setPreviewTemplate(t)}>Fields</button>
                                            <button 
                                                className="text-sm text-green-600 hover:text-green-800 font-medium flex items-center gap-1" 
                                                onClick={() => handlePreviewTemplatePdf(t)}
                                                disabled={previewLoading}
                                            >
                                                {previewLoading ? '...' : '📄 PDF Preview'}
                                            </button>
                                        </div>
                                    </div>
                                </CardBody></Card>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('Doc Templates')}>Save Templates</Button>
                        </div>
                        <Modal isOpen={!!previewTemplate} onClose={() => setPreviewTemplate(null)} title="Template Fields" size="md">
                            {previewTemplate && (
                                <div className="space-y-4">
                                    <div className="text-lg font-semibold text-slate-900">{previewTemplate.name}</div>
                                    <div className="text-sm text-slate-600">{previewTemplate.description}</div>
                                    <div>
                                        <div className="text-xs font-semibold uppercase text-slate-500 mb-2">Enabled Fields</div>
                                        <div className="flex flex-wrap gap-2">
                                            {(previewTemplate.fields || []).map((f, i) => (
                                                <span key={i} className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400">Last modified: {previewTemplate.last_modified}</div>
                                    <div className="pt-4 border-t">
                                        <Button onClick={() => { handlePreviewTemplatePdf(previewTemplate); setPreviewTemplate(null); }}>
                                            Open PDF Preview
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Modal>
                    </div>
                );

            case 'backup':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Backup & Data</h3>
                            <p className="text-sm text-slate-500 mt-1">Database backups, export settings, and data retention</p>
                        </div>

                        {/* Database Info */}
                        <Card><CardBody className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-slate-800">Database Status</h4>
                                    <p className="text-sm text-slate-500 mt-1">Current database size: <span className="font-medium text-slate-700">{backup.database_size || 'Calculating...'}</span></p>
                                    {backup.last_backup_at && (
                                        <p className="text-sm text-slate-500">Last backup: <span className="font-medium text-slate-700">{backup.last_backup_at}</span> ({backup.last_backup_size || 'N/A'})</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handleCreateBackup} disabled={saving}>
                                        {saving ? 'Creating...' : 'Backup Now'}
                                    </Button>
                                </div>
                            </div>
                        </CardBody></Card>

                        {/* Automatic Backups */}
                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Automatic Backups</h4>
                            <div className="flex items-center gap-3 mb-3">
                                <input type="checkbox" id="auto_backup" checked={backup.auto_backup_enabled} onChange={(e) => setBackup({...backup, auto_backup_enabled: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                <label htmlFor="auto_backup" className="text-sm font-medium text-slate-700">Enable automatic backups</label>
                            </div>
                            {backup.auto_backup_enabled && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Frequency</label>
                                        <select value={backup.backup_frequency} onChange={(e) => setBackup({...backup, backup_frequency: e.target.value})} className={inputClass}>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Time</label>
                                        <input type="time" value={backup.backup_time} onChange={(e) => setBackup({...backup, backup_time: e.target.value})} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Retention (days)</label>
                                        <input type="number" min="1" max="365" value={backup.backup_retention_days} onChange={(e) => setBackup({...backup, backup_retention_days: parseInt(e.target.value) || 1})} className={inputClass} />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="backup_cloud" checked={backup.backup_to_cloud} onChange={(e) => setBackup({...backup, backup_to_cloud: e.target.checked})} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                                <label htmlFor="backup_cloud" className="text-sm font-medium text-slate-700">Backup to cloud storage</label>
                            </div>
                            {backup.backup_to_cloud && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Cloud Provider</label>
                                        <select value={backup.cloud_provider} onChange={(e) => setBackup({...backup, cloud_provider: e.target.value})} className={inputClass}>
                                            <option value="s3">Amazon S3</option>
                                            <option value="google">Google Drive</option>
                                            <option value="dropbox">Dropbox</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </CardBody></Card>

                        {/* Backup History */}
                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Recent Backups</h4>
                            {backupHistory.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No backups yet. Click "Backup Now" to create your first backup.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead><tr className="border-b text-left text-slate-500"><th className="py-2">Filename</th><th>Date</th><th>Size</th><th className="text-right">Actions</th></tr></thead>
                                    <tbody>
                                        {backupHistory.map((b, i) => (
                                            <tr key={i} className="border-b hover:bg-slate-50">
                                                <td className="py-2 font-medium text-slate-700">{b.filename}</td>
                                                <td className="text-slate-600">{b.created_at}</td>
                                                <td className="text-slate-600">{b.size}</td>
                                                <td className="text-right space-x-2">
                                                    <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => handleDownloadBackup(b.filename)}>Download</button>
                                                    <button className="text-sm text-red-600 hover:text-red-800" onClick={() => handleDeleteBackup(b.filename)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </CardBody></Card>

                        {/* Export Data */}
                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Export Data</h4>
                            <p className="text-sm text-slate-500">Export your data in various formats for external use or archiving.</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <button onClick={() => handleExportData('products', 'csv')} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                    Export Products (CSV)
                                </button>
                                <button onClick={() => handleExportData('customers', 'csv')} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                    Export Customers (CSV)
                                </button>
                                <button onClick={() => handleExportData('sales', 'csv')} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                    Export Sales (CSV)
                                </button>
                                <button onClick={() => handleExportData('purchases', 'csv')} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                    Export Purchases (CSV)
                                </button>
                                <button onClick={() => handleExportData('inventory', 'csv')} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                    Export Inventory (CSV)
                                </button>
                                <button onClick={() => handleExportData('all', 'json')} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                                    Export All (JSON)
                                </button>
                            </div>
                        </CardBody></Card>

                        {/* Restore Backup */}
                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Restore Backup</h4>
                            <p className="text-sm text-slate-500">Upload a backup file to restore your data. <span className="text-red-600 font-medium">Warning: This will overwrite all current data.</span></p>
                            <div className="flex items-center gap-4">
                                <input
                                    type="file"
                                    accept=".zip"
                                    onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                                />
                                <Button variant="danger" onClick={handleRestoreBackup} disabled={!restoreFile || saving}>
                                    {saving ? 'Restoring...' : 'Restore'}
                                </Button>
                            </div>
                        </CardBody></Card>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('Backup')}>Save Settings</Button>
                        </div>
                    </div>
                );

            case 'api':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">API & Integrations</h3>
                            <p className="text-sm text-slate-500 mt-1">Expose API access for external apps and manage integration settings</p>
                        </div>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">API Access</h4>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-slate-700">Enable API Access</div>
                                    <div className="text-xs text-slate-500">Allow external applications to connect</div>
                                </div>
                                <input type="checkbox" checked={apiSettings.api_enabled} onChange={(e) => setApiSettings({ ...apiSettings, api_enabled: e.target.checked })} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>API Key</label>
                                    <div className="flex gap-2">
                                        <input
                                            type={showApiKey ? 'text' : 'password'}
                                            value={apiSettings.api_key || ''}
                                            onChange={(e) => setApiSettings({ ...apiSettings, api_key: e.target.value })}
                                            className={inputClass}
                                        />
                                        <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                                            {showApiKey ? 'Hide' : 'Show'}
                                        </Button>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm" variant="outline" onClick={handleCopyApiKey}>Copy</Button>
                                        <Button size="sm" variant="outline" onClick={handleRotateApiKey}>Rotate</Button>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Rate Limit (per minute)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10000"
                                        value={apiSettings.rate_limit_per_min}
                                        onChange={(e) => setApiSettings({ ...apiSettings, rate_limit_per_min: parseInt(e.target.value) || 1 })}
                                        className={inputClass}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Allowed IPs (comma separated)</label>
                                    <input
                                        type="text"
                                        value={(apiSettings.allowed_ips || []).join(', ')}
                                        onChange={(e) => setApiSettings({ ...apiSettings, allowed_ips: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
                                        className={inputClass}
                                        placeholder="e.g. 192.168.1.10, 10.0.0.0/24"
                                    />
                                </div>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">Webhooks</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Webhook URL</label>
                                    <input
                                        type="text"
                                        value={apiSettings.webhook_url || ''}
                                        onChange={(e) => setApiSettings({ ...apiSettings, webhook_url: e.target.value })}
                                        className={inputClass}
                                        placeholder="https://yourapp.com/webhooks/factorypulse"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Webhook Secret</label>
                                    <input
                                        type="text"
                                        value={apiSettings.webhook_secret || ''}
                                        onChange={(e) => setApiSettings({ ...apiSettings, webhook_secret: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </CardBody></Card>

                        <Card><CardBody className="p-4 space-y-4">
                            <h4 className="font-semibold text-slate-800">API Documentation</h4>
                            <div className="text-sm text-slate-700">
                                Base URL: <span className="font-mono">{`${window.location.origin}/api/v1`}</span>
                            </div>
                            <div className="text-xs text-slate-500">Auth: Bearer token or API key (header: Authorization: Bearer &lt;token&gt;)</div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    placeholder="Search endpoints..."
                                    value={apiDocsSearch}
                                    onChange={(e) => setApiDocsSearch(e.target.value)}
                                    className={`${inputClass} max-w-sm`}
                                />
                                <Button size="sm" variant="outline" onClick={handleDownloadApiMarkdown}>Download Markdown</Button>
                                <Button size="sm" variant="outline" onClick={handleDownloadApiPdf}>Download PDF</Button>
                                <Button size="sm" variant="outline" onClick={() => window.open('/api-docs', '_blank')}>Open Swagger UI</Button>
                            </div>
                            <div className="space-y-4">
                                {filteredApiDocs.map((group) => (
                                    <div key={group.title}>
                                        <div className="text-xs font-semibold uppercase text-slate-500 mb-2">{group.title}</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            {group.endpoints.map((e) => (
                                                <div key={`${group.title}-${e.method}-${e.path}`} className="px-3 py-2 bg-slate-50 rounded-lg">
                                                    <div className="font-mono text-slate-700">{e.method} {e.path}</div>
                                                    <div className="text-xs text-slate-500 mt-1">{e.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-xs text-slate-500">
                                Example:
                            </div>
                            <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs overflow-x-auto">
{`curl -H "Authorization: Bearer YOUR_TOKEN" \\
${window.location.origin}/api/v1/products`}
                            </pre>
                        </CardBody></Card>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button onClick={() => handleSave('API & Integrations')}>Save Settings</Button>
                        </div>
                    </div>
                );

            case 'credit':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Credit Facility Types</h3>
                                <p className="text-sm text-slate-500 mt-1">Define credit facility templates that can be assigned to customers</p>
                            </div>
                            <Button onClick={() => { 
                                setEditingFacility(null); 
                                setFacilityForm({ 
                                    name: '', code: '', default_limit: '', max_limit: '', 
                                    payment_terms: 30, payment_terms_unit: 'days',
                                    interest_rate: 0, grace_period: 0, grace_period_unit: 'days', description: ''
                                }); 
                                setShowAddFacility(true); 
                            }}>+ Add Facility Type</Button>
                        </div>

                        {showAddFacility && (
                            <Card><CardBody className="p-4 space-y-4 border-2 border-blue-200">
                                <h4 className="font-semibold text-slate-800">{editingFacility ? 'Edit' : 'New'} Credit Facility Type</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Facility Name *</label>
                                        <input type="text" value={facilityForm.name} onChange={(e) => setFacilityForm({...facilityForm, name: e.target.value})} className={inputClass} placeholder="e.g. Standard Trade Credit" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Code *</label>
                                        <input type="text" value={facilityForm.code} onChange={(e) => setFacilityForm({...facilityForm, code: e.target.value.toUpperCase()})} className={inputClass} placeholder="e.g. STC-30" maxLength={10} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Default Credit Limit *</label>
                                        <input type="number" min="0" value={facilityForm.default_limit} onChange={(e) => setFacilityForm({...facilityForm, default_limit: e.target.value})} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Maximum Credit Limit</label>
                                        <input type="number" min="0" value={facilityForm.max_limit} onChange={(e) => setFacilityForm({...facilityForm, max_limit: e.target.value})} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Payment Terms *</label>
                                        <div className="flex gap-2">
                                            <input type="number" min="1" max="365" value={facilityForm.payment_terms} onChange={(e) => setFacilityForm({...facilityForm, payment_terms: parseInt(e.target.value) || 1})} className={inputClass + ' flex-1'} />
                                            <select value={facilityForm.payment_terms_unit || 'days'} onChange={(e) => setFacilityForm({...facilityForm, payment_terms_unit: e.target.value})} className={inputClass + ' w-28'}>
                                                <option value="days">Days</option>
                                                <option value="weeks">Weeks</option>
                                                <option value="months">Months</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Interest Rate (% monthly)</label>
                                        <input type="number" min="0" max="100" step="0.1" value={facilityForm.interest_rate} onChange={(e) => setFacilityForm({...facilityForm, interest_rate: parseFloat(e.target.value) || 0})} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Grace Period</label>
                                        <div className="flex gap-2">
                                            <input type="number" min="0" value={facilityForm.grace_period} onChange={(e) => setFacilityForm({...facilityForm, grace_period: parseInt(e.target.value) || 0})} className={inputClass + ' flex-1'} />
                                            <select value={facilityForm.grace_period_unit || 'days'} onChange={(e) => setFacilityForm({...facilityForm, grace_period_unit: e.target.value})} className={inputClass + ' w-28'}>
                                                <option value="days">Days</option>
                                                <option value="weeks">Weeks</option>
                                                <option value="months">Months</option>
                                            </select>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Period after due date before interest applies</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelClass}>Description</label>
                                        <textarea value={facilityForm.description || ''} onChange={(e) => setFacilityForm({...facilityForm, description: e.target.value})} className={inputClass} rows={2} placeholder="Brief description of this facility type..." />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button onClick={handleSaveFacility} disabled={saving}>{saving ? 'Saving...' : (editingFacility ? 'Update' : 'Create')} Facility</Button>
                                    <Button variant="outline" onClick={() => { setShowAddFacility(false); setEditingFacility(null); }}>Cancel</Button>
                                </div>
                            </CardBody></Card>
                        )}

                        {loading ? (
                            <div className="text-center py-8 text-slate-500">Loading...</div>
                        ) : creditFacilities.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">No credit facility types defined yet.</div>
                        ) : (
                        <div className="space-y-3">
                            {creditFacilities.map((f) => (
                                <Card key={f.id}><CardBody className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg ${f.is_active ? 'bg-green-100' : 'bg-slate-100'} flex items-center justify-center`}>
                                                <svg className={`w-5 h-5 ${f.is_active ? 'text-green-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-900">{f.name}</span>
                                                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{f.code}</span>
                                                    {!f.is_active && <Badge variant="draft">Inactive</Badge>}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    Limit: {fmt(f.default_limit)} (max {fmt(f.max_limit)}) &middot; {f.payment_terms} {f.payment_terms_unit || 'days'} &middot; {parseFloat(f.interest_rate) > 0 ? `${f.interest_rate}% interest` : 'No interest'}{f.grace_period > 0 ? ` &middot; ${f.grace_period} ${f.grace_period_unit || 'days'} grace` : ''}
                                                </div>
                                                {f.description && <div className="text-xs text-slate-400 mt-1">{f.description}</div>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => handleEditFacility(f)}>Edit</button>
                                            <button className="text-sm text-slate-500 hover:text-slate-700" onClick={async () => { 
                                                try {
                                                    await creditFacilityTypesAPI.toggleStatus(f.id);
                                                    const res = await creditFacilityTypesAPI.getAll();
                                                    setCreditFacilities(res.data?.data || []);
                                                    toast.success(f.is_active ? 'Facility deactivated' : 'Facility activated');
                                                } catch (error) {
                                                    toast.error('Failed to update status');
                                                }
                                            }}>
                                                {f.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </div>
                                    </div>
                                </CardBody></Card>
                            ))}
                        </div>
                        )}

                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                            <strong>How it works:</strong> Define facility types here, then go to <strong>Finance &rarr; Credit Facility</strong> to assign them to specific customers with customized limits and terms.
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-600 mt-1">System configuration, business rules, and preferences</p>
            </div>

            <div className="flex gap-6 min-h-[600px]">
                {/* Sidebar Navigation */}
                <div className="w-56 shrink-0">
                    <nav className="space-y-1 sticky top-6">
                        {sections.map(s => (
                            <button
                                key={s.key}
                                onClick={() => setActiveSection(s.key)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                                    activeSection === s.key
                                        ? 'bg-blue-50 text-blue-700 border-l-3 border-blue-600'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                                </svg>
                                <span>{s.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    <Card><CardBody className="p-6">
                        {renderSection()}
                    </CardBody></Card>
                </div>
            </div>
        </div>
    );
}
