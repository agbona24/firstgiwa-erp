<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CompanyController extends Controller
{
    /**
     * Get company profile settings
     */
    public function index()
    {
        $tenant = Auth::user()->tenant;

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $tenant->name,
                'address' => $tenant->address,
                'phone' => $tenant->phone,
                'email' => $tenant->email,
                'rc_number' => $tenant->rc_number,
                'tin' => $tenant->tin,
                'logo_url' => $tenant->logo_url,
                'website' => $tenant->website,
            ]
        ]);
    }

    /**
     * Update company profile settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'rc_number' => 'nullable|string|max:50',
            'tin' => 'nullable|string|max:50',
            'website' => 'nullable|string|max:255',
        ]);

        $tenant = Auth::user()->tenant;
        
        $tenant->update($request->only([
            'name', 'address', 'phone', 'email', 
            'rc_number', 'tin', 'website'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Company profile updated successfully',
            'data' => $tenant
        ]);
    }

    /**
     * Upload company logo
     */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $tenant = Auth::user()->tenant;

        // Delete old logo if exists
        if ($tenant->logo_url) {
            Storage::delete($tenant->logo_url);
        }

        $path = $request->file('logo')->store('logos', 'public');
        $tenant->update(['logo_url' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Logo uploaded successfully',
            'data' => ['logo_url' => Storage::url($path)]
        ]);
    }
}
