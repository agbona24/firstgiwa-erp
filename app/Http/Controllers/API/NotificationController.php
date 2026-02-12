<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get notifications for the current user
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $perPage = $request->get('per_page', 20);
        $type = $request->get('type');
        $unreadOnly = $request->boolean('unread_only', false);

        $query = Notification::forTenant($user->tenant_id)
            ->forUser($user->id)
            ->recent(30) // Last 30 days
            ->orderBy('created_at', 'desc');

        if ($type) {
            $query->ofType($type);
        }

        if ($unreadOnly) {
            $query->unread();
        }

        $notifications = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $notifications->map(fn($n) => $n->toApiArray()),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
            'unread_count' => Notification::forTenant($user->tenant_id)
                ->forUser($user->id)
                ->unread()
                ->count(),
        ]);
    }

    /**
     * Get unread count only
     */
    public function unreadCount()
    {
        $user = Auth::user();

        $count = Notification::forTenant($user->tenant_id)
            ->forUser($user->id)
            ->unread()
            ->count();

        return response()->json([
            'success' => true,
            'data' => ['count' => $count],
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead($id)
    {
        $user = Auth::user();

        $notification = Notification::forTenant($user->tenant_id)
            ->forUser($user->id)
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
            'data' => $notification->toApiArray(),
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        $user = Auth::user();

        Notification::forTenant($user->tenant_id)
            ->forUser($user->id)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy($id)
    {
        $user = Auth::user();

        $notification = Notification::forTenant($user->tenant_id)
            ->forUser($user->id)
            ->findOrFail($id);

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted',
        ]);
    }

    /**
     * Delete all read notifications
     */
    public function clearRead()
    {
        $user = Auth::user();

        $deleted = Notification::forTenant($user->tenant_id)
            ->forUser($user->id)
            ->read()
            ->delete();

        return response()->json([
            'success' => true,
            'message' => "Cleared {$deleted} read notifications",
        ]);
    }

    /**
     * Generate system notifications (checks for low stock, pending approvals, etc.)
     */
    public function generate()
    {
        $user = Auth::user();

        $generated = \App\Services\NotificationService::generateSystemNotifications($user->tenant_id);

        return response()->json([
            'success' => true,
            'message' => count($generated) . ' notifications generated',
            'data' => array_map(fn($n) => $n->toApiArray(), $generated),
        ]);
    }
}
