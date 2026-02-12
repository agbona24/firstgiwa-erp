<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions
        $permissions = $this->createPermissions();

        // Create roles
        $roles = $this->createRoles();

        // Assign permissions to roles
        $this->assignPermissionsToRoles($roles, $permissions);

        // Create default super admin user
        $this->createDefaultSuperAdmin($roles['super_admin']);
    }

    /**
     * Create all permissions.
     */
    protected function createPermissions(): array
    {
        $permissionsData = [
            // User management
            ['name' => 'users.view', 'display_name' => 'View Users', 'module' => Permission::MODULE_USERS],
            ['name' => 'users.create', 'display_name' => 'Create Users', 'module' => Permission::MODULE_USERS],
            ['name' => 'users.edit', 'display_name' => 'Edit Users', 'module' => Permission::MODULE_USERS],
            ['name' => 'users.delete', 'display_name' => 'Delete Users', 'module' => Permission::MODULE_USERS],
            ['name' => 'users.assign_roles', 'display_name' => 'Assign Roles', 'module' => Permission::MODULE_USERS],

            // Inventory
            ['name' => 'inventory.view', 'display_name' => 'View Inventory', 'module' => Permission::MODULE_INVENTORY],
            ['name' => 'inventory.adjust', 'display_name' => 'Adjust Inventory', 'module' => Permission::MODULE_INVENTORY],
            ['name' => 'inventory.transfer', 'display_name' => 'Transfer Stock', 'module' => Permission::MODULE_INVENTORY],
            ['name' => 'inventory.approve_adjustment', 'display_name' => 'Approve Adjustments', 'module' => Permission::MODULE_INVENTORY],

            // Products
            ['name' => 'products.view', 'display_name' => 'View Products', 'module' => Permission::MODULE_INVENTORY],
            ['name' => 'products.create', 'display_name' => 'Create Products', 'module' => Permission::MODULE_INVENTORY],
            ['name' => 'products.edit', 'display_name' => 'Edit Products', 'module' => Permission::MODULE_INVENTORY],
            ['name' => 'products.delete', 'display_name' => 'Delete Products', 'module' => Permission::MODULE_INVENTORY],

            // Categories
            ['name' => 'categories.view', 'display_name' => 'View Categories', 'module' => Permission::MODULE_INVENTORY],
            ['name' => 'categories.create', 'display_name' => 'Create Categories', 'module' => Permission::MODULE_INVENTORY],
            ['name' => 'categories.edit', 'display_name' => 'Edit Categories', 'module' => Permission::MODULE_INVENTORY],
            ['name' => 'categories.delete', 'display_name' => 'Delete Categories', 'module' => Permission::MODULE_INVENTORY],

            // Warehouses
            ['name' => 'warehouses.view', 'display_name' => 'View Warehouses', 'module' => Permission::MODULE_INVENTORY],
            ['name' => 'warehouses.create', 'display_name' => 'Create Warehouses', 'module' => Permission::MODULE_INVENTORY],
            ['name' => 'warehouses.edit', 'display_name' => 'Edit Warehouses', 'module' => Permission::MODULE_INVENTORY],
            ['name' => 'warehouses.delete', 'display_name' => 'Delete Warehouses', 'module' => Permission::MODULE_INVENTORY],

            // Sales
            ['name' => 'sales.view', 'display_name' => 'View Sales Orders', 'module' => Permission::MODULE_SALES],
            ['name' => 'sales.create', 'display_name' => 'Create Sales Orders', 'module' => Permission::MODULE_SALES],
            ['name' => 'sales.edit', 'display_name' => 'Edit Sales Orders', 'module' => Permission::MODULE_SALES],
            ['name' => 'sales.delete', 'display_name' => 'Delete Sales Orders', 'module' => Permission::MODULE_SALES],
            ['name' => 'sales.approve', 'display_name' => 'Approve Sales Orders', 'module' => Permission::MODULE_SALES],
            ['name' => 'sales.cancel', 'display_name' => 'Cancel Sales Orders', 'module' => Permission::MODULE_SALES],

            // Customers
            ['name' => 'customers.view', 'display_name' => 'View Customers', 'module' => Permission::MODULE_SALES],
            ['name' => 'customers.create', 'display_name' => 'Create Customers', 'module' => Permission::MODULE_SALES],
            ['name' => 'customers.edit', 'display_name' => 'Edit Customers', 'module' => Permission::MODULE_SALES],
            ['name' => 'customers.delete', 'display_name' => 'Delete Customers', 'module' => Permission::MODULE_SALES],
            ['name' => 'customers.manage_credit', 'display_name' => 'Manage Customer Credit', 'module' => Permission::MODULE_SALES],

            // Formulas
            ['name' => 'formulas.view', 'display_name' => 'View Formulas', 'module' => Permission::MODULE_SALES],
            ['name' => 'formulas.create', 'display_name' => 'Create Formulas', 'module' => Permission::MODULE_SALES],
            ['name' => 'formulas.edit', 'display_name' => 'Edit Formulas', 'module' => Permission::MODULE_SALES],
            ['name' => 'formulas.delete', 'display_name' => 'Delete Formulas', 'module' => Permission::MODULE_SALES],

            // Payments
            ['name' => 'payments.view', 'display_name' => 'View Payments', 'module' => Permission::MODULE_PAYMENTS],
            ['name' => 'payments.collect', 'display_name' => 'Collect Payments', 'module' => Permission::MODULE_PAYMENTS],
            ['name' => 'payments.void', 'display_name' => 'Void Payments', 'module' => Permission::MODULE_PAYMENTS],

            // Purchases
            ['name' => 'purchases.view', 'display_name' => 'View Purchase Orders', 'module' => Permission::MODULE_PURCHASES],
            ['name' => 'purchases.create', 'display_name' => 'Create Purchase Orders', 'module' => Permission::MODULE_PURCHASES],
            ['name' => 'purchases.edit', 'display_name' => 'Edit Purchase Orders', 'module' => Permission::MODULE_PURCHASES],
            ['name' => 'purchases.delete', 'display_name' => 'Delete Purchase Orders', 'module' => Permission::MODULE_PURCHASES],
            ['name' => 'purchases.approve', 'display_name' => 'Approve Purchase Orders', 'module' => Permission::MODULE_PURCHASES],
            ['name' => 'purchases.receive', 'display_name' => 'Receive Deliveries', 'module' => Permission::MODULE_PURCHASES],

            // Suppliers
            ['name' => 'suppliers.view', 'display_name' => 'View Suppliers', 'module' => Permission::MODULE_PURCHASES],
            ['name' => 'suppliers.create', 'display_name' => 'Create Suppliers', 'module' => Permission::MODULE_PURCHASES],
            ['name' => 'suppliers.edit', 'display_name' => 'Edit Suppliers', 'module' => Permission::MODULE_PURCHASES],
            ['name' => 'suppliers.delete', 'display_name' => 'Delete Suppliers', 'module' => Permission::MODULE_PURCHASES],

            // Production
            ['name' => 'production.view', 'display_name' => 'View Production Runs', 'module' => Permission::MODULE_PRODUCTION],
            ['name' => 'production.create', 'display_name' => 'Create Production Runs', 'module' => Permission::MODULE_PRODUCTION],
            ['name' => 'production.edit', 'display_name' => 'Edit Production Runs', 'module' => Permission::MODULE_PRODUCTION],
            ['name' => 'production.start', 'display_name' => 'Start Production', 'module' => Permission::MODULE_PRODUCTION],
            ['name' => 'production.complete', 'display_name' => 'Complete Production', 'module' => Permission::MODULE_PRODUCTION],
            ['name' => 'production.record_loss', 'display_name' => 'Record Production Loss', 'module' => Permission::MODULE_PRODUCTION],

            // Expenses
            ['name' => 'expenses.view', 'display_name' => 'View Expenses', 'module' => Permission::MODULE_EXPENSES],
            ['name' => 'expenses.create', 'display_name' => 'Create Expenses', 'module' => Permission::MODULE_EXPENSES],
            ['name' => 'expenses.edit', 'display_name' => 'Edit Expenses', 'module' => Permission::MODULE_EXPENSES],
            ['name' => 'expenses.delete', 'display_name' => 'Delete Expenses', 'module' => Permission::MODULE_EXPENSES],
            ['name' => 'expenses.approve', 'display_name' => 'Approve Expenses', 'module' => Permission::MODULE_EXPENSES],

            // Payroll
            ['name' => 'payroll.view', 'display_name' => 'View Payroll', 'module' => Permission::MODULE_PAYROLL],
            ['name' => 'payroll.process', 'display_name' => 'Process Payroll', 'module' => Permission::MODULE_PAYROLL],
            ['name' => 'payroll.approve', 'display_name' => 'Approve Payroll', 'module' => Permission::MODULE_PAYROLL],
            ['name' => 'staff.view', 'display_name' => 'View Staff', 'module' => Permission::MODULE_PAYROLL],
            ['name' => 'staff.create', 'display_name' => 'Create Staff', 'module' => Permission::MODULE_PAYROLL],
            ['name' => 'staff.edit', 'display_name' => 'Edit Staff', 'module' => Permission::MODULE_PAYROLL],

            // Accounting
            ['name' => 'accounting.view', 'display_name' => 'View Transactions', 'module' => Permission::MODULE_ACCOUNTING],
            ['name' => 'accounting.create', 'display_name' => 'Create Transactions', 'module' => Permission::MODULE_ACCOUNTING],
            ['name' => 'accounting.reconcile', 'display_name' => 'Reconcile Accounts', 'module' => Permission::MODULE_ACCOUNTING],

            // Reports
            ['name' => 'reports.sales', 'display_name' => 'View Sales Reports', 'module' => Permission::MODULE_REPORTS],
            ['name' => 'reports.inventory', 'display_name' => 'View Inventory Reports', 'module' => Permission::MODULE_REPORTS],
            ['name' => 'reports.financial', 'display_name' => 'View Financial Reports', 'module' => Permission::MODULE_REPORTS],
            ['name' => 'reports.pnl', 'display_name' => 'View P&L Reports', 'module' => Permission::MODULE_REPORTS],
            ['name' => 'reports.vat', 'display_name' => 'View VAT Reports', 'module' => Permission::MODULE_REPORTS],

            // Audit
            ['name' => 'audit.view', 'display_name' => 'View Audit Logs', 'module' => Permission::MODULE_SETTINGS],
            ['name' => 'audit.export', 'display_name' => 'Export Audit Logs', 'module' => Permission::MODULE_SETTINGS],

            // Settings
            ['name' => 'settings.view', 'display_name' => 'View Settings', 'module' => Permission::MODULE_SETTINGS],
            ['name' => 'settings.edit', 'display_name' => 'Edit Settings', 'module' => Permission::MODULE_SETTINGS],
        ];

        $permissions = [];
        foreach ($permissionsData as $data) {
            $permissions[$data['name']] = Permission::updateOrCreate(
                ['name' => $data['name']],
                $data
            );
        }

        return $permissions;
    }

    /**
     * Create all roles.
     */
    protected function createRoles(): array
    {
        $rolesData = [
            [
                'name' => Role::SUPER_ADMIN,
                'display_name' => 'Super Administrator',
                'description' => 'Full system access. Can do everything.',
                'is_system_role' => true,
            ],
            [
                'name' => Role::ADMIN,
                'display_name' => 'Administrator',
                'description' => 'Administrative access to most features except system settings.',
                'is_system_role' => true,
            ],
            [
                'name' => Role::BOOKING_OFFICER,
                'display_name' => 'Booking Officer',
                'description' => 'Creates sales orders/bookings. Cannot collect payments.',
                'is_system_role' => true,
            ],
            [
                'name' => Role::CASHIER,
                'display_name' => 'Cashier',
                'description' => 'Collects payments. Cannot create or modify orders.',
                'is_system_role' => true,
            ],
            [
                'name' => Role::INVENTORY_OFFICER,
                'display_name' => 'Inventory Officer',
                'description' => 'Manages inventory, stock movements, and adjustments.',
                'is_system_role' => true,
            ],
            [
                'name' => Role::PRODUCTION_OFFICER,
                'display_name' => 'Production Officer',
                'description' => 'Manages production runs, records inputs/outputs.',
                'is_system_role' => true,
            ],
            [
                'name' => Role::ACCOUNTANT,
                'display_name' => 'Accountant',
                'description' => 'Manages accounting, expenses, payroll, and financial reports.',
                'is_system_role' => true,
            ],
            [
                'name' => Role::APPROVER,
                'display_name' => 'Approver',
                'description' => 'Approves orders, expenses, and other requests requiring approval.',
                'is_system_role' => true,
            ],
            [
                'name' => Role::AUDITOR,
                'display_name' => 'Auditor',
                'description' => 'Read-only access to all data and audit logs for compliance.',
                'is_system_role' => true,
            ],
        ];

        $roles = [];
        foreach ($rolesData as $data) {
            $roles[$data['name']] = Role::updateOrCreate(
                ['name' => $data['name']],
                $data
            );
        }

        return $roles;
    }

    /**
     * Assign permissions to roles based on their responsibilities.
     */
    protected function assignPermissionsToRoles(array $roles, array $permissions): void
    {
        // Admin gets almost everything except settings.edit
        $adminPermissions = collect($permissions)->keys()->filter(function ($key) {
            return !str_starts_with($key, 'settings.edit') && $key !== 'audit.export';
        })->toArray();
        $roles[Role::ADMIN]->permissions()->sync(
            collect($adminPermissions)->map(fn ($name) => $permissions[$name]->id)->toArray()
        );

        // Booking Officer
        $roles[Role::BOOKING_OFFICER]->permissions()->sync([
            $permissions['sales.view']->id,
            $permissions['sales.create']->id,
            $permissions['sales.edit']->id,
            $permissions['customers.view']->id,
            $permissions['customers.create']->id,
            $permissions['customers.edit']->id,
            $permissions['formulas.view']->id,
            $permissions['formulas.create']->id,
            $permissions['formulas.edit']->id,
            $permissions['products.view']->id,
            $permissions['inventory.view']->id,
        ]);

        // Cashier
        $roles[Role::CASHIER]->permissions()->sync([
            $permissions['payments.view']->id,
            $permissions['payments.collect']->id,
            $permissions['sales.view']->id,
            $permissions['customers.view']->id,
        ]);

        // Inventory Officer
        $roles[Role::INVENTORY_OFFICER]->permissions()->sync([
            $permissions['inventory.view']->id,
            $permissions['inventory.adjust']->id,
            $permissions['inventory.transfer']->id,
            $permissions['products.view']->id,
            $permissions['products.create']->id,
            $permissions['products.edit']->id,
            $permissions['categories.view']->id,
            $permissions['categories.create']->id,
            $permissions['categories.edit']->id,
            $permissions['warehouses.view']->id,
            $permissions['warehouses.create']->id,
            $permissions['warehouses.edit']->id,
            $permissions['purchases.receive']->id,
            $permissions['reports.inventory']->id,
        ]);

        // Production Officer
        $roles[Role::PRODUCTION_OFFICER]->permissions()->sync([
            $permissions['production.view']->id,
            $permissions['production.create']->id,
            $permissions['production.edit']->id,
            $permissions['production.start']->id,
            $permissions['production.complete']->id,
            $permissions['production.record_loss']->id,
            $permissions['inventory.view']->id,
            $permissions['products.view']->id,
            $permissions['formulas.view']->id,
        ]);

        // Accountant
        $roles[Role::ACCOUNTANT]->permissions()->sync([
            $permissions['accounting.view']->id,
            $permissions['accounting.create']->id,
            $permissions['accounting.reconcile']->id,
            $permissions['expenses.view']->id,
            $permissions['expenses.create']->id,
            $permissions['expenses.edit']->id,
            $permissions['payroll.view']->id,
            $permissions['payroll.process']->id,
            $permissions['staff.view']->id,
            $permissions['staff.create']->id,
            $permissions['staff.edit']->id,
            $permissions['payments.view']->id,
            $permissions['sales.view']->id,
            $permissions['purchases.view']->id,
            $permissions['reports.sales']->id,
            $permissions['reports.inventory']->id,
            $permissions['reports.financial']->id,
            $permissions['reports.pnl']->id,
            $permissions['reports.vat']->id,
        ]);

        // Approver
        $roles[Role::APPROVER]->permissions()->sync([
            $permissions['sales.view']->id,
            $permissions['sales.approve']->id,
            $permissions['purchases.view']->id,
            $permissions['purchases.approve']->id,
            $permissions['expenses.view']->id,
            $permissions['expenses.approve']->id,
            $permissions['payroll.view']->id,
            $permissions['payroll.approve']->id,
            $permissions['inventory.view']->id,
            $permissions['inventory.approve_adjustment']->id,
            $permissions['customers.view']->id,
            $permissions['customers.manage_credit']->id,
        ]);

        // Auditor (read-only access to everything)
        $auditorPermissions = collect($permissions)->keys()->filter(function ($key) {
            return str_contains($key, '.view') || str_starts_with($key, 'audit.') || str_starts_with($key, 'reports.');
        })->toArray();
        $roles[Role::AUDITOR]->permissions()->sync(
            collect($auditorPermissions)->map(fn ($name) => $permissions[$name]->id)->toArray()
        );
    }

    /**
     * Create the default super admin user.
     */
    protected function createDefaultSuperAdmin(Role $superAdminRole): void
    {
        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@firstgiwa.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'phone' => '+234 800 000 0000',
                'department' => 'Administration',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $superAdmin->assignRole($superAdminRole);
    }
}
