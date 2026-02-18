<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Branch;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        $query = Tenant::withCount(['users', 'branches']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('domain', 'like', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($plan = $request->get('plan')) {
            $query->where('plan', $plan);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        return response()->json($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:tenants,slug',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'plan' => 'required|exists:plans,slug',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'max_users' => 'nullable|integer|min:1',
            'max_branches' => 'nullable|integer|min:1',
        ]);

        return DB::transaction(function () use ($validated) {
            $slug = $validated['slug'] ?? Str::slug($validated['name']);

            $tenant = Tenant::create([
                'name' => $validated['name'],
                'slug' => $slug,
                'subdomain' => $slug,
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'plan' => $validated['plan'],
                'is_active' => true,
                'status' => 'active',
                'settings' => [],
            ]);

            // Create main branch
            $branch = Branch::create([
                'tenant_id' => $tenant->id,
                'name' => 'Main Branch',
                'type' => 'retail',
                'is_main_branch' => true,
                'is_active' => true,
            ]);

            // Create admin user for this tenant
            $user = User::create([
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'password' => Hash::make('password'),
                'tenant_id' => $tenant->id,
                'branch_id' => $branch->id,
                'status' => 'active',
            ]);

            // Assign Super Admin role if it exists
            try {
                $user->assignRole('Super Admin');
            } catch (\Exception $e) {
                // Role may not exist yet
            }

            AdminActivityLog::log('tenant.created', $tenant, [
                'plan' => $tenant->plan,
                'admin_email' => $validated['admin_email'],
            ]);

            return response()->json([
                'message' => 'Tenant created successfully',
                'tenant' => $tenant->load('users', 'branches'),
            ], 201);
        });
    }

    public function show(Tenant $tenant)
    {
        $tenant->loadCount(['users', 'branches']);
        $tenant->load(['branches:id,tenant_id,name,type,is_active']);

        $recentUsers = User::where('tenant_id', $tenant->id)
            ->with('roles:id,name')
            ->latest()
            ->take(10)
            ->get(['id', 'name', 'email', 'status', 'last_login_at', 'created_at']);

        $activity = AdminActivityLog::where('target_type', Tenant::class)
            ->where('target_id', $tenant->id)
            ->with('user:id,name')
            ->latest()
            ->take(10)
            ->get();

        return response()->json([
            'tenant' => $tenant,
            'recent_users' => $recentUsers,
            'activity' => $activity,
        ]);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'plan' => 'sometimes|exists:plans,slug',
            'notes' => 'nullable|string',
        ]);

        $oldPlan = $tenant->plan;
        $tenant->update($validated);

        AdminActivityLog::log('tenant.updated', $tenant, [
            'changes' => $validated,
            'old_plan' => $oldPlan,
        ]);

        return response()->json([
            'message' => 'Tenant updated successfully',
            'tenant' => $tenant->fresh(),
        ]);
    }

    public function destroy(Tenant $tenant)
    {
        // Don't hard delete — just deactivate
        $tenant->update([
            'status' => 'cancelled',
            'is_active' => false,
        ]);

        AdminActivityLog::log('tenant.cancelled', $tenant);

        return response()->json([
            'message' => 'Tenant has been cancelled',
        ]);
    }

    public function suspend(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $tenant->suspend($request->reason);

        AdminActivityLog::log('tenant.suspended', $tenant, [
            'reason' => $request->reason,
        ]);

        return response()->json([
            'message' => 'Tenant suspended successfully',
            'tenant' => $tenant->fresh(),
        ]);
    }

    public function activate($id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->activate();

        AdminActivityLog::log('tenant.activated', $tenant);

        return response()->json([
            'message' => 'Tenant activated successfully',
            'tenant' => $tenant->fresh(),
        ]);
    }

    public function getUsers(Request $request, $id)
    {
        $query = User::where('tenant_id', $id)->with('roles:id,name');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $query->orderBy($request->get('sort_by', 'created_at'), $request->get('sort_dir', 'desc'));

        return response()->json($query->paginate($request->get('per_page', 20)));
    }

    public function impersonate($id)
    {
        $tenant = Tenant::findOrFail($id);

        // Find the tenant's admin user (first user or one with Super Admin role)
        $tenantAdmin = User::where('tenant_id', $tenant->id)
            ->whereHas('roles', fn ($q) => $q->where('name', 'Super Admin'))
            ->first();

        if (!$tenantAdmin) {
            $tenantAdmin = User::where('tenant_id', $tenant->id)->first();
        }

        if (!$tenantAdmin) {
            return response()->json([
                'message' => 'No users found for this tenant',
            ], 404);
        }

        // Create a token for the tenant admin
        $token = $tenantAdmin->createToken('impersonation-token')->plainTextToken;
        $tenantAdmin->load('roles.permissions');

        AdminActivityLog::log('tenant.impersonated', $tenant, [
            'impersonated_user_id' => $tenantAdmin->id,
            'impersonated_user_email' => $tenantAdmin->email,
        ]);

        return response()->json([
            'token' => $token,
            'user' => array_merge($tenantAdmin->toArray(), [
                'all_permissions' => $tenantAdmin->getAllPermissions()->pluck('name')->values(),
            ]),
            'tenant' => $tenant,
            'message' => "Now impersonating {$tenantAdmin->name} at {$tenant->name}",
        ]);
    }
}
