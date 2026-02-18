<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\LandingPageContent;

class LandingController extends Controller
{
    public function getContent()
    {
        $content = LandingPageContent::getDefault();
        return response()->json($content ?? []);
    }
}
