<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\ApiDocsController;

Route::get('/api-docs', [ApiDocsController::class, 'index']);
Route::get('/api-docs/openapi.json', [ApiDocsController::class, 'spec']);

// Serve React SPA for all routes
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
