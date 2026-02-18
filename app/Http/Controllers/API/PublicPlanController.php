<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Plan;

class PublicPlanController extends Controller
{
    public function index()
    {
        return response()->json(Plan::active()->get());
    }
}
