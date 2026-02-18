<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Handle user login (email+password OR email+pin)
     */
    public function login(Request $request)
    {
        // Determine login method
        $loginMethod = $request->input('login_method', 'password'); // 'password' or 'pin'

        if ($loginMethod === 'pin') {
            // PIN-based login (no email needed)
            $request->validate([
                'pin' => 'required|string|digits:4'
            ]);

            // Find user by PIN - iterate active users who have a PIN set
            $user = null;
            $usersWithPin = User::where('status', 'active')
                ->whereNotNull('pin_code')
                ->get();

            foreach ($usersWithPin as $candidate) {
                if (Hash::check($request->pin, $candidate->pin_code)) {
                    $user = $candidate;
                    break;
                }
            }

            if (!$user) {
                return response()->json([
                    'message' => 'Invalid PIN code. Please try again.'
                ], 401);
            }

            // Update last login
            $user->update(['last_login_at' => now()]);

            // Log the login event
            AuditLog::logLogin($user);

            $token = $user->createToken('auth-token')->plainTextToken;
            $user->load('roles.permissions');

            return response()->json([
                'user' => array_merge($user->toArray(), [
                    'all_permissions' => $user->getPermissionsViaRoles()->pluck('name')
                        ->merge($user->permissions->pluck('name'))
                        ->unique()->values(),
                ]),
                'token' => $token,
                'message' => 'Login successful'
            ]);
        }

        // Standard password login
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid credentials. Please check your email and password.'
            ], 401);
        }

        $user = Auth::user();

        // Check if user is active
        if ($user->status !== 'active') {
            Auth::guard('web')->logout();
            return response()->json([
                'message' => 'Your account has been deactivated. Contact admin.'
            ], 403);
        }

        // Update last login
        $user->update(['last_login_at' => now()]);

        // Log the login event
        AuditLog::logLogin($user);

        $token = $user->createToken('auth-token')->plainTextToken;
        $user->load('roles.permissions');

        return response()->json([
            'user' => array_merge($user->toArray(), [
                'all_permissions' => $user->getPermissionsViaRoles()->pluck('name')
                        ->merge($user->permissions->pluck('name'))
                        ->unique()->values(),
            ]),
            'token' => $token,
            'message' => 'Login successful'
        ]);
    }

    /**
     * Handle user logout
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        
        // Log the logout event
        AuditLog::logLogout($user);
        
        $user->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('roles.permissions');

        return response()->json([
            'user' => array_merge($user->toArray(), [
                'all_permissions' => $user->getPermissionsViaRoles()->pluck('name')
                        ->merge($user->permissions->pluck('name'))
                        ->unique()->values(),
            ]),
        ]);
    }

    /**
     * Change authenticated user's password
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!$user || !Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.'
            ], 422);
        }

        $user->password = $validated['password'];
        $user->save();

        return response()->json([
            'message' => 'Password changed successfully.'
        ]);
    }
}
