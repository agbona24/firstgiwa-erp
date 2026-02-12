<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserController extends Controller
{
    /**
     * Display a listing of users
     */
    public function index(Request $request)
    {
        $query = User::with(['roles', 'permissions', 'tenant', 'branch']);

        // Filter by search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->has('role')) {
            $query->role($request->role);
        }

        // Filter by status
        if ($request->has('is_active')) {
            $status = $request->boolean('is_active') ? 'active' : 'inactive';
            $query->where('status', $status);
        }

        // Filter by tenant
        if ($request->has('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        // Transform to include role names
        $users->getCollection()->transform(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'department' => $user->department,
                'is_active' => $user->status === 'active',
                'status' => $user->status,
                'email_verified_at' => $user->email_verified_at,
                'last_login_at' => $user->last_login_at?->toISOString(),
                'has_pin' => !empty($user->pin_code),
                'created_at' => $user->created_at,
                'roles' => $user->roles->pluck('name'),
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'tenant' => $user->tenant,
                'branch' => $user->branch,
            ];
        });

        return response()->json($users);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::min(8)],
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:100',
            'roles' => 'array',
            'roles.*' => 'string|exists:roles,name',
            'tenant_id' => 'nullable|exists:tenants,id',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'department' => $request->department,
            'tenant_id' => $request->tenant_id ?? Auth::user()->tenant_id,
            'branch_id' => $request->branch_id ?? Auth::user()->branch_id,
            'status' => 'active',
        ]);

        // Assign roles
        if ($request->has('roles')) {
            $user->syncRoles($request->roles);
        }

        return response()->json([
            'message' => 'User created successfully',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
            ]
        ], 201);
    }

    /**
     * Display the specified user
     */
    public function show(User $user)
    {
        $user->load(['roles', 'permissions', 'tenant', 'branch']);

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'department' => $user->department,
                'is_active' => $user->status === 'active',
                'status' => $user->status,
                'email_verified_at' => $user->email_verified_at,
                'last_login_at' => $user->last_login_at?->toISOString(),
                'has_pin' => !empty($user->pin_code),
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'roles' => $user->roles->pluck('name'),
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'tenant' => $user->tenant,
                'branch' => $user->branch,
            ]
        ]);
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => ['sometimes', 'confirmed', Password::min(8)],
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:100',
            'is_active' => 'sometimes|boolean',
            'roles' => 'sometimes|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['name', 'email', 'phone', 'department']);

        // Map is_active boolean to status string
        if ($request->has('is_active')) {
            $data['status'] = $request->boolean('is_active') ? 'active' : 'inactive';
        }
        if ($request->has('status')) {
            $data['status'] = $request->status;
        }

        if ($request->has('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        // Update roles
        if ($request->has('roles')) {
            $user->syncRoles($request->roles);
        }

        return response()->json([
            'message' => 'User updated successfully',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
            ]
        ]);
    }

    /**
     * Remove the specified user
     */
    public function destroy(User $user)
    {
        // Don't allow deleting yourself
        if ($user->id === Auth::id()) {
            return response()->json(['message' => 'Cannot delete your own account'], 403);
        }

        // Soft delete by deactivating
        $user->update(['status' => 'inactive']);

        return response()->json(['message' => 'User deactivated successfully']);
    }

    /**
     * Toggle user active status
     */
    public function toggleStatus(User $user)
    {
        if ($user->id === Auth::id()) {
            return response()->json(['message' => 'Cannot change your own status'], 403);
        }

        $newStatus = $user->status === 'active' ? 'inactive' : 'active';
        $user->update(['status' => $newStatus]);

        return response()->json([
            'message' => 'User ' . ($newStatus === 'active' ? 'activated' : 'deactivated') . ' successfully',
            'data' => [
                'id' => $user->id,
                'status' => $newStatus,
            ]
        ]);
    }

    /**
     * Admin reset password for a user
     */
    public function resetPassword(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'password' => ['required', 'confirmed', Password::min(6)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json(['message' => 'Password reset successfully']);
    }

    /**
     * Set PIN code for a user
     */
    public function setPin(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'pin' => 'required|string|digits:4',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update([
            'pin_code' => Hash::make($request->pin),
        ]);

        return response()->json(['message' => 'PIN set successfully for ' . $user->name]);
    }

    /**
     * Remove PIN code from a user
     */
    public function removePin(User $user)
    {
        $user->update(['pin_code' => null]);

        return response()->json(['message' => 'PIN removed for ' . $user->name]);
    }

    /**
     * Get all roles
     */
    public function roles()
    {
        $roles = Role::with('permissions')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
                'users_count' => $role->users()->count(),
            ];
        });

        return response()->json(['data' => $roles]);
    }

    /**
     * Get all permissions
     */
    public function permissions()
    {
        $permissions = Permission::all()->groupBy(function ($permission) {
            // Group by module (first part of permission name)
            $parts = explode('.', $permission->name);
            return $parts[0] ?? 'other';
        });

        return response()->json(['data' => $permissions]);
    }

    /**
     * Create a new role
     */
    public function createRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $role = Role::create(['name' => $request->name, 'guard_name' => 'web']);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json([
            'message' => 'Role created successfully',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ]
        ], 201);
    }

    /**
     * Update a role
     */
    public function updateRole(Request $request, $roleId)
    {
        $role = Role::findOrFail($roleId);

        // Don't allow editing Super Admin role
        if ($role->name === 'Super Admin') {
            return response()->json(['message' => 'Cannot modify Super Admin role'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:roles,name,' . $role->id,
            'permissions' => 'sometimes|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->has('name')) {
            $role->update(['name' => $request->name]);
        }

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json([
            'message' => 'Role updated successfully',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ]
        ]);
    }

    /**
     * Delete a role
     */
    public function deleteRole($roleId)
    {
        $role = Role::findOrFail($roleId);

        // Don't allow deleting system roles
        $protectedRoles = ['Super Admin', 'Admin', 'Manager'];
        if (in_array($role->name, $protectedRoles)) {
            return response()->json(['message' => 'Cannot delete system role'], 403);
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            return response()->json(['message' => 'Cannot delete role with assigned users'], 400);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted successfully']);
    }

    /**
     * Assign role to user
     */
    public function assignRole(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->syncRoles($request->roles);

        return response()->json([
            'message' => 'Roles assigned successfully',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'roles' => $user->roles->pluck('name'),
            ]
        ]);
    }

    /**
     * Revoke role from user
     */
    public function revokeRole(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'role' => 'required|string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->removeRole($request->role);

        return response()->json([
            'message' => 'Role revoked successfully',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'roles' => $user->roles->pluck('name'),
            ]
        ]);
    }
}
