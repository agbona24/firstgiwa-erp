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
        // Check APP_INSTALLED env variable first - if false, should go to /install not /setup
        $appInstalled = env('APP_INSTALLED', false);
        
        if ($appInstalled === false || $appInstalled === 'false') {
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
     * Complete initial system setup
     */
    public function completeSetup(Request $request): JsonResponse
    {
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

            // 3. Create Warehouses
            $warehouses = $validated['warehouses'] ?? [];
            
            $defaultWarehouseId = null;

            if (empty($warehouses)) {
                // Create default warehouse
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
                        'location' => $wh['type'] ?? null, // Store type as location
                        'is_active' => true,
                    ]);

                    if ($idx === 0) {
                        $defaultWarehouseId = $warehouse->id;
                    }
                }
            }

            // 4. Create Departments (frontend sends objects with name/code)
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

            // 5. Create Categories (frontend sends under products.categories)
            $categories = $validated['products']['categories'] ?? ['General'];
            foreach ($categories as $idx => $catName) {
                if (trim($catName)) {
                    // Generate code from name
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

            // 6. Create Units (frontend sends under products.units)
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

            // 7. Seed default products for quick onboarding
            $this->seedDefaultProducts(
                $tenant->id,
                $defaultWarehouseId,
                $validated['products']['default_items'] ?? null
            );

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
}
