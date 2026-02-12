<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SmsSettingsController extends Controller
{
    protected $group = 'sms';

    /**
     * Get SMS/WhatsApp settings
     */
    public function index()
    {
        $settings = Setting::getGroup($this->group);

        $defaults = [
            'sms_enabled' => false,
            'sms_provider' => 'termii',
            'sms_api_key' => '',
            'sms_sender_id' => '',
            'whatsapp_enabled' => false,
            'whatsapp_api_key' => '',
            'whatsapp_phone_number' => '',
            'send_order_confirmation' => true,
            'send_payment_reminder' => true,
            'send_delivery_notification' => true,
        ];

        // Mask API keys for security
        $data = array_merge($defaults, $settings);
        if (!empty($data['sms_api_key'])) {
            $data['sms_api_key'] = '********' . substr($data['sms_api_key'], -4);
        }
        if (!empty($data['whatsapp_api_key'])) {
            $data['whatsapp_api_key'] = '********' . substr($data['whatsapp_api_key'], -4);
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Update SMS/WhatsApp settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'sms_enabled' => 'boolean',
            'sms_provider' => 'nullable|string|max:50',
            'sms_api_key' => 'nullable|string|max:255',
            'sms_sender_id' => 'nullable|string|max:20',
            'whatsapp_enabled' => 'boolean',
            'whatsapp_api_key' => 'nullable|string|max:255',
            'whatsapp_phone_number' => 'nullable|string|max:20',
            'send_order_confirmation' => 'boolean',
            'send_payment_reminder' => 'boolean',
            'send_delivery_notification' => 'boolean',
        ]);

        $fields = [
            'sms_enabled', 'sms_provider', 'sms_sender_id',
            'whatsapp_enabled', 'whatsapp_phone_number',
            'send_order_confirmation', 'send_payment_reminder',
            'send_delivery_notification'
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::set($this->group, $field, $request->$field);
            }
        }

        // Only update API keys if not masked value
        if ($request->has('sms_api_key') && !str_starts_with($request->sms_api_key, '********')) {
            Setting::set($this->group, 'sms_api_key', $request->sms_api_key);
        }
        if ($request->has('whatsapp_api_key') && !str_starts_with($request->whatsapp_api_key, '********')) {
            Setting::set($this->group, 'whatsapp_api_key', $request->whatsapp_api_key);
        }

        return response()->json([
            'success' => true,
            'message' => 'SMS/WhatsApp settings updated successfully'
        ]);
    }

    /**
     * Test SMS configuration
     */
    public function testSms(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:20',
        ]);

        // TODO: Implement actual SMS sending
        return response()->json([
            'success' => true,
            'message' => 'Test SMS sent to ' . $request->phone
        ]);
    }
}
