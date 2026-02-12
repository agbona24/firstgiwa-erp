<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class ApiSettingsController extends Controller
{
    protected $group = 'api';

    public function index()
    {
        $settings = Setting::getGroup($this->group);

        $defaults = [
            'api_enabled' => false,
            'api_key' => null,
            'allowed_ips' => [],
            'webhook_url' => '',
            'webhook_secret' => '',
            'rate_limit_per_min' => 60,
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge($defaults, $settings),
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'api_enabled' => 'boolean',
            'api_key' => 'nullable|string|max:255',
            'allowed_ips' => 'nullable|array',
            'allowed_ips.*' => 'string|max:255',
            'webhook_url' => 'nullable|string|max:500',
            'webhook_secret' => 'nullable|string|max:255',
            'rate_limit_per_min' => 'nullable|integer|min:1|max:10000',
        ]);

        $fields = [
            'api_enabled',
            'api_key',
            'allowed_ips',
            'webhook_url',
            'webhook_secret',
            'rate_limit_per_min',
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::set($this->group, $field, $request->$field);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'API settings updated successfully',
        ]);
    }

    public function rotateKey()
    {
        $key = bin2hex(random_bytes(16));
        Setting::set($this->group, 'api_key', $key);

        return response()->json([
            'success' => true,
            'data' => [
                'api_key' => $key,
            ],
        ]);
    }
}
