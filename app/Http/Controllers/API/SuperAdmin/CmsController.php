<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\LandingPageContent;
use Illuminate\Http\Request;

class CmsController extends Controller
{
    public function getLandingContent()
    {
        $content = LandingPageContent::where('key', 'default')
            ->where('is_active', true)
            ->first();

        return response()->json([
            'content' => $content?->content ?? [],
        ]);
    }

    public function updateLandingContent(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|array',
        ]);

        $landing = LandingPageContent::updateOrCreate(
            ['key' => 'default'],
            [
                'content' => $validated['content'],
                'is_active' => true,
            ]
        );

        AdminActivityLog::log('landing.content.updated', $landing);

        return response()->json([
            'message' => 'Landing page content updated successfully',
            'content' => $landing->content,
        ]);
    }
}
