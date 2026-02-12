<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SpatiePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define all permissions by module
        $permissions = [
            // Dashboard
            'dashboard.view' => 'View Dashboard',
            
            // Inventory Management
            'inventory.view' => 'View Inventory',
            'inventory.create' => 'Create Inventory Records',
            'inventory.update' => 'Update Inventory',
            'inventory.delete' => 'Delete Inventory',
            'inventory.adjust' => 'Adjust Stock Levels',
            'inventory.transfer' => 'Transfer Stock Between Warehouses',
            'inventory.approve_adjustment' => 'Approve Stock Adjustments',
            
            // Products
            'products.view' => 'View Products',
            'products.create' => 'Create Products',
            'products.update' => 'Update Products',
            'products.delete' => 'Delete Products',
            
            // Categories
            'categories.view' => 'View Categories',
            'categories.create' => 'Create Categories',
            'categories.update' => 'Update Categories',
            'categories.delete' => 'Delete Categories',
            
            // Warehouses
            'warehouses.view' => 'View Warehouses',
            'warehouses.create' => 'Create Warehouses',
            'warehouses.update' => 'Update Warehouses',
            'warehouses.delete' => 'Delete Warehouses',
            
            // Sales Orders
            'sales.view' => 'View Sales Orders',
            'sales.create' => 'Create Sales Orders',
            'sales.update' => 'Update Sales Orders',
            'sales.delete' => 'Delete Sales Orders',
            'sales.approve' => 'Approve Sales Orders',
            'sales.cancel' => 'Cancel Sales Orders',
            
            // Purchase Orders
            'purchases.view' => 'View Purchase Orders',
            'purchases.create' => 'Create Purchase Orders',
            'purchases.update' => 'Update Purchase Orders',
            'purchases.delete' => 'Delete Purchase Orders',
            'purchases.approve' => 'Approve Purchase Orders',
            'purchases.receive' => 'Receive Purchase Orders',
            
            // Customers
            'customers.view' => 'View Customers',
            'customers.create' => 'Create Customers',
            'customers.update' => 'Update Customers',
            'customers.delete' => 'Delete Customers',
            'customers.manage_credit' => 'Manage Customer Credit',
            
            // Suppliers
            'suppliers.view' => 'View Suppliers',
            'suppliers.create' => 'Create Suppliers',
            'suppliers.update' => 'Update Suppliers',
            'suppliers.delete' => 'Delete Suppliers',
            
            // Payments
            'payments.view' => 'View Payments',
            'payments.create' => 'Record Payments',
            'payments.update' => 'Update Payments',
            'payments.delete' => 'Delete Payments',
            'payments.reconcile' => 'Reconcile Payments',
            'payments.void' => 'Void Payments',
            
            // Expenses
            'expenses.view' => 'View Expenses',
            'expenses.create' => 'Create Expenses',
            'expenses.update' => 'Update Expenses',
            'expenses.delete' => 'Delete Expenses',
            'expenses.approve' => 'Approve Expenses',
            
            // Production
            'production.view' => 'View Production',
            'production.create' => 'Create Production Runs',
            'production.update' => 'Update Production Runs',
            'production.delete' => 'Delete Production Runs',
            'production.complete' => 'Complete Production Runs',
            
            // Formulas
            'formulas.view' => 'View Formulas',
            'formulas.create' => 'Create Formulas',
            'formulas.update' => 'Update Formulas',
            'formulas.delete' => 'Delete Formulas',
            
            // POS
            'pos.access' => 'Access POS System',
            'pos.refund' => 'Process POS Refunds',
            'pos.discount' => 'Apply POS Discounts',
            
            // Staff/HR
            'staff.view' => 'View Staff',
            'staff.create' => 'Create Staff',
            'staff.update' => 'Update Staff',
            'staff.delete' => 'Delete Staff',
            
            // Payroll
            'payroll.view' => 'View Payroll',
            'payroll.create' => 'Create Payroll Runs',
            'payroll.approve' => 'Approve Payroll',
            'payroll.process' => 'Process Payroll Payments',
            
            // Reports
            'reports.view' => 'View Reports',
            'reports.export' => 'Export Reports',
            'reports.financial' => 'View Financial Reports',
            
            // Settings & Administration
            'settings.view' => 'View Settings',
            'settings.update' => 'Update Settings',
            'users.view' => 'View Users',
            'users.create' => 'Create Users',
            'users.update' => 'Update Users',
            'users.delete' => 'Delete Users',
            'roles.view' => 'View Roles',
            'roles.create' => 'Create Roles',
            'roles.update' => 'Update Roles',
            'roles.delete' => 'Delete Roles',
            'roles.assign' => 'Assign Roles to Users',
            
            // Audit
            'audit.view' => 'View Audit Logs',
        ];

        // Create permissions
        foreach ($permissions as $name => $displayName) {
            Permission::create(['name' => $name, 'guard_name' => 'web']);
        }

        // Create roles and assign permissions
        
        // Super Admin - has all permissions via gate
        $superAdmin = Role::create(['name' => 'Super Admin', 'guard_name' => 'web']);
        $superAdmin->givePermissionTo(Permission::all());

        // Admin - almost all permissions except some system ones
        $admin = Role::create(['name' => 'Admin', 'guard_name' => 'web']);
        $admin->givePermissionTo([
            'dashboard.view',
            'inventory.view', 'inventory.create', 'inventory.update', 'inventory.adjust', 'inventory.transfer', 'inventory.approve_adjustment',
            'products.view', 'products.create', 'products.update', 'products.delete',
            'categories.view', 'categories.create', 'categories.update', 'categories.delete',
            'warehouses.view', 'warehouses.create', 'warehouses.update',
            'sales.view', 'sales.create', 'sales.update', 'sales.approve', 'sales.cancel',
            'purchases.view', 'purchases.create', 'purchases.update', 'purchases.approve', 'purchases.receive',
            'customers.view', 'customers.create', 'customers.update', 'customers.manage_credit',
            'suppliers.view', 'suppliers.create', 'suppliers.update',
            'payments.view', 'payments.create', 'payments.update', 'payments.reconcile',
            'expenses.view', 'expenses.create', 'expenses.update', 'expenses.approve',
            'production.view', 'production.create', 'production.update', 'production.complete',
            'formulas.view', 'formulas.create', 'formulas.update',
            'pos.access', 'pos.refund', 'pos.discount',
            'staff.view', 'staff.create', 'staff.update',
            'payroll.view', 'payroll.create', 'payroll.approve',
            'reports.view', 'reports.export', 'reports.financial',
            'settings.view', 'settings.update',
            'users.view', 'users.create', 'users.update',
            'roles.view', 'roles.assign',
            'audit.view',
        ]);

        // Manager
        $manager = Role::create(['name' => 'Manager', 'guard_name' => 'web']);
        $manager->givePermissionTo([
            'dashboard.view',
            'inventory.view', 'inventory.create', 'inventory.update', 'inventory.adjust', 'inventory.transfer',
            'products.view', 'products.create', 'products.update',
            'categories.view',
            'warehouses.view',
            'sales.view', 'sales.create', 'sales.update', 'sales.approve',
            'purchases.view', 'purchases.create', 'purchases.update', 'purchases.approve', 'purchases.receive',
            'customers.view', 'customers.create', 'customers.update', 'customers.manage_credit',
            'suppliers.view', 'suppliers.create', 'suppliers.update',
            'payments.view', 'payments.create',
            'expenses.view', 'expenses.create', 'expenses.approve',
            'production.view', 'production.create', 'production.update', 'production.complete',
            'formulas.view',
            'staff.view',
            'reports.view', 'reports.export',
        ]);

        // Sales Manager
        $salesManager = Role::create(['name' => 'Sales Manager', 'guard_name' => 'web']);
        $salesManager->givePermissionTo([
            'dashboard.view',
            'inventory.view',
            'products.view',
            'sales.view', 'sales.create', 'sales.update', 'sales.approve', 'sales.cancel',
            'customers.view', 'customers.create', 'customers.update', 'customers.manage_credit',
            'payments.view', 'payments.create',
            'pos.access', 'pos.refund', 'pos.discount',
            'reports.view', 'reports.export',
        ]);

        // Purchase Manager
        $purchaseManager = Role::create(['name' => 'Purchase Manager', 'guard_name' => 'web']);
        $purchaseManager->givePermissionTo([
            'dashboard.view',
            'inventory.view',
            'products.view',
            'purchases.view', 'purchases.create', 'purchases.update', 'purchases.approve', 'purchases.receive',
            'suppliers.view', 'suppliers.create', 'suppliers.update',
            'reports.view', 'reports.export',
        ]);

        // Accountant
        $accountant = Role::create(['name' => 'Accountant', 'guard_name' => 'web']);
        $accountant->givePermissionTo([
            'dashboard.view',
            'sales.view',
            'purchases.view',
            'payments.view', 'payments.create', 'payments.update', 'payments.reconcile',
            'expenses.view', 'expenses.create', 'expenses.update',
            'payroll.view', 'payroll.create',
            'reports.view', 'reports.export', 'reports.financial',
            'customers.view',
            'suppliers.view',
        ]);

        // Cashier
        $cashier = Role::create(['name' => 'Cashier', 'guard_name' => 'web']);
        $cashier->givePermissionTo([
            'dashboard.view',
            'pos.access',
            'payments.view', 'payments.create',
            'sales.view', 'sales.create',
            'customers.view',
            'products.view',
            'inventory.view',
        ]);

        // Warehouse Staff
        $warehouseStaff = Role::create(['name' => 'Warehouse Staff', 'guard_name' => 'web']);
        $warehouseStaff->givePermissionTo([
            'dashboard.view',
            'inventory.view', 'inventory.create', 'inventory.update', 'inventory.adjust', 'inventory.transfer',
            'products.view',
            'warehouses.view',
            'purchases.view', 'purchases.receive',
        ]);

        // Sales Staff
        $salesStaff = Role::create(['name' => 'Sales Staff', 'guard_name' => 'web']);
        $salesStaff->givePermissionTo([
            'dashboard.view',
            'sales.view', 'sales.create',
            'customers.view', 'customers.create',
            'products.view',
            'inventory.view',
            'payments.view', 'payments.create',
        ]);

        // Production Staff
        $productionStaff = Role::create(['name' => 'Production Staff', 'guard_name' => 'web']);
        $productionStaff->givePermissionTo([
            'dashboard.view',
            'production.view', 'production.create', 'production.update',
            'formulas.view',
            'inventory.view',
            'products.view',
        ]);

        // HR Manager
        $hrManager = Role::create(['name' => 'HR Manager', 'guard_name' => 'web']);
        $hrManager->givePermissionTo([
            'dashboard.view',
            'staff.view', 'staff.create', 'staff.update', 'staff.delete',
            'payroll.view', 'payroll.create', 'payroll.approve', 'payroll.process',
            'reports.view',
        ]);

        // Auditor (Read-only)
        $auditor = Role::create(['name' => 'Auditor', 'guard_name' => 'web']);
        $auditor->givePermissionTo([
            'dashboard.view',
            'inventory.view',
            'products.view',
            'categories.view',
            'warehouses.view',
            'sales.view',
            'purchases.view',
            'customers.view',
            'suppliers.view',
            'payments.view',
            'expenses.view',
            'production.view',
            'formulas.view',
            'staff.view',
            'payroll.view',
            'reports.view', 'reports.export', 'reports.financial',
            'audit.view',
        ]);

        // Assign Super Admin role to admin user
        $adminUser = User::where('email', 'admin@firstgiwa.com')->first();
        if ($adminUser) {
            $adminUser->assignRole('Super Admin');
        }

        // Create additional test users with different roles
        $testUsers = [
            [
                'name' => 'Amina Yusuf',
                'email' => 'amina@firstgiwa.com',
                'password' => Hash::make('password'),
                'phone' => '08012345002',
                'department' => 'Finance',
                'status' => 'active',
                'tenant_id' => 1,
                'branch_id' => 1,
                'role' => 'Accountant',
            ],
            [
                'name' => 'Musa Ibrahim',
                'email' => 'musa@firstgiwa.com',
                'password' => Hash::make('password'),
                'phone' => '08012345003',
                'department' => 'Production',
                'status' => 'active',
                'tenant_id' => 1,
                'branch_id' => 1,
                'role' => 'Production Staff',
            ],
            [
                'name' => 'Grace Okonkwo',
                'email' => 'grace@firstgiwa.com',
                'password' => Hash::make('password'),
                'phone' => '08012345004',
                'department' => 'Sales',
                'status' => 'active',
                'tenant_id' => 1,
                'branch_id' => 1,
                'role' => 'Sales Manager',
            ],
            [
                'name' => 'Chidi Eze',
                'email' => 'chidi@firstgiwa.com',
                'password' => Hash::make('password'),
                'phone' => '08012345005',
                'department' => 'Sales',
                'status' => 'active',
                'tenant_id' => 1,
                'branch_id' => 1,
                'role' => 'Cashier',
            ],
            [
                'name' => 'Bola Tinubu',
                'email' => 'bola@firstgiwa.com',
                'password' => Hash::make('password'),
                'phone' => '08012345006',
                'department' => 'Warehouse',
                'status' => 'active',
                'tenant_id' => 1,
                'branch_id' => 1,
                'role' => 'Warehouse Staff',
            ],
            [
                'name' => 'Fatima Abdullahi',
                'email' => 'fatima@firstgiwa.com',
                'password' => Hash::make('password'),
                'phone' => '08012345007',
                'department' => 'HR',
                'status' => 'active',
                'tenant_id' => 1,
                'branch_id' => 1,
                'role' => 'HR Manager',
            ],
            [
                'name' => 'Audit User',
                'email' => 'auditor@firstgiwa.com',
                'password' => Hash::make('password'),
                'phone' => '08012345008',
                'department' => 'Audit',
                'status' => 'active',
                'tenant_id' => 1,
                'branch_id' => 1,
                'role' => 'Auditor',
            ],
        ];

        foreach ($testUsers as $userData) {
            $role = $userData['role'];
            unset($userData['role']);
            
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
            $user->assignRole($role);
        }

        $this->command->info('Spatie permissions and roles seeded successfully!');
        $this->command->info('Created ' . Permission::count() . ' permissions');
        $this->command->info('Created ' . Role::count() . ' roles');
    }
}
