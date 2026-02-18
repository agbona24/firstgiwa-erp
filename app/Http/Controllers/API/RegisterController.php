<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'email' => 'required|email|unique:tenants,email',
            'phone' => 'nullable|string|max:20',
            'plan' => 'required|exists:plans,slug',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8',
        ]);

        return DB::transaction(function () use ($validated) {
            $slug = Str::slug($validated['company_name']);

            // Ensure unique slug
            $originalSlug = $slug;
            $counter = 1;
            while (Tenant::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $counter++;
            }

            // 1. Create Tenant
            $tenant = Tenant::create([
                'name' => $validated['company_name'],
                'slug' => $slug,
                'subdomain' => $slug,
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'plan' => $validated['plan'],
                'is_active' => true,
                'status' => 'trial',
                'settings' => [],
            ]);

            // 2. Create Main Branch
            $branch = Branch::create([
                'tenant_id' => $tenant->id,
                'name' => 'Main Branch',
                'branch_type' => 'retail',
                'is_main_branch' => true,
                'is_active' => true,
            ]);

            // 3. Create Default Warehouse
            Warehouse::create([
                'tenant_id' => $tenant->id,
                'branch_id' => $branch->id,
                'name' => 'Main Warehouse',
                'code' => 'WH-' . $tenant->id . '-MAIN',
                'type' => 'general',
                'is_active' => true,
            ]);

            // 4. Create Default Department
            Department::create([
                'tenant_id' => $tenant->id,
                'name' => 'Management',
                'code' => 'MGT',
                'is_active' => true,
            ]);

            // 5. Create Admin User
            $user = User::create([
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'password' => Hash::make($validated['admin_password']),
                'tenant_id' => $tenant->id,
                'branch_id' => $branch->id,
                'status' => 'active',
            ]);

            // 6. Assign Super Admin role
            try {
                $user->assignRole('Super Admin');
            } catch (\Exception $e) {
                // Role may not exist yet
            }

            // 7. Create auth token
            $token = $user->createToken('auth-token')->plainTextToken;
            $user->load('roles.permissions');

            // 8. Log activity
            AdminActivityLog::log('tenant.registered', $tenant, [
                'plan' => $tenant->plan,
                'admin_email' => $validated['admin_email'],
                'source' => 'public_signup',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Account created successfully! Welcome to FactoryPulse.',
                'token' => $token,
                'user' => array_merge($user->toArray(), [
                    'all_permissions' => $user->getAllPermissions()->pluck('name')->values(),
                ]),
                'tenant' => $tenant,
            ], 201);
        });
    }
}
