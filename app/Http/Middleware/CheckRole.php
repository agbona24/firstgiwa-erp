<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
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

        // Super admin bypasses all role checks
        if ($request->user()->isSuperAdmin()) {
            return $next($request);
        }

        // Check if user has any of the required roles
        if (!$request->user()->hasRole($roles)) {
            return response()->json([
                'message' => 'You do not have the required role to access this resource.',
                'required_roles' => $roles,
            ], 403);
        }

        return $next($request);
    }
}
