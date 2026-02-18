<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureSystemAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user() || !$request->user()->is_system_admin) {
            return response()->json([
                'message' => 'Unauthorized. System admin access required.',
            ], 403);
        }

        return $next($request);
    }
}
