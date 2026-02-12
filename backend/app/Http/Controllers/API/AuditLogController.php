<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditLogController extends Controller
{
    /**
     * Get audit logs with filtering
     */
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;

        $query = AuditLog::with('user:id,name,email')
            ->whereHas('user', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->orderBy('created_at', 'desc');

        // Filter by action
        if ($request->has('action') && $request->action) {
            $query->where('action', $request->action);
        }

        // Filter by user
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by entity type
        if ($request->has('entity') && $request->entity) {
            $query->where('auditable_type_display', $request->entity);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Search by reference or user email
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('auditable_reference', 'like', "%{$search}%")
                    ->orWhere('user_email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->input('per_page', 20);
        $logs = $query->paginate($perPage);

        // Transform data
        $logs->getCollection()->transform(function ($log) {
            return [
                'id' => $log->id,
                'timestamp' => $log->created_at->format('Y-m-d H:i:s'),
                'user' => $log->user_email,
                'user_name' => $log->user?->name,
                'action' => $log->action,
                'entity' => $log->auditable_type_display ?? class_basename($log->auditable_type),
                'ref' => $log->auditable_reference ?? "#{$log->auditable_id}",
                'ip' => $log->ip_address,
                'changes' => [
                    'before' => $log->old_values,
                    'after' => $log->new_values,
                ],
                'reason' => $log->reason,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ]
        ]);
    }

    /**
     * Get single audit log
     */
    public function show($id)
    {
        $log = AuditLog::with(['user:id,name,email'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $log->id,
                'timestamp' => $log->created_at->format('Y-m-d H:i:s'),
                'user' => $log->user_email,
                'user_name' => $log->user?->name,
                'action' => $log->action,
                'entity' => $log->auditable_type_display ?? class_basename($log->auditable_type),
                'ref' => $log->auditable_reference ?? "#{$log->auditable_id}",
                'ip' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'changes' => [
                    'before' => $log->old_values,
                    'after' => $log->new_values,
                ],
                'reason' => $log->reason,
            ]
        ]);
    }

    /**
     * Get available filters (actions, entities, users)
     */
    public function filters(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;

        // Get unique actions
        $actions = AuditLog::distinct()->pluck('action')->filter()->values();

        // Get unique entities
        $entities = AuditLog::distinct()
            ->pluck('auditable_type_display')
            ->filter()
            ->unique()
            ->values();

        // Get users who have audit logs
        $users = AuditLog::whereHas('user', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })
            ->with('user:id,name,email')
            ->select('user_id')
            ->distinct()
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->user_id,
                    'name' => $log->user?->name,
                    'email' => $log->user?->email,
                ];
            })
            ->filter()
            ->unique('id')
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'actions' => $actions,
                'entities' => $entities,
                'users' => $users,
            ]
        ]);
    }

    /**
     * Export audit logs as CSV
     */
    public function export(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;

        $query = AuditLog::with('user:id,name,email')
            ->whereHas('user', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->orderBy('created_at', 'desc');

        // Apply same filters
        if ($request->has('action') && $request->action) {
            $query->where('action', $request->action);
        }
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $logs = $query->limit(1000)->get();

        // Create CSV content
        $headers = ['Timestamp', 'User', 'Action', 'Entity', 'Reference', 'IP Address'];
        $rows = $logs->map(function ($log) {
            return [
                $log->created_at->format('Y-m-d H:i:s'),
                $log->user_email,
                $log->action,
                $log->auditable_type_display ?? class_basename($log->auditable_type),
                $log->auditable_reference ?? "#{$log->auditable_id}",
                $log->ip_address,
            ];
        });

        $csv = implode(',', $headers) . "\n";
        foreach ($rows as $row) {
            $csv .= implode(',', array_map(function ($val) {
                return '"' . str_replace('"', '""', $val ?? '') . '"';
            }, $row)) . "\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="audit_log_' . now()->format('Y-m-d') . '.csv"',
        ]);
    }
}
