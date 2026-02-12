<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $guardName = 'web';

        // Create Permissions
        $permissions = [
            // Inventory
            'inventory.view',
            'inventory.create',
            'inventory.adjust',
            'inventory.approve',
            // Sales
            'sales.view',
            'sales.create',
            'sales.approve',
            // Purchases
            'purchases.view',
            'purchases.create',
            'purchases.approve',
            // Payments
            'payments.view',
            'payments.create',
            'payments.reconcile',
            // POS
            'pos.access',
            // Reports
            'reports.view',
            'reports.export',
            // Users
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            // Settings
            'settings.view',
            'settings.edit',
            // Production
            'production.view',
            'production.create',
            'production.approve',
            // Expenses
            'expenses.view',
            'expenses.create',
            'expenses.approve',
            // Payroll
            'payroll.view',
            'payroll.create',
            'payroll.approve',
            // Audit
            'audit.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => $guardName,
            ]);
        }

        // Create Roles and assign permissions
        $rolePermissions = [
            'Super Admin' => $permissions, // All permissions
            'Admin' => $permissions, // All permissions
            'Manager' => [
                'inventory.view', 'inventory.create', 'inventory.adjust',
                'sales.view', 'sales.create', 'sales.approve',
                'purchases.view', 'purchases.create',
                'payments.view', 'payments.create',
                'pos.access',
                'reports.view', 'reports.export',
                'production.view', 'production.create', 'production.approve',
                'expenses.view', 'expenses.create',
            ],
            'Sales Manager' => [
                'inventory.view',
                'sales.view', 'sales.create', 'sales.approve',
                'payments.view', 'payments.create',
                'pos.access',
                'reports.view',
            ],
            'Purchase Manager' => [
                'inventory.view', 'inventory.create',
                'purchases.view', 'purchases.create', 'purchases.approve',
                'payments.view',
                'reports.view',
            ],
            'Accountant' => [
                'inventory.view',
                'sales.view',
                'purchases.view',
                'payments.view', 'payments.create', 'payments.reconcile',
                'reports.view', 'reports.export',
                'expenses.view', 'expenses.create', 'expenses.approve',
                'payroll.view', 'payroll.create', 'payroll.approve',
            ],
            'Cashier' => [
                'sales.view', 'sales.create',
                'payments.view', 'payments.create',
                'pos.access',
            ],
            'Warehouse Staff' => [
                'inventory.view', 'inventory.create', 'inventory.adjust',
                'purchases.view',
                'production.view',
            ],
            'Sales Staff' => [
                'inventory.view',
                'sales.view', 'sales.create',
                'pos.access',
            ],
        ];

        foreach ($rolePermissions as $roleName => $perms) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => $guardName,
            ]);
            $role->syncPermissions($perms);
        }
    }
}
