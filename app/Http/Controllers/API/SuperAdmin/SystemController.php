<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemController extends Controller
{
    public function health()
    {
        $dbOk = false;
        try {
            DB::connection()->getPdo();
            $dbOk = true;
        } catch (\Exception $e) {
            // DB connection failed
        }

        $diskTotal = disk_total_space('/');
        $diskFree = disk_free_space('/');

        return response()->json([
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'database' => [
                'connected' => $dbOk,
                'driver' => config('database.default'),
            ],
            'disk' => [
                'total' => $diskTotal,
                'free' => $diskFree,
                'used' => $diskTotal - $diskFree,
                'usage_percent' => round((($diskTotal - $diskFree) / $diskTotal) * 100, 1),
            ],
            'memory' => [
                'usage' => memory_get_usage(true),
                'peak' => memory_get_peak_usage(true),
            ],
            'cache_driver' => config('cache.default'),
            'queue_driver' => config('queue.default'),
            'server_time' => now()->toIso8601String(),
        ]);
    }

    public function activityLogs(Request $request)
    {
        $query = AdminActivityLog::with('user:id,name,email')
            ->latest();

        if ($action = $request->get('action')) {
            $query->where('action', $action);
        }

        if ($userId = $request->get('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($from = $request->get('from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->get('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        return response()->json($query->paginate($request->get('per_page', 20)));
    }
}
