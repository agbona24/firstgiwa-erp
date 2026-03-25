<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Branch;
use App\Models\Warehouse;
use App\Models\Department;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Setting;
use App\Models\BankAccount;
use App\Services\IndustryTemplateSeeder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class SetupController extends Controller
{
    /**
     * Check if system setup has been completed
     */
    public function checkStatus(): JsonResponse
    {
        // Check if app is installed
        $appInstalled = config('app.installed');

        if (!$appInstalled) {
            return response()->json([
                'success' => true,
                'setup_complete' => false,
                'needs_install' => true, // Frontend should redirect to /install
                'tenant' => null,
            ]);
        }
        
        // App is installed, check if setup (onboarding) is complete
        $tenant = Tenant::first();
        $setupComplete = $tenant && User::where('tenant_id', $tenant->id)->exists();

        return response()->json([
            'success' => true,
            'setup_complete' => $setupComplete,
            'needs_install' => false,
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
            ] : null,
        ]);
    }

    /**
     * Get the industry template registry (categories and subcategories).
     */
    public function getIndustryRegistry(): JsonResponse
    {
        return response()->json(IndustryTemplateSeeder::getRegistry());
    }

    /**
     * Get a specific industry template preview for the frontend wizard.
     */
    public function getIndustryTemplate(string $key): JsonResponse
    {
        $preview = IndustryTemplateSeeder::getTemplatePreview($key);

        if (!$preview) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        return response()->json($preview);
    }

    /**
     * Complete initial system setup
     */
    public function completeSetup(Request $request): JsonResponse
    {
        // Guard: prevent re-running setup only when a fully configured tenant exists
        // (both a tenant row AND at least one admin user).
        // If orphaned tenants exist (tenant but no user, from a failed previous attempt),
        // clean ALL of them up so the setup can proceed fresh.
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        $tenantTables = DB::select(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'tenant_id'
             ORDER BY TABLE_NAME"
        );
        foreach (Tenant::all() as $existingTenant) {
            $hasAdminUser = User::where('tenant_id', $existingTenant->id)->exists();
            if ($hasAdminUser) {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
                return response()->json([
                    'success' => false,
                    'already_onboarded' => true,
                    'message' => 'This system has already been configured. Please log in.',
                ], 409);
            }
            // No user for this tenant — orphan from a failed setup. Clean it up.
            Log::info('Cleaning up orphaned tenant from failed setup.', ['tenant_id' => $existingTenant->id]);
            foreach ($tenantTables as $table) {
                DB::table($table->TABLE_NAME)->where('tenant_id', $existingTenant->id)->delete();
            }
            DB::table('tenants')->where('id', $existingTenant->id)->delete();
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $validated = $request->validate([
            // Company Info (frontend sends 'name' not 'companyName')
            'company.name' => 'required|string|max:255',
            'company.tax_id' => 'nullable|string|max:50',
            'company.phone' => 'nullable|string|max:20',
            'company.email' => 'nullable|email|max:255',
            'company.address' => 'nullable|string|max:500',
            
            // Business Config (frontend sends snake_case)
            'business.currency' => 'required|string|in:NGN,USD,GBP,EUR',
            'business.vat_rate' => 'nullable|numeric|min:0|max:100',
            'business.fiscal_year_start' => 'nullable|string',
            'business.date_format' => 'nullable|string',
            'business.number_format' => 'nullable|string',
            'business.approval_threshold' => 'nullable|numeric|min:0',
            
            // Warehouses/Locations
            'warehouses' => 'nullable|array',
            'warehouses.*.name' => 'required|string|max:255',
            'warehouses.*.address' => 'nullable|string|max:500',
            'warehouses.*.type' => 'required|string|in:Factory,Warehouse,Office',
            
            // Departments (frontend sends objects with name/code)
            'departments' => 'nullable|array',
            'departments.*.name' => 'required|string|max:100',
            'departments.*.code' => 'nullable|string|max:20',
            
            // Products (frontend nests under products)
            'products.categories' => 'nullable|array',
            'products.categories.*' => 'string|max:100',
            'products.units' => 'nullable|array',
            'products.units.*.name' => 'required|string|max:50',
            'products.units.*.abbreviation' => 'nullable|string|max:20',
            'products.default_items' => 'nullable|array',
            'products.default_items.*' => 'string|max:150',
            
            // Industry Selection
            'industry_category' => 'nullable|string|max:50',
            'industry_subcategory' => 'nullable|string|max:50',

            // Admin Account
            'admin.name' => 'required|string|max:255',
            'admin.email' => 'required|email|max:255|unique:users,email',
            'admin.password' => 'required|string|min:8',
            'admin.phone' => 'nullable|string|max:20',
        ]);

        DB::beginTransaction();
        try {
            // 1. Create Tenant
            $tenant = Tenant::create([
                'name' => $validated['company']['name'],
                'slug' => $this->generateTenantSlug($validated['company']['name']),
                'email' => $validated['company']['email'] ?? null,
                'phone' => $validated['company']['phone'] ?? null,
                'address' => $validated['company']['address'] ?? null,
                'industry_category' => $validated['industry_category'] ?? null,
                'industry_subcategory' => $validated['industry_subcategory'] ?? null,
                'is_active' => true,
            ]);

            // 2. Create default branch
            $mainBranch = Branch::create([
                'tenant_id' => $tenant->id,
                'name' => 'Head Office',
                'branch_code' => 'HQ', // Unique per tenant now
                'address' => $validated['company']['address'] ?? null,
                'phone' => $validated['company']['phone'] ?? null,
                'is_main_branch' => true,
                'is_active' => true,
            ]);

            // 3. Resolve industry template
            $templateKey = IndustryTemplateSeeder::resolveTemplateKey(
                $validated['industry_category'] ?? null,
                $validated['industry_subcategory'] ?? null
            );

            $defaultWarehouseId = null;

            if ($templateKey) {
                // Use industry template seeder — creates categories, units,
                // products (with prices), warehouses, departments
                $seeder = new IndustryTemplateSeeder();
                $seedResult = $seeder->seed($tenant->id, $mainBranch->id, $templateKey);

                // Get the first warehouse ID for settings
                $firstWarehouse = Warehouse::where('tenant_id', $tenant->id)->first();
                $defaultWarehouseId = $firstWarehouse?->id;
            } else {
                // No template — use wizard data (existing behavior)

                // Create Warehouses
                $warehouses = $validated['warehouses'] ?? [];

                if (empty($warehouses)) {
                    $warehouse = Warehouse::create([
                        'tenant_id' => $tenant->id,
                        'branch_id' => $mainBranch->id,
                        'name' => 'Main Warehouse',
                        'code' => 'WH-' . $tenant->id . '-MAIN',
                        'address' => $validated['company']['address'] ?? null,
                        'is_active' => true,
                    ]);
                    $defaultWarehouseId = $warehouse->id;
                } else {
                    foreach ($warehouses as $idx => $wh) {
                        $warehouse = Warehouse::create([
                            'tenant_id' => $tenant->id,
                            'branch_id' => $mainBranch->id,
                            'name' => $wh['name'],
                            'code' => 'WH-' . $tenant->id . '-' . str_pad($idx + 1, 3, '0', STR_PAD_LEFT),
                            'address' => $wh['address'] ?? null,
                            'location' => $wh['type'] ?? null,
                            'is_active' => true,
                        ]);

                        if ($idx === 0) {
                            $defaultWarehouseId = $warehouse->id;
                        }
                    }
                }

                // Create Departments
                $departments = $validated['departments'] ?? [['name' => 'Management'], ['name' => 'Operations'], ['name' => 'Finance']];
                foreach ($departments as $dept) {
                    $deptName = is_array($dept) ? ($dept['name'] ?? '') : $dept;
                    if (trim($deptName)) {
                        Department::create([
                            'tenant_id' => $tenant->id,
                            'name' => $deptName,
                            'is_active' => true,
                        ]);
                    }
                }

                // Create Categories
                $categories = $validated['products']['categories'] ?? ['General'];
                foreach ($categories as $idx => $catName) {
                    if (trim($catName)) {
                        $code = strtoupper(preg_replace('/[^A-Za-z]/', '', $catName));
                        $code = substr($code, 0, 6) . '-' . $tenant->id . '-' . ($idx + 1);

                        Category::create([
                            'tenant_id' => $tenant->id,
                            'name' => $catName,
                            'code' => $code,
                            'description' => null,
                            'is_active' => true,
                        ]);
                    }
                }

                // Create Units
                $units = $validated['products']['units'] ?? [
                    ['name' => 'Kilogram', 'abbreviation' => 'kg'],
                    ['name' => 'Piece', 'abbreviation' => 'pcs'],
                ];
                foreach ($units as $unit) {
                    Unit::create([
                        'tenant_id' => $tenant->id,
                        'name' => $unit['name'],
                        'abbreviation' => $unit['abbreviation'] ?? strtolower(substr($unit['name'], 0, 3)),
                        'is_base_unit' => false,
                    ]);
                }

                // Seed default products
                $this->seedDefaultProducts(
                    $tenant->id,
                    $defaultWarehouseId,
                    $validated['products']['default_items'] ?? null
                );
            }

            // 8. Create Admin User
            $admin = User::create([
                'tenant_id' => $tenant->id,
                'branch_id' => $mainBranch->id,
                'name' => $validated['admin']['name'],
                'email' => $validated['admin']['email'],
                'password' => Hash::make($validated['admin']['password']),
                'phone' => $validated['admin']['phone'] ?? null,
                'status' => 'active',
            ]);

            // Assign super-admin role
            $admin->assignRole('Super Admin');

            // 9. Save Company Settings
            $businessSettings = $validated['business'] ?? [];
            $settingsToSave = [
                'general' => [
                    'company_name' => $validated['company']['name'],
                    'company_email' => $validated['company']['email'] ?? '',
                    'company_phone' => $validated['company']['phone'] ?? '',
                    'company_address' => $validated['company']['address'] ?? '',
                    'rc_number' => $validated['company']['tax_id'] ?? '',
                    'currency' => $businessSettings['currency'] ?? 'NGN',
                    'currency_symbol' => $this->getCurrencySymbol($businessSettings['currency'] ?? 'NGN'),
                    'date_format' => $businessSettings['date_format'] ?? 'DD/MM/YYYY',
                    'fiscal_year_start' => $businessSettings['fiscal_year_start'] ?? 'January',
                ],
                'finance' => [
                    'default_tax_rate' => $businessSettings['vat_rate'] ?? 7.5,
                ],
                'approvals' => [
                    'expense_threshold' => $businessSettings['approval_threshold'] ?? 100000,
                    'sales_order_threshold' => $businessSettings['approval_threshold'] ?? 1000000,
                    'purchase_order_threshold' => $businessSettings['approval_threshold'] ?? 500000,
                ],
            ];

            foreach ($settingsToSave as $group => $settings) {
                foreach ($settings as $key => $value) {
                    Setting::set($group, $key, $value, $tenant->id);
                }
            }

            // Mark setup as complete
            Setting::set('system', 'setup_complete', true, $tenant->id);
            Setting::set('system', 'setup_date', now()->toISOString(), $tenant->id);

            DB::commit();

            // Generate auth token for admin
            $token = $admin->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Setup completed successfully! Welcome to FactoryPulse.',
                'data' => [
                    'tenant' => $tenant,
                    'user' => $admin->load('roles'),
                    'branch' => $mainBranch,
                    'token' => $token,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Setup failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Setup failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate tenant slug from company name
     */
    private function generateTenantSlug(string $name): string
    {
        $slug = strtolower(preg_replace('/[^A-Za-z0-9\s-]/', '', $name));
        $slug = preg_replace('/[\s]+/', '-', trim($slug));
        
        // Ensure uniqueness
        $baseSlug = $slug;
        $counter = 1;
        while (Tenant::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }

    /**
     * Get currency symbol
     */
    private function getCurrencySymbol(string $currency): string
    {
        return match($currency) {
            'NGN' => '₦',
            'USD' => '$',
            'GBP' => '£',
            'EUR' => '€',
            default => '₦',
        };
    }

    /**
     * Seed default products during setup so users can start immediately.
     */
    private function seedDefaultProducts(int $tenantId, ?int $warehouseId = null, ?array $customItems = null): void
    {
        $category = Category::firstOrCreate(
            ['code' => 'RAW-' . $tenantId],
            [
                'tenant_id' => $tenantId,
                'name' => 'Raw Materials',
                'description' => 'Default setup raw materials',
                'is_active' => true,
            ]
        );

        $defaultItems = [
            'Fish meal',
            'Poultry meal',
            'Meat meal',
            'Feather meal',
            'GNC',
            'Soya meal',
            'Roshela',
            'Wheat offal',
            'PKC',
            'Rice bran',
            'Wheat flour',
            'Soya oil',
            'Creeps',
            'Cassava flour',
            'Local bloodmeal',
            'Palamu',
            'Cassava peel',
            'Bone meal',
            'Concentrate premix',
            'Champremix',
            'Vitamin C',
            'Lysine',
            'Enzymes',
            'Bio-vit',
            'Toxin binder',
            'Salt',
            'Venor',
            'Vitranor',
            'Garri',
            'Imported Bloodmeal',
            'Fishmeal 72%',
        ];

        $items = collect($customItems ?? $defaultItems)
            ->map(fn ($item) => trim((string) $item))
            ->filter(fn ($item) => $item !== '')
            ->unique()
            ->values()
            ->all();

        foreach ($items as $index => $name) {
            $existingProduct = DB::table('products')
                ->where('tenant_id', $tenantId)
                ->where('name', $name)
                ->first();

            $payload = [
                'sku' => sprintf('RM-%d-%03d', $tenantId, $index + 1),
                'category_id' => $category->id,
                'inventory_type' => 'raw_material',
                'unit_of_measure' => str_contains(strtolower($name), 'oil') ? 'litres' : 'kg',
                'cost_price' => 0,
                'selling_price' => 0,
                'reorder_level' => 0,
                'critical_level' => 0,
                'is_active' => true,
                'track_inventory' => true,
                'updated_at' => now(),
            ];

            if ($existingProduct) {
                DB::table('products')->where('id', $existingProduct->id)->update($payload);
                $productId = $existingProduct->id;
            } else {
                $productId = DB::table('products')->insertGetId([
                    'tenant_id' => $tenantId,
                    'name' => $name,
                    ...$payload,
                    'created_at' => now(),
                ]);
            }

            if ($warehouseId) {
                $existingInventory = DB::table('inventory')
                    ->where('product_id', $productId)
                    ->where('warehouse_id', $warehouseId)
                    ->first();

                if ($existingInventory) {
                    DB::table('inventory')
                        ->where('id', $existingInventory->id)
                        ->update([
                            'tenant_id' => $tenantId,
                            'updated_at' => now(),
                        ]);
                } else {
                    DB::table('inventory')->insert([
                        'product_id' => $productId,
                        'warehouse_id' => $warehouseId,
                        'tenant_id' => $tenantId,
                        'quantity' => 0,
                        'reserved_quantity' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    /**
     * Reset the system to factory default (wipe tenant data, return to setup).
     * Requires authentication and Super Admin role.
     */
    public function resetSetup(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (!$user->hasRole('Super Admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Only a Super Admin can reset the application.',
            ], 403);
        }

        $allTenants = Tenant::all();

        if ($allTenants->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant found. Already in factory state.',
            ], 404);
        }

        try {
            // Collect ALL user IDs across ALL tenants for token cleanup
            $allTenantIds = $allTenants->pluck('id')->toArray();
            $userIds = DB::table('users')->whereIn('tenant_id', $allTenantIds)->pluck('id')->toArray();

            // Revoke all personal access tokens for all tenant users
            if (!empty($userIds)) {
                DB::table('personal_access_tokens')
                    ->where('tokenable_type', 'App\\Models\\User')
                    ->whereIn('tokenable_id', $userIds)
                    ->delete();
            }

            // Dynamically discover all tables with a tenant_id column and
            // delete ALL tenant rows from each, then truncate tenants table.
            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            $tables = DB::select(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'tenant_id'
                 ORDER BY TABLE_NAME"
            );

            foreach ($tables as $table) {
                DB::table($table->TABLE_NAME)->whereIn('tenant_id', $allTenantIds)->delete();
            }

            // Delete all tenants
            DB::table('tenants')->whereIn('id', $allTenantIds)->delete();

            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            Log::info('System reset to factory default.', [
                'reset_by_user' => $user->email,
                'tenants_removed' => $allTenantIds,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'System has been reset to factory default. Please complete setup again.',
            ]);

        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            Log::error('System reset failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Reset failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
