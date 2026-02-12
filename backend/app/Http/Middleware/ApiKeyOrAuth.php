<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyOrAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('sanctum')->user();
        if ($user) {
            Auth::setUser($user);
            return $next($request);
        }

        $apiKey = $this->getApiKey($request);
        if (!$apiKey) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $apiKeySetting = Setting::where('group', 'api')
            ->where('key', 'api_key')
            ->get()
            ->first(function ($setting) use ($apiKey) {
                return (string) $setting->value === (string) $apiKey;
            });

        if (!$apiKeySetting) {
            return response()->json(['message' => 'Invalid API key.'], 401);
        }

        $tenantId = $apiKeySetting->tenant_id;
        $enabledSetting = Setting::where('tenant_id', $tenantId)
            ->where('group', 'api')
            ->where('key', 'api_enabled')
            ->first();
        if ($enabledSetting && $enabledSetting->value === false) {
            return response()->json(['message' => 'API access is disabled.'], 403);
        }

        $allowedIpsSetting = Setting::where('tenant_id', $tenantId)
            ->where('group', 'api')
            ->where('key', 'allowed_ips')
            ->first();
        if ($allowedIpsSetting && is_array($allowedIpsSetting->value) && count($allowedIpsSetting->value) > 0) {
            $ip = $request->ip();
            if (!in_array($ip, $allowedIpsSetting->value, true)) {
                return response()->json(['message' => 'IP not allowed.'], 403);
            }
        }

        $systemUser = User::where('tenant_id', $tenantId)->role('Super Admin')->first()
            ?? User::where('tenant_id', $tenantId)->role('Admin')->first()
            ?? User::where('tenant_id', $tenantId)->first();

        if (!$systemUser) {
            return response()->json(['message' => 'No tenant user found for API key.'], 403);
        }

        Auth::setUser($systemUser);

        return $next($request);
    }

    private function getApiKey(Request $request): ?string
    {
        $key = $request->header('X-API-KEY');
        if ($key) return $key;

        $auth = $request->header('Authorization');
        if ($auth && str_starts_with($auth, 'Bearer ')) {
            return substr($auth, 7);
        }

        return null;
    }
}
