<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$permissions
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        if (!$request->user()) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Check if user is active
        if (!$request->user()->isActive()) {
            return response()->json([
                'message' => 'Your account is not active. Please contact an administrator.',
            ], 403);
        }

        // Super admin has all permissions
        if ($request->user()->isSuperAdmin()) {
            return $next($request);
        }

        // Check if user has ALL required permissions
        foreach ($permissions as $permission) {
            if (!$request->user()->hasPermission($permission)) {
                return response()->json([
                    'message' => 'You do not have the required permission to perform this action.',
                    'required_permission' => $permission,
                ], 403);
            }
        }

        return $next($request);
    }
}
