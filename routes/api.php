<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\InventoryController;
use App\Http\Controllers\API\WarehouseController;
use App\Http\Controllers\API\CustomerController;
use App\Http\Controllers\API\FormulaController;
use App\Http\Controllers\API\SalesOrderController;
use App\Http\Controllers\API\SupplierController;
use App\Http\Controllers\API\ExpenseController;
use App\Http\Controllers\API\PurchaseOrderController;
use App\Http\Controllers\API\PaymentController;
use App\Http\Controllers\API\StaffController;
use App\Http\Controllers\API\ProductionController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\PayrollController;
use App\Http\Controllers\API\POSController;
use App\Http\Controllers\API\AuditLogController;
use App\Http\Controllers\API\CreditAnalyticsController;

// Settings Controllers
use App\Http\Controllers\API\Settings\CompanyController;
use App\Http\Controllers\API\Settings\BranchController as SettingsBranchController;
use App\Http\Controllers\API\Settings\InventorySettingsController;
use App\Http\Controllers\API\Settings\SalesSettingsController;
use App\Http\Controllers\API\Settings\TaxController;
use App\Http\Controllers\API\Settings\PaymentMethodController;
use App\Http\Controllers\API\Settings\BankAccountController;
use App\Http\Controllers\API\Settings\NumberSequenceController;
use App\Http\Controllers\API\Settings\ApprovalWorkflowController;
use App\Http\Controllers\API\Settings\PayrollSettingsController;
use App\Http\Controllers\API\Settings\FiscalYearController;
use App\Http\Controllers\API\Settings\NotificationSettingsController;
use App\Http\Controllers\API\Settings\SmsSettingsController;
use App\Http\Controllers\API\Settings\EmailSettingsController;
use App\Http\Controllers\API\Settings\PrintSettingsController;
use App\Http\Controllers\API\Settings\CreditSettingsController;
use App\Http\Controllers\API\Settings\CreditFacilityTypeController;
use App\Http\Controllers\API\Settings\BackupController;
use App\Http\Controllers\API\Settings\DocumentTemplateController;
use App\Http\Controllers\API\Settings\ApiSettingsController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\SetupController;
use App\Http\Controllers\API\InstallController;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/login', [AuthController::class, 'login']);
    
    // Installation wizard routes (public - for initial system installation)
    Route::prefix('install')->group(function () {
        Route::get('/status', [InstallController::class, 'checkInstallStatus']);
        Route::get('/requirements', [InstallController::class, 'checkRequirements']);
        Route::get('/database-status', [InstallController::class, 'checkDatabaseStatus']);
        Route::post('/test-database', [InstallController::class, 'testDatabaseConnection']);
        Route::post('/save-database', [InstallController::class, 'saveDatabaseConfig']);
        Route::post('/migrate', [InstallController::class, 'runMigrations']);
        Route::post('/complete', [InstallController::class, 'completeInstallation']);
    });
    
    // Setup wizard routes (public - for initial system setup)
    Route::prefix('setup')->group(function () {
        Route::get('/status', [SetupController::class, 'checkStatus']);
        Route::post('/complete', [SetupController::class, 'completeSetup']);
    });
    
    // Protected routes
    Route::middleware('api.key.or.auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        
        // Dashboard
        Route::prefix('dashboard')->group(function () {
            Route::get('/kpi-summary', [DashboardController::class, 'kpiSummary']);
            Route::get('/today-snapshot', [DashboardController::class, 'todaySnapshot']);
            Route::get('/sales-trend', [DashboardController::class, 'salesTrend']);
            Route::get('/revenue-expenses', [DashboardController::class, 'revenueExpenses']);
            Route::get('/production-history', [DashboardController::class, 'productionHistory']);
            Route::get('/recent-activities', [DashboardController::class, 'recentActivities']);
            Route::get('/credit-alerts', [DashboardController::class, 'creditAlerts']);
            Route::get('/pending-items', [DashboardController::class, 'pendingItems']);
            Route::get('/pl-summary', [DashboardController::class, 'plSummary']);
        });

        // Notifications
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
            Route::post('/generate', [NotificationController::class, 'generate']);
            Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
            Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
            Route::delete('/clear-read', [NotificationController::class, 'clearRead']);
            Route::delete('/{id}', [NotificationController::class, 'destroy']);
        });

        // Push Notifications
        Route::prefix('push')->group(function () {
            Route::get('/vapid-key', [\App\Http\Controllers\Api\PushNotificationController::class, 'getVapidKey']);
            Route::post('/subscribe', [\App\Http\Controllers\Api\PushNotificationController::class, 'subscribe']);
            Route::post('/unsubscribe', [\App\Http\Controllers\Api\PushNotificationController::class, 'unsubscribe']);
            Route::post('/test', [\App\Http\Controllers\Api\PushNotificationController::class, 'test']);
        });

        // Branches (quick access for branch selector)
        Route::get('/branches', [SettingsBranchController::class, 'index']);

        // Products
        Route::prefix('products')->group(function () {
            Route::get('/stock/low', [ProductController::class, 'lowStock']);
            Route::get('/stock/critical', [ProductController::class, 'criticalStock']);
            Route::get('/raw-materials', [ProductController::class, 'rawMaterials']);
            Route::get('/finished-goods', [ProductController::class, 'finishedGoods']);
            Route::delete('/bulk/delete-all', [ProductController::class, 'deleteAll']);
            Route::delete('/bulk/delete', [ProductController::class, 'bulkDelete']);
            Route::post('/{product}/activate', [ProductController::class, 'activate']);
            Route::post('/{product}/deactivate', [ProductController::class, 'deactivate']);
        });
        Route::apiResource('products', ProductController::class);

        // Categories
        Route::apiResource('categories', CategoryController::class);

        // Warehouses
        Route::get('/warehouses/{warehouse}/inventory', [WarehouseController::class, 'inventory']);
        Route::apiResource('warehouses', WarehouseController::class);

        // Inventory
        Route::prefix('inventory')->group(function () {
            Route::get('/low-stock', [InventoryController::class, 'lowStock']);
            Route::get('/critical-stock', [InventoryController::class, 'criticalStock']);
            Route::get('/movements', [InventoryController::class, 'allMovements']);
            Route::get('/adjustments', [InventoryController::class, 'adjustmentHistory']);
            Route::get('/adjustments/pending', [InventoryController::class, 'pendingAdjustments']);
            Route::post('/adjustments/{adjustment}/approve', [InventoryController::class, 'approveAdjustment']);
            Route::post('/adjustments/{adjustment}/reject', [InventoryController::class, 'rejectAdjustment']);
            Route::post('/transfer', [InventoryController::class, 'transfer']);
            Route::post('/adjust', [InventoryController::class, 'adjust']);
            Route::get('/{product}/movements', [InventoryController::class, 'movements']);
            Route::get('/{product}', [InventoryController::class, 'show']);
        });
        Route::get('/inventory', [InventoryController::class, 'index']);

        // Customers
        Route::prefix('customers')->group(function () {
            Route::get('/credit-alerts', [CustomerController::class, 'creditAlerts']);
            Route::get('/{customer}/credit-summary', [CustomerController::class, 'creditSummary']);
            Route::post('/{customer}/credit', [CustomerController::class, 'updateCredit']);
            Route::post('/{customer}/credit/block', [CustomerController::class, 'toggleCreditBlock']);
            Route::post('/{customer}/check-credit', [CustomerController::class, 'checkCredit']);
            
            // Credit Analytics
            Route::get('/{customer}/credit-analytics', [CreditAnalyticsController::class, 'customerAnalytics']);
            Route::post('/{customer}/credit-score/recalculate', [CreditAnalyticsController::class, 'recalculateScore']);
            Route::get('/{customer}/credit-transactions', [CreditAnalyticsController::class, 'transactions']);
            Route::get('/{customer}/credit-payments', [CreditAnalyticsController::class, 'payments']);
            Route::post('/{customer}/apply-credit-recommendations', [CreditAnalyticsController::class, 'applyRecommendations']);
        });
        Route::apiResource('customers', CustomerController::class);

        // Credit Analytics (global)
        Route::prefix('credit-analytics')->group(function () {
            Route::get('/summary', [CreditAnalyticsController::class, 'summary']);
            Route::get('/overdue', [CreditAnalyticsController::class, 'overdueTransactions']);
            Route::post('/payments', [CreditAnalyticsController::class, 'recordPayment']);
            Route::post('/customer-payment', [CreditAnalyticsController::class, 'recordCustomerPayment']);
            Route::get('/transactions/{transaction}', [CreditAnalyticsController::class, 'transactionDetails']);
        });

        // Formulas
        Route::prefix('formulas')->group(function () {
            Route::get('/customer/{customer}', [FormulaController::class, 'forCustomer']);
            Route::post('/{formula}/calculate', [FormulaController::class, 'calculateRequirements']);
            Route::post('/{formula}/toggle-active', [FormulaController::class, 'toggleActive']);
            Route::post('/{formula}/clone', [FormulaController::class, 'clone']);
        });
        Route::apiResource('formulas', FormulaController::class);

        // Sales Orders
        Route::prefix('sales-orders')->group(function () {
            Route::get('/pending', [SalesOrderController::class, 'pending']);
            Route::post('/{order}/approve', [SalesOrderController::class, 'approve']);
            Route::post('/{order}/reject', [SalesOrderController::class, 'reject']);
            Route::post('/{order}/fulfill', [SalesOrderController::class, 'fulfill']);
        });
        Route::apiResource('sales-orders', SalesOrderController::class)->except(['update', 'destroy']);

        // Suppliers
        Route::prefix('suppliers')->group(function () {
            Route::get('/{supplier}/purchase-orders', [SupplierController::class, 'purchaseOrders']);
            Route::get('/{supplier}/payments', [SupplierController::class, 'payments']);
            Route::get('/{supplier}/statement', [SupplierController::class, 'statement']);
            Route::post('/{supplier}/toggle-active', [SupplierController::class, 'toggleActive']);
        });
        Route::apiResource('suppliers', SupplierController::class);

        // Expenses
        Route::prefix('expenses')->group(function () {
            Route::get('/pending', [ExpenseController::class, 'pending']);
            Route::get('/summary', [ExpenseController::class, 'summary']);
            Route::get('/categories', [ExpenseController::class, 'categories']);
            Route::post('/categories', [ExpenseController::class, 'storeCategory']);
            Route::post('/{expense}/approve', [ExpenseController::class, 'approve']);
            Route::post('/{expense}/disapprove', [ExpenseController::class, 'disapprove']);
            Route::post('/{expense}/reject', [ExpenseController::class, 'reject']);
        });
        Route::apiResource('expenses', ExpenseController::class);

        // Purchase Orders
        Route::prefix('purchase-orders')->group(function () {
            Route::get('/pending', [PurchaseOrderController::class, 'pending']);
            Route::post('/{order}/approve', [PurchaseOrderController::class, 'approve']);
            Route::post('/{order}/cancel', [PurchaseOrderController::class, 'cancel']);
            Route::post('/{order}/receive', [PurchaseOrderController::class, 'receive']);
            Route::get('/{order}/pdf', [PurchaseOrderController::class, 'downloadPdf']);
            Route::get('/{order}/pdf/preview', [PurchaseOrderController::class, 'previewPdf']);
            Route::post('/{order}/send-email', [PurchaseOrderController::class, 'sendEmail']);
        });
        Route::apiResource('purchase-orders', PurchaseOrderController::class);

        // Payments
        Route::prefix('payments')->group(function () {
            Route::get('/receivables', [PaymentController::class, 'receivables']);
            Route::get('/payables', [PaymentController::class, 'payables']);
            Route::get('/overdue', [PaymentController::class, 'overdue']);
            Route::get('/summary', [PaymentController::class, 'summary']);
            Route::post('/{payment}/reconcile', [PaymentController::class, 'reconcile']);
            Route::post('/{payment}/reverse', [PaymentController::class, 'reverse']);
        });
        Route::apiResource('payments', PaymentController::class);

        // Departments
        Route::prefix('departments')->group(function () {
            Route::get('/stats', [\App\Http\Controllers\API\DepartmentController::class, 'stats']);
        });
        Route::apiResource('departments', \App\Http\Controllers\API\DepartmentController::class);

        // Staff
        Route::prefix('staff')->group(function () {
            Route::get('/by-department', [StaffController::class, 'byDepartment']);
            Route::get('/summary', [StaffController::class, 'summary']);
            Route::post('/{staff}/terminate', [StaffController::class, 'terminate']);
            Route::post('/{staff}/suspend', [StaffController::class, 'suspend']);
            Route::post('/{staff}/reinstate', [StaffController::class, 'reinstate']);
            Route::post('/{staff}/salary', [StaffController::class, 'updateSalary']);
        });
        Route::apiResource('staff', StaffController::class);

        // Production
        Route::prefix('production')->group(function () {
            Route::get('/planned', [ProductionController::class, 'planned']);
            Route::get('/in-progress', [ProductionController::class, 'inProgress']);
            Route::get('/summary', [ProductionController::class, 'summary']);
            Route::get('/{run}/check-materials', [ProductionController::class, 'checkMaterials']);
            Route::post('/{run}/start', [ProductionController::class, 'start']);
            Route::post('/{run}/complete', [ProductionController::class, 'complete']);
            Route::post('/{run}/cancel', [ProductionController::class, 'cancel']);
            Route::post('/{run}/loss', [ProductionController::class, 'recordLoss']);
        });
        Route::apiResource('production', ProductionController::class);

        // Users & Roles (Spatie Permission)
        Route::prefix('users')->group(function () {
            Route::get('/roles', [UserController::class, 'roles']);
            Route::get('/permissions', [UserController::class, 'permissions']);
            Route::post('/roles', [UserController::class, 'createRole']);
            Route::put('/roles/{role}', [UserController::class, 'updateRole']);
            Route::delete('/roles/{role}', [UserController::class, 'deleteRole']);
            Route::post('/{user}/assign-roles', [UserController::class, 'assignRole']);
            Route::post('/{user}/revoke-role', [UserController::class, 'revokeRole']);
            Route::post('/{user}/toggle-status', [UserController::class, 'toggleStatus']);
            Route::post('/{user}/reset-password', [UserController::class, 'resetPassword']);
            Route::post('/{user}/set-pin', [UserController::class, 'setPin']);
            Route::delete('/{user}/remove-pin', [UserController::class, 'removePin']);
        });
        Route::apiResource('users', UserController::class);

        // Payroll
        Route::prefix('payroll')->group(function () {
            Route::get('/summary', [PayrollController::class, 'summary']);
            Route::post('/{run}/process', [PayrollController::class, 'process']);
            Route::post('/{run}/approve', [PayrollController::class, 'approve']);
            Route::post('/{run}/mark-paid', [PayrollController::class, 'markPaid']);
            Route::get('/{run}/payslip/{staff}', [PayrollController::class, 'payslip']);
        });
        Route::apiResource('payroll', PayrollController::class)->except(['update', 'destroy']);

        // POS (Point of Sale)
        Route::prefix('pos')->group(function () {
            Route::get('/products', [POSController::class, 'products']);
            Route::get('/categories', [POSController::class, 'categories']);
            Route::get('/customers', [POSController::class, 'customers']);
            Route::get('/summary', [POSController::class, 'summary']);
            Route::post('/sale', [POSController::class, 'createSale']);
            Route::get('/tickets', [POSController::class, 'tickets']);
            Route::post('/tickets', [POSController::class, 'saveTicket']);
            Route::get('/tickets/{ticket}', [POSController::class, 'resumeTicket']);
            Route::post('/tickets/{ticket}/complete', [POSController::class, 'completeTicket']);
            Route::delete('/tickets/{ticket}', [POSController::class, 'cancelTicket']);
            
            // Cashier Session / Register Management
            Route::get('/session', [POSController::class, 'getActiveSession']);
            Route::post('/session/open', [POSController::class, 'openRegister']);
            Route::post('/session/close', [POSController::class, 'closeRegister']);
            Route::get('/sessions', [POSController::class, 'getSessionHistory']);
            Route::get('/sessions/{session}', [POSController::class, 'getSessionReport']);
        });

        // Audit Logs
        Route::prefix('audit-logs')->group(function () {
            Route::get('/', [AuditLogController::class, 'index']);
            Route::get('/filters', [AuditLogController::class, 'filters']);
            Route::get('/export', [AuditLogController::class, 'export']);
            Route::get('/{id}', [AuditLogController::class, 'show']);
        });

        // Document PDFs (uses document templates settings)
        Route::prefix('documents')->group(function () {
            // Template Previews (with sample data)
            Route::get('/template-preview/invoice', [\App\Http\Controllers\API\DocumentController::class, 'templatePreviewInvoice']);
            Route::get('/template-preview/receipt', [\App\Http\Controllers\API\DocumentController::class, 'templatePreviewReceipt']);
            Route::get('/template-preview/delivery-note', [\App\Http\Controllers\API\DocumentController::class, 'templatePreviewDeliveryNote']);
            Route::get('/template-preview/grn', [\App\Http\Controllers\API\DocumentController::class, 'templatePreviewGRN']);
            Route::get('/template-preview/payslip', [\App\Http\Controllers\API\DocumentController::class, 'templatePreviewPayslip']);
            Route::get('/template-preview/purchase-order', [\App\Http\Controllers\API\DocumentController::class, 'templatePreviewPurchaseOrder']);
            
            // Invoice
            Route::get('/invoice/{salesOrder}', [\App\Http\Controllers\API\DocumentController::class, 'invoice']);
            Route::get('/invoice/{salesOrder}/preview', [\App\Http\Controllers\API\DocumentController::class, 'invoicePreview']);
            
            // Receipt
            Route::get('/receipt/{payment}', [\App\Http\Controllers\API\DocumentController::class, 'receipt']);
            Route::get('/receipt/{payment}/preview', [\App\Http\Controllers\API\DocumentController::class, 'receiptPreview']);
            
            // Delivery Note
            Route::get('/delivery-note/{salesOrder}', [\App\Http\Controllers\API\DocumentController::class, 'deliveryNote']);
            Route::get('/delivery-note/{salesOrder}/preview', [\App\Http\Controllers\API\DocumentController::class, 'deliveryNotePreview']);
            
            // Goods Received Note (GRN)
            Route::get('/grn/{purchaseOrder}', [\App\Http\Controllers\API\DocumentController::class, 'grn']);
            Route::get('/grn/{purchaseOrder}/preview', [\App\Http\Controllers\API\DocumentController::class, 'grnPreview']);
            
            // Payslip
            Route::get('/payslip/{payrollRun}/{staff}', [\App\Http\Controllers\API\DocumentController::class, 'payslip']);
            Route::get('/payslip/{payrollRun}/{staff}/preview', [\App\Http\Controllers\API\DocumentController::class, 'payslipPreview']);
            
            // Production Sheet
            Route::get('/production-sheet/{productionRun}', [\App\Http\Controllers\API\DocumentController::class, 'productionSheet']);
            Route::get('/production-sheet/{productionRun}/preview', [\App\Http\Controllers\API\DocumentController::class, 'productionSheetPreview']);
        });

        // Accounting
        Route::prefix('accounting')->group(function () {
            Route::get('/ledger', [App\Http\Controllers\API\AccountingController::class, 'ledger']);
            Route::get('/profit-loss', [App\Http\Controllers\API\AccountingController::class, 'profitAndLoss']);
            Route::get('/balance-sheet', [App\Http\Controllers\API\AccountingController::class, 'balanceSheet']);
            Route::get('/vat-report', [App\Http\Controllers\API\AccountingController::class, 'vatReport']);
        });

        // Assets & Liabilities
        Route::prefix('assets')->group(function () {
            Route::get('/', [App\Http\Controllers\API\AssetLiabilityController::class, 'assets']);
            Route::post('/', [App\Http\Controllers\API\AssetLiabilityController::class, 'storeAsset']);
            Route::put('/{asset}', [App\Http\Controllers\API\AssetLiabilityController::class, 'updateAsset']);
            Route::delete('/{asset}', [App\Http\Controllers\API\AssetLiabilityController::class, 'destroyAsset']);
            Route::post('/depreciation', [App\Http\Controllers\API\AssetLiabilityController::class, 'runDepreciation']);
        });

        Route::prefix('liabilities')->group(function () {
            Route::get('/', [App\Http\Controllers\API\AssetLiabilityController::class, 'liabilities']);
            Route::post('/', [App\Http\Controllers\API\AssetLiabilityController::class, 'storeLiability']);
            Route::put('/{liability}', [App\Http\Controllers\API\AssetLiabilityController::class, 'updateLiability']);
            Route::delete('/{liability}', [App\Http\Controllers\API\AssetLiabilityController::class, 'destroyLiability']);
            Route::post('/{liability}/payments', [App\Http\Controllers\API\AssetLiabilityController::class, 'recordPayment']);
            Route::get('/{liability}/payments', [App\Http\Controllers\API\AssetLiabilityController::class, 'paymentHistory']);
        });

        Route::get('/assets-liabilities/summary', [App\Http\Controllers\API\AssetLiabilityController::class, 'summary']);

        // Settings - Each tab has its own controller
        Route::prefix('settings')->group(function () {
            // Company Profile
            Route::get('/company', [CompanyController::class, 'index']);
            Route::put('/company', [CompanyController::class, 'update']);
            Route::post('/company/logo', [CompanyController::class, 'uploadLogo']);

            // Branches
            Route::get('/branches', [SettingsBranchController::class, 'index']);
            Route::post('/branches', [SettingsBranchController::class, 'store']);
            Route::put('/branches/{branch}', [SettingsBranchController::class, 'update']);
            Route::delete('/branches/{branch}', [SettingsBranchController::class, 'destroy']);
            Route::post('/branches/{branch}/toggle-active', [SettingsBranchController::class, 'toggleActive']);

            // Inventory Settings
            Route::get('/inventory', [InventorySettingsController::class, 'index']);
            Route::put('/inventory', [InventorySettingsController::class, 'update']);

            // Sales & Billing Settings
            Route::get('/sales', [SalesSettingsController::class, 'index']);
            Route::put('/sales', [SalesSettingsController::class, 'update']);

            // Taxes
            Route::get('/taxes', [TaxController::class, 'index']);
            Route::post('/taxes', [TaxController::class, 'store']);
            Route::put('/taxes/{tax}', [TaxController::class, 'update']);
            Route::delete('/taxes/{tax}', [TaxController::class, 'destroy']);
            Route::post('/taxes/{tax}/toggle-active', [TaxController::class, 'toggleActive']);

            // Payment Methods
            Route::get('/payment-methods', [PaymentMethodController::class, 'index']);
            Route::post('/payment-methods', [PaymentMethodController::class, 'store']);
            Route::put('/payment-methods/{method}', [PaymentMethodController::class, 'update']);
            Route::delete('/payment-methods/{method}', [PaymentMethodController::class, 'destroy']);
            Route::post('/payment-methods/{method}/toggle-active', [PaymentMethodController::class, 'toggleActive']);

            // Bank Accounts
            Route::get('/bank-accounts', [BankAccountController::class, 'index']);
            Route::post('/bank-accounts', [BankAccountController::class, 'store']);
            Route::put('/bank-accounts/{account}', [BankAccountController::class, 'update']);
            Route::delete('/bank-accounts/{account}', [BankAccountController::class, 'destroy']);
            Route::post('/bank-accounts/{account}/set-default', [BankAccountController::class, 'setDefault']);

            // Number Sequences
            Route::get('/sequences', [NumberSequenceController::class, 'index']);
            Route::put('/sequences/{sequence}', [NumberSequenceController::class, 'update']);
            Route::post('/sequences/{sequence}/reset', [NumberSequenceController::class, 'reset']);
            Route::get('/sequences/{document}/next', [NumberSequenceController::class, 'getNext']);

            // Approval Workflows
            Route::get('/approvals', [ApprovalWorkflowController::class, 'index']);
            Route::put('/approvals', [ApprovalWorkflowController::class, 'update']);

            // Payroll & HR Settings
            Route::get('/payroll', [PayrollSettingsController::class, 'index']);
            Route::put('/payroll', [PayrollSettingsController::class, 'update']);

            // Fiscal Year
            Route::get('/fiscal', [FiscalYearController::class, 'index']);
            Route::put('/fiscal', [FiscalYearController::class, 'update']);

            // Notification Settings
            Route::get('/notifications', [NotificationSettingsController::class, 'index']);
            Route::put('/notifications', [NotificationSettingsController::class, 'update']);

            // SMS/WhatsApp Settings
            Route::get('/sms', [SmsSettingsController::class, 'index']);
            Route::put('/sms', [SmsSettingsController::class, 'update']);
            Route::post('/sms/test', [SmsSettingsController::class, 'testSms']);

            // Email Settings
            Route::get('/email', [EmailSettingsController::class, 'index']);
            Route::put('/email', [EmailSettingsController::class, 'update']);
            Route::post('/email/test', [EmailSettingsController::class, 'testEmail']);

            // Print & Receipt Settings
            Route::get('/print', [PrintSettingsController::class, 'index']);
            Route::put('/print', [PrintSettingsController::class, 'update']);

            // Document Templates
            Route::get('/templates', [DocumentTemplateController::class, 'index']);
            Route::put('/templates', [DocumentTemplateController::class, 'update']);

            // Credit Facility Settings
            Route::get('/credit', [CreditSettingsController::class, 'index']);
            Route::put('/credit', [CreditSettingsController::class, 'update']);

            // Credit Facility Types
            Route::get('/credit-facility-types', [CreditFacilityTypeController::class, 'index']);
            Route::post('/credit-facility-types', [CreditFacilityTypeController::class, 'store']);
            Route::get('/credit-facility-types/{creditFacilityType}', [CreditFacilityTypeController::class, 'show']);
            Route::put('/credit-facility-types/{creditFacilityType}', [CreditFacilityTypeController::class, 'update']);
            Route::delete('/credit-facility-types/{creditFacilityType}', [CreditFacilityTypeController::class, 'destroy']);
            Route::post('/credit-facility-types/{creditFacilityType}/toggle-status', [CreditFacilityTypeController::class, 'toggleStatus']);

            // Backup & Data
            Route::get('/backup', [BackupController::class, 'index']);
            Route::put('/backup', [BackupController::class, 'update']);
            Route::get('/backup/history', [BackupController::class, 'history']);
            Route::post('/backup/create', [BackupController::class, 'createBackup']);
            Route::get('/backup/download/{filename}', [BackupController::class, 'download']);
            Route::delete('/backup/{filename}', [BackupController::class, 'deleteBackup']);
            Route::post('/backup/export', [BackupController::class, 'exportData']);
            Route::post('/backup/restore', [BackupController::class, 'restore']);

            // API & Integrations
            Route::get('/api', [ApiSettingsController::class, 'index']);
            Route::put('/api', [ApiSettingsController::class, 'update']);
            Route::post('/api/rotate-key', [ApiSettingsController::class, 'rotateKey']);
        });
    });
});
