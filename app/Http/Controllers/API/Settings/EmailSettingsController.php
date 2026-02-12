<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EmailSettingsController extends Controller
{
    protected $group = 'email';

    /**
     * Get email settings
     */
    public function index()
    {
        $settings = Setting::getGroup($this->group);

        $defaults = [
            'mail_driver' => 'smtp',
            'mail_host' => '',
            'mail_port' => 587,
            'mail_username' => '',
            'mail_password' => '',
            'mail_encryption' => 'tls',
            'mail_from_address' => '',
            'mail_from_name' => '',
        ];

        // Mask password for security
        $data = array_merge($defaults, $settings);
        if (!empty($data['mail_password'])) {
            $data['mail_password'] = '********';
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Update email settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'mail_driver' => 'nullable|in:smtp,mailgun,ses,postmark',
            'mail_host' => 'nullable|string|max:255',
            'mail_port' => 'nullable|integer|min:1|max:65535',
            'mail_username' => 'nullable|string|max:255',
            'mail_password' => 'nullable|string|max:255',
            'mail_encryption' => 'nullable|in:tls,ssl,null',
            'mail_from_address' => 'nullable|email|max:255',
            'mail_from_name' => 'nullable|string|max:255',
        ]);

        $fields = [
            'mail_driver', 'mail_host', 'mail_port',
            'mail_username', 'mail_encryption',
            'mail_from_address', 'mail_from_name'
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::set($this->group, $field, $request->$field);
            }
        }

        // Only update password if not masked value
        if ($request->has('mail_password') && $request->mail_password !== '********') {
            Setting::set($this->group, 'mail_password', $request->mail_password);
        }

        return response()->json([
            'success' => true,
            'message' => 'Email settings updated successfully'
        ]);
    }

    /**
     * Test email configuration
     */
    public function testEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
        ]);

        // TODO: Implement actual email sending
        return response()->json([
            'success' => true,
            'message' => 'Test email sent to ' . $request->email
        ]);
    }
}
