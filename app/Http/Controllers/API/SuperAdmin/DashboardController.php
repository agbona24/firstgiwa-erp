<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('status', 'active')->count();
        $trialTenants = Tenant::where('status', 'trial')->count();
        $suspendedTenants = Tenant::where('status', 'suspended')->count();
        $totalUsers = User::whereNotNull('tenant_id')->count();
        $newTenantsThisMonth = Tenant::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $recentActivity = AdminActivityLog::with('user:id,name,email')
            ->latest()
            ->take(10)
            ->get();

        $tenantsByPlan = Tenant::selectRaw('plan, COUNT(*) as count')
            ->groupBy('plan')
            ->pluck('count', 'plan');

        return response()->json([
            'stats' => [
                'total_tenants' => $totalTenants,
                'active_tenants' => $activeTenants,
                'trial_tenants' => $trialTenants,
                'suspended_tenants' => $suspendedTenants,
                'total_users' => $totalUsers,
                'new_tenants_this_month' => $newTenantsThisMonth,
            ],
            'tenants_by_plan' => $tenantsByPlan,
            'recent_activity' => $recentActivity,
        ]);
    }
}
