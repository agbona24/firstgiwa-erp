<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        $admins = User::where('is_system_admin', true)
            ->select(['id', 'name', 'email', 'status', 'last_login_at', 'created_at'])
            ->latest()
            ->get();

        return response()->json(['admins' => $admins]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'tenant_id' => null,
            'branch_id' => null,
            'is_system_admin' => true,
            'status' => 'active',
        ]);

        AdminActivityLog::log('admin.created', $user, [
            'email' => $user->email,
        ]);

        return response()->json([
            'message' => 'System admin created successfully',
            'admin' => $user,
        ], 201);
    }

    public function destroy($id)
    {
        $user = User::where('is_system_admin', true)->findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'You cannot remove yourself as system admin',
            ], 422);
        }

        AdminActivityLog::log('admin.removed', $user, [
            'email' => $user->email,
        ]);

        $user->update(['is_system_admin' => false, 'status' => 'inactive']);

        return response()->json([
            'message' => 'System admin removed successfully',
        ]);
    }
}
