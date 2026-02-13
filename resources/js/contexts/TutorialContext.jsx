import { createContext, useContext, useState, useCallback } from 'react';

const TutorialContext = createContext();

// ============================================
// MODULE TUTORIALS - Detailed step-by-step guides
// ============================================

export const MODULE_TUTORIALS = {
    // ============================================
    // DASHBOARD MODULE
    // ============================================
    dashboard: {
        id: 'dashboard',
        title: 'Dashboard Overview',
        description: 'Learn to read your business performance at a glance',
        icon: '📊',
        duration: '3 min',
        steps: [
            {
                target: '[data-tour="dashboard-cards"]',
                title: 'Key Performance Indicators',
                content: 'These cards show your most important metrics in real-time:\n\n• **Today\'s Sales** - Total revenue collected today\n• **Pending Payments** - Outstanding amounts from credit sales\n• **Low Stock Items** - Products that need restocking\n• **Production Output** - Units produced today',
                placement: 'bottom',
            },
            {
                target: '[data-tour="sales-chart"]',
                title: 'Sales Trend Analysis',
                content: 'This chart visualizes your sales performance over time. Use the filter buttons to view:\n\n• **Daily** - See hourly patterns\n• **Weekly** - Compare day-by-day\n• **Monthly** - Track long-term trends\n\n💡 **Pro Tip:** Hover over data points for exact figures.',
                placement: 'top',
            },
            {
                target: '[data-tour="recent-orders"]',
                title: 'Recent Orders Feed',
                content: 'Monitor your latest transactions as they happen:\n\n• 🟢 **Completed** - Fully paid orders\n• 🟡 **Pending** - Awaiting payment\n• 🔴 **Overdue** - Past payment deadline\n\nClick any order to view full details.',
                placement: 'left',
            },
            {
                target: '[data-tour="quick-actions"]',
                title: 'Quick Actions Menu',
                content: 'Speed up your workflow with one-click actions:\n\n⚡ **New Booking** - Create a sales order instantly\n💰 **Collect Payment** - Record customer payments\n📦 **Stock Adjustment** - Update inventory counts\n💸 **Record Expense** - Log business expenses\n\nKeyboard shortcut: Press **Q** from anywhere!',
                placement: 'bottom',
            },
        ],
    },

    // ============================================
    // INVENTORY MODULE
    // ============================================
    inventory: {
        id: 'inventory',
        title: 'Inventory Management',
        description: 'Master stock control, tracking, and optimization',
        icon: '📦',
        duration: '5 min',
        steps: [
            {
                target: 'body',
                title: 'Welcome to Inventory Management',
                content: 'This module helps you track every item in your business:\n\n• **Raw Materials** - Ingredients for production\n• **Finished Goods** - Products ready for sale\n• **Supplies** - Consumables and packaging\n\nLet\'s explore how to manage your stock effectively!',
                placement: 'center',
            },
            {
                target: '[data-tour="inventory-list"]',
                title: 'Product Catalog',
                content: 'Your complete product database with:\n\n• **SKU** - Unique product identifier\n• **Current Stock** - Real-time quantity\n• **Reorder Level** - Minimum stock threshold\n• **Status** - In stock, Low, or Out\n\n🔍 Use filters to find products quickly.',
                placement: 'top',
            },
            {
                target: '[data-tour="inventory-filters"]',
                title: 'Smart Filtering',
                content: 'Powerful filters to find what you need:\n\n• **Category** - Group by product type\n• **Stock Status** - Low stock alerts\n• **Warehouse** - Filter by location\n• **Search** - Find by name or SKU\n\n💡 Combine filters for precise results.',
                placement: 'bottom',
            },
            {
                target: '[data-tour="add-product-btn"]',
                title: 'Adding New Products',
                content: 'Click here to add a new product. You\'ll need:\n\n1. **Basic Info** - Name, SKU, category\n2. **Pricing** - Cost price & selling price\n3. **Stock Settings** - Reorder level, units\n4. **Warehouse** - Storage location\n\n📸 Add product images for easy identification.',
                placement: 'left',
            },
            {
                target: '[data-tour="stock-adjustment"]',
                title: 'Stock Adjustments',
                content: 'Update stock quantities when:\n\n• **Physical Count** - After stocktaking\n• **Damage/Loss** - Items damaged or stolen\n• **Returns** - Customer returns\n• **Transfers** - Between warehouses\n\nAll adjustments are logged in the audit trail.',
                placement: 'bottom',
            },
            {
                target: '[data-tour="inventory-actions"]',
                title: 'Bulk Actions',
                content: 'Select multiple products to:\n\n• **Export** - Download as Excel/PDF\n• **Print Labels** - Generate barcode labels\n• **Bulk Update** - Change category/prices\n• **Transfer** - Move between locations\n\n⚠️ Actions require appropriate permissions.',
                placement: 'left',
            },
        ],
    },

    // ============================================
    // POS SYSTEM MODULE
    // ============================================
    pos: {
        id: 'pos',
        title: 'Point of Sale (POS)',
        description: 'Process sales quickly and efficiently',
        icon: '🛒',
        duration: '6 min',
        steps: [
            {
                target: 'body',
                title: 'Welcome to the POS Terminal',
                content: 'Your all-in-one sales terminal for:\n\n• **Quick Sales** - Fast checkout process\n• **Mixed Payments** - Cash + Transfer + Credit\n• **Customer Tickets** - Deferred pickup orders\n• **Session Management** - Track cashier shifts\n\nLet\'s learn how to process sales like a pro!',
                placement: 'center',
            },
            {
                target: '[data-tour="pos-products"]',
                title: 'Product Grid',
                content: 'Browse and add products to cart:\n\n• **Click** a product to add 1 unit\n• **Long press** to specify quantity\n• **Search bar** to find products fast\n• **Categories** to filter by type\n\n💡 Use keyboard: Type product name and press Enter.',
                placement: 'right',
            },
            {
                target: '[data-tour="pos-cart"]',
                title: 'Shopping Cart',
                content: 'Your current order summary:\n\n• **Edit quantity** - Click +/- buttons\n• **Remove item** - Click the X icon\n• **Apply discount** - Per-item or whole order\n• **Add note** - Special instructions\n\n💰 Running total updates automatically.',
                placement: 'left',
            },
            {
                target: '[data-tour="pos-customer"]',
                title: 'Customer Selection',
                content: 'Link a customer to this sale:\n\n• **Walk-in** - Anonymous cash sales\n• **Existing** - Search registered customers\n• **New** - Quick-add customer info\n\n🏷️ Regular customers can use credit facilities!',
                placement: 'bottom',
            },
            {
                target: '[data-tour="pos-payment"]',
                title: 'Payment Processing',
                content: 'Flexible payment options:\n\n💵 **Cash** - Enter amount tendered\n🏦 **Bank Transfer** - Enter reference number\n📱 **Mobile Money** - Scan QR or enter code\n💳 **Credit** - Use customer credit limit\n\n✅ Mixed payments supported!',
                placement: 'top',
            },
            {
                target: '[data-tour="pos-ticket"]',
                title: 'Ticket System',
                content: 'For orders not collected immediately:\n\n1. **Create Ticket** - Save order for later\n2. **Print Voucher** - Customer receives claim slip\n3. **Redeem Later** - Search by ticket number\n\n📅 Set pickup date for customer reminder.',
                placement: 'left',
            },
            {
                target: '[data-tour="pos-session"]',
                title: 'Cashier Sessions',
                content: 'Track your shift:\n\n• **Open Session** - Start with opening cash\n• **Track Sales** - All transactions logged\n• **Close Session** - Count and reconcile\n• **Generate Report** - Shift summary\n\n⚠️ Always close your session before leaving!',
                placement: 'bottom',
            },
        ],
    },

    // ============================================
    // SALES ORDERS MODULE
    // ============================================
    salesOrders: {
        id: 'salesOrders',
        title: 'Sales Order Management',
        description: 'Create, track, and fulfill customer orders',
        icon: '📋',
        duration: '4 min',
        steps: [
            {
                target: 'body',
                title: 'Sales Orders Overview',
                content: 'Manage the complete sales lifecycle:\n\n1. **Booking** - Create customer orders\n2. **Payment** - Collect full or partial\n3. **Production** - Items manufactured\n4. **Delivery** - Order fulfilled\n\nEach stage is tracked with status updates.',
                placement: 'center',
            },
            {
                target: '[data-tour="order-list"]',
                title: 'Order List View',
                content: 'All orders at a glance:\n\n• **Order #** - Unique reference\n• **Customer** - Who placed the order\n• **Amount** - Total order value\n• **Status** - Current stage\n• **Payment** - Paid/Pending indicator\n\n🔍 Click any order to view details.',
                placement: 'top',
            },
            {
                target: '[data-tour="create-order"]',
                title: 'Creating New Orders',
                content: 'The booking process:\n\n1. **Select Customer** - Or create new\n2. **Add Products** - Choose items & quantities\n3. **Apply Pricing** - Discounts if applicable\n4. **Save Order** - Generates order number\n\n💡 Orders can be edited until payment is made.',
                placement: 'left',
            },
            {
                target: '[data-tour="order-status"]',
                title: 'Order Status Workflow',
                content: 'Orders progress through stages:\n\n🔵 **Draft** - Being created\n🟡 **Pending** - Awaiting payment\n🟢 **Confirmed** - Payment received\n🔵 **In Production** - Being manufactured\n✅ **Completed** - Ready for pickup\n🚚 **Delivered** - Handed to customer',
                placement: 'right',
            },
            {
                target: '[data-tour="order-actions"]',
                title: 'Order Actions',
                content: 'What you can do with orders:\n\n💰 **Collect Payment** - Record payments\n🖨️ **Print Invoice** - Generate PDF\n📧 **Send Receipt** - Email to customer\n❌ **Cancel Order** - With reason logging\n\n⚠️ Cancelled orders affect inventory.',
                placement: 'left',
            },
        ],
    },

    // ============================================
    // PRODUCTION MODULE
    // ============================================
    production: {
        id: 'production',
        title: 'Production Management',
        description: 'Track manufacturing from raw materials to finished goods',
        icon: '🏭',
        duration: '5 min',
        steps: [
            {
                target: 'body',
                title: 'Production Overview',
                content: 'Transform raw materials into finished products:\n\n• **Formulas** - Define recipes/BOMs\n• **Production Runs** - Manufacturing batches\n• **Loss Tracking** - Monitor waste\n• **Output Recording** - Finished goods\n\nPerfect for manufacturing businesses!',
                placement: 'center',
            },
            {
                target: '[data-tour="production-list"]',
                title: 'Production Runs',
                content: 'Active manufacturing batches:\n\n• **Run #** - Batch identifier\n• **Formula** - Recipe being produced\n• **Quantity** - Target output\n• **Status** - Pending/In Progress/Complete\n• **Started** - When production began',
                placement: 'top',
            },
            {
                target: '[data-tour="start-production"]',
                title: 'Starting Production',
                content: 'To start a production run:\n\n1. **Select Formula** - Choose what to produce\n2. **Set Quantity** - How many units\n3. **Check Materials** - System verifies stock\n4. **Start Run** - Materials are reserved\n\n⚠️ Insufficient materials will block start.',
                placement: 'left',
            },
            {
                target: '[data-tour="production-losses"]',
                title: 'Recording Losses',
                content: 'Track production waste:\n\n• **Material Loss** - Spillage, damage\n• **Process Loss** - Evaporation, shrinkage\n• **Quality Rejection** - Failed QC\n\nAccurate loss tracking improves profitability!',
                placement: 'right',
            },
            {
                target: '[data-tour="complete-production"]',
                title: 'Completing Production',
                content: 'When batch is finished:\n\n1. **Enter Output** - Actual quantity produced\n2. **Record Losses** - Any waste or rejects\n3. **Complete Run** - Updates inventory\n\n📊 System calculates yield percentage automatically.',
                placement: 'bottom',
            },
        ],
    },

    // ============================================
    // CUSTOMERS MODULE
    // ============================================
    customers: {
        id: 'customers',
        title: 'Customer Management',
        description: 'Build relationships and manage credit facilities',
        icon: '👥',
        duration: '4 min',
        steps: [
            {
                target: 'body',
                title: 'Customer Database',
                content: 'Your complete customer relationship center:\n\n• **Contact Info** - Names, phones, addresses\n• **Purchase History** - All transactions\n• **Credit Status** - Limits and balances\n• **Loyalty Points** - Rewards tracking\n\nBuild lasting customer relationships!',
                placement: 'center',
            },
            {
                target: '[data-tour="customer-list"]',
                title: 'Customer Directory',
                content: 'Browse all customers:\n\n• **Name** - Customer/Company name\n• **Phone** - Primary contact\n• **Type** - Walk-in/Regular/VIP\n• **Balance** - Outstanding credit\n• **Last Purchase** - Recent activity',
                placement: 'top',
            },
            {
                target: '[data-tour="add-customer"]',
                title: 'Adding Customers',
                content: 'Register new customers with:\n\n• **Basic Info** - Name, phone, email\n• **Address** - Delivery location\n• **Customer Type** - Classification\n• **Credit Settings** - Limit & terms\n\n📱 Phone number is used for lookups.',
                placement: 'left',
            },
            {
                target: '[data-tour="customer-credit"]',
                title: 'Credit Facilities',
                content: 'Offer credit to trusted customers:\n\n💳 **Credit Limit** - Maximum allowed\n📅 **Payment Terms** - Days until due\n📊 **Credit Score** - Payment reliability\n🚫 **Credit Block** - Freeze if overdue\n\n⚠️ System auto-blocks at 100% utilization.',
                placement: 'right',
            },
            {
                target: '[data-tour="customer-history"]',
                title: 'Transaction History',
                content: 'Complete customer activity:\n\n• **Orders** - All purchases made\n• **Payments** - Payment records\n• **Tickets** - Pending pickups\n• **Returns** - Refund history\n\n📈 Use insights for personalized service!',
                placement: 'bottom',
            },
        ],
    },

    // ============================================
    // PAYMENTS MODULE
    // ============================================
    payments: {
        id: 'payments',
        title: 'Payment Processing',
        description: 'Collect, track, and reconcile all payments',
        icon: '💰',
        duration: '4 min',
        steps: [
            {
                target: 'body',
                title: 'Payment Management',
                content: 'Handle all money transactions:\n\n💵 **Cash Payments** - Physical currency\n🏦 **Bank Transfers** - Account payments\n📱 **Mobile Money** - Digital wallets\n💳 **Credit Usage** - Customer credit\n\nComplete audit trail for every naira!',
                placement: 'center',
            },
            {
                target: '[data-tour="payment-list"]',
                title: 'Payment Records',
                content: 'All transactions logged:\n\n• **Reference** - Unique payment ID\n• **Order** - Linked sales order\n• **Amount** - Payment value\n• **Method** - How it was paid\n• **Status** - Confirmed/Pending',
                placement: 'top',
            },
            {
                target: '[data-tour="collect-payment"]',
                title: 'Collecting Payments',
                content: 'Record customer payments:\n\n1. **Find Order** - Search by order or customer\n2. **Enter Amount** - Full or partial\n3. **Select Method** - Cash/Transfer/etc\n4. **Add Reference** - For bank transfers\n5. **Confirm** - Payment recorded\n\n🧾 Receipt generated automatically.',
                placement: 'left',
            },
            {
                target: '[data-tour="payment-split"]',
                title: 'Split Payments',
                content: 'Accept mixed payment methods:\n\n**Example:**\n• ₦50,000 cash\n• ₦30,000 bank transfer\n• ₦20,000 from credit balance\n\nTotal: ₦100,000 order paid in full!',
                placement: 'right',
            },
        ],
    },

    // ============================================
    // REPORTS MODULE
    // ============================================
    reports: {
        id: 'reports',
        title: 'Reports & Analytics',
        description: 'Data-driven insights for better decisions',
        icon: '📈',
        duration: '3 min',
        steps: [
            {
                target: 'body',
                title: 'Business Intelligence',
                content: 'Transform data into insights:\n\n📊 **Sales Reports** - Revenue analysis\n📦 **Inventory Reports** - Stock levels\n💰 **Financial Reports** - P&L statements\n👥 **Customer Reports** - Behavior analysis\n\nExport to Excel or PDF anytime!',
                placement: 'center',
            },
            {
                target: '[data-tour="report-filters"]',
                title: 'Report Filters',
                content: 'Customize your reports:\n\n📅 **Date Range** - Any period\n🏢 **Branch** - Filter by location\n👤 **Staff** - By salesperson\n📁 **Category** - Product groups\n\nSave filters as presets for quick access.',
                placement: 'bottom',
            },
            {
                target: '[data-tour="report-export"]',
                title: 'Export Options',
                content: 'Share reports easily:\n\n📄 **PDF** - For printing/sharing\n📊 **Excel** - For further analysis\n📧 **Email** - Send directly\n🔄 **Schedule** - Auto-generate daily/weekly\n\n💡 Scheduled reports arrive in your inbox!',
                placement: 'left',
            },
        ],
    },

    // ============================================
    // SETTINGS MODULE
    // ============================================
    settings: {
        id: 'settings',
        title: 'System Configuration',
        description: 'Customize FactoryPulse for your business',
        icon: '⚙️',
        duration: '4 min',
        steps: [
            {
                target: 'body',
                title: 'System Settings',
                content: 'Configure FactoryPulse for your needs:\n\n🏢 **Company** - Business details\n👥 **Users** - Staff accounts\n🔐 **Roles** - Permissions\n💰 **Finance** - Currency, taxes\n🖨️ **Printing** - Receipt formats',
                placement: 'center',
            },
            {
                target: '[data-tour="user-management"]',
                title: 'User Management',
                content: 'Control system access:\n\n• **Add Users** - Create staff accounts\n• **Assign Roles** - Define permissions\n• **Set Branches** - Location access\n• **Enable/Disable** - Activate accounts\n\n🔐 Use strong passwords!',
                placement: 'right',
            },
            {
                target: '[data-tour="role-permissions"]',
                title: 'Role-Based Access',
                content: 'Granular permission control:\n\n👑 **Admin** - Full access\n💼 **Manager** - Most operations\n📝 **Booking Officer** - Create orders\n💰 **Cashier** - Process payments\n🏭 **Production** - Manufacturing only\n\nCreate custom roles as needed!',
                placement: 'left',
            },
        ],
    },

    // ============================================
    // STAFF/HR MODULE
    // ============================================
    staff: {
        id: 'staff',
        title: 'Staff Management',
        description: 'Manage employees, attendance, and payroll',
        icon: '👨‍💼',
        duration: '4 min',
        steps: [
            {
                target: 'body',
                title: 'HR Management',
                content: 'Complete staff administration:\n\n👥 **Employee Records** - Personal info\n📅 **Attendance** - Time tracking\n💰 **Payroll** - Salary processing\n📊 **Performance** - Reviews & KPIs\n\nStreamline your HR operations!',
                placement: 'center',
            },
            {
                target: '[data-tour="staff-list"]',
                title: 'Staff Directory',
                content: 'All employees at a glance:\n\n• **Name** - Full name & photo\n• **Department** - Work unit\n• **Position** - Job title\n• **Status** - Active/Inactive\n• **Joined** - Employment date',
                placement: 'top',
            },
            {
                target: '[data-tour="payroll"]',
                title: 'Payroll Processing',
                content: 'Run payroll seamlessly:\n\n1. **Select Period** - Month/fortnight\n2. **Review Hours** - Verify attendance\n3. **Apply Deductions** - Loans, taxes\n4. **Generate Payslips** - Individual records\n5. **Process Payment** - Bank transfer\n\n📅 Set up recurring payroll schedules.',
                placement: 'left',
            },
        ],
    },

    // ============================================
    // EXPENSES MODULE
    // ============================================
    expenses: {
        id: 'expenses',
        title: 'Expense Management',
        description: 'Track business costs and manage budgets',
        icon: '💸',
        duration: '3 min',
        steps: [
            {
                target: 'body',
                title: 'Expense Tracking',
                content: 'Monitor all business costs:\n\n🏠 **Rent & Utilities** - Fixed costs\n🚗 **Transport** - Delivery & logistics\n🛠️ **Maintenance** - Repairs & upkeep\n📦 **Supplies** - Consumables\n💼 **Operations** - Day-to-day costs\n\nCategorize for better analysis!',
                placement: 'center',
            },
            {
                target: '[data-tour="add-expense"]',
                title: 'Recording Expenses',
                content: 'Log business expenses:\n\n1. **Category** - Type of expense\n2. **Amount** - Cost value\n3. **Date** - When incurred\n4. **Description** - What it\'s for\n5. **Receipt** - Upload image\n\n📸 Always attach receipts for audit!',
                placement: 'left',
            },
            {
                target: '[data-tour="expense-report"]',
                title: 'Expense Analysis',
                content: 'Understand your spending:\n\n📊 **By Category** - Where money goes\n📅 **By Period** - Monthly trends\n📈 **vs Budget** - Track variances\n🔔 **Alerts** - Over-budget warnings\n\nMake informed cost-cutting decisions!',
                placement: 'right',
            },
        ],
    },
};

// Tutorial progress storage key
const TUTORIAL_PROGRESS_KEY = 'factorypulse_tutorials';

export function TutorialProvider({ children }) {
    const [activeTutorial, setActiveTutorial] = useState(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedTutorials, setCompletedTutorials] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(TUTORIAL_PROGRESS_KEY)) || {};
        } catch {
            return {};
        }
    });

    // Start a specific module tutorial
    const startTutorial = useCallback((moduleId) => {
        const tutorial = MODULE_TUTORIALS[moduleId];
        if (tutorial) {
            setActiveTutorial(tutorial);
            setCurrentStepIndex(0);
        }
    }, []);

    // Navigate steps
    const nextStep = useCallback(() => {
        if (activeTutorial && currentStepIndex < activeTutorial.steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        }
    }, [activeTutorial, currentStepIndex]);

    const prevStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    }, [currentStepIndex]);

    const goToStep = useCallback((index) => {
        if (activeTutorial && index >= 0 && index < activeTutorial.steps.length) {
            setCurrentStepIndex(index);
        }
    }, [activeTutorial]);

    // Complete current tutorial
    const completeTutorial = useCallback(() => {
        if (activeTutorial) {
            const updated = { ...completedTutorials, [activeTutorial.id]: true };
            setCompletedTutorials(updated);
            localStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(updated));
            setActiveTutorial(null);
            setCurrentStepIndex(0);
        }
    }, [activeTutorial, completedTutorials]);

    // Skip/close tutorial
    const closeTutorial = useCallback(() => {
        setActiveTutorial(null);
        setCurrentStepIndex(0);
    }, []);

    // Check if tutorial is completed
    const isTutorialComplete = useCallback((moduleId) => {
        return !!completedTutorials[moduleId];
    }, [completedTutorials]);

    // Reset all progress
    const resetAllProgress = useCallback(() => {
        setCompletedTutorials({});
        localStorage.removeItem(TUTORIAL_PROGRESS_KEY);
    }, []);

    // Get completion stats
    const getCompletionStats = useCallback(() => {
        const totalTutorials = Object.keys(MODULE_TUTORIALS).length;
        const completed = Object.keys(completedTutorials).length;
        return {
            total: totalTutorials,
            completed,
            percentage: Math.round((completed / totalTutorials) * 100),
        };
    }, [completedTutorials]);

    return (
        <TutorialContext.Provider value={{
            // State
            activeTutorial,
            currentStepIndex,
            currentStep: activeTutorial?.steps[currentStepIndex] || null,
            completedTutorials,
            allTutorials: MODULE_TUTORIALS,
            
            // Actions
            startTutorial,
            nextStep,
            prevStep,
            goToStep,
            completeTutorial,
            closeTutorial,
            isTutorialComplete,
            resetAllProgress,
            getCompletionStats,
        }}>
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const ctx = useContext(TutorialContext);
    if (!ctx) throw new Error('useTutorial must be used within TutorialProvider');
    return ctx;
}
