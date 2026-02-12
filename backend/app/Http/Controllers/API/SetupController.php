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
        $tenant = Tenant::first();
        $setupComplete = $tenant && User::where('tenant_id', $tenant->id)->exists();

        return response()->json([
            'success' => true,
            'setup_complete' => $setupComplete,
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
            
            if (empty($warehouses)) {
                // Create default warehouse
                Warehouse::create([
                    'tenant_id' => $tenant->id,
                    'branch_id' => $mainBranch->id,
                    'name' => 'Main Warehouse',
                    'code' => 'WH-' . $tenant->id . '-MAIN',
                    'address' => $validated['company']['address'] ?? null,
                    'is_active' => true,
                ]);
            } else {
                foreach ($warehouses as $idx => $wh) {
                    Warehouse::create([
                        'tenant_id' => $tenant->id,
                        'branch_id' => $mainBranch->id,
                        'name' => $wh['name'],
                        'code' => 'WH-' . $tenant->id . '-' . str_pad($idx + 1, 3, '0', STR_PAD_LEFT),
                        'address' => $wh['address'] ?? null,
                        'location' => $wh['type'] ?? null, // Store type as location
                        'is_active' => true,
                    ]);
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

            // 7. Create Admin User
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

            // 8. Save Company Settings
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
}
