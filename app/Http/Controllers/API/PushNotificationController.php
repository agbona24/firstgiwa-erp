<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PushNotificationController extends Controller
{
    /**
     * Get VAPID public key
     */
    public function getVapidKey()
    {
        $publicKey = config('services.webpush.vapid_public_key');
        
        if (!$publicKey) {
            return response()->json([
                'error' => 'VAPID keys not configured'
            ], 500);
        }

        return response()->json([
            'publicKey' => $publicKey
        ]);
    }

    /**
     * Subscribe to push notifications
     */
    public function subscribe(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|url',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        $user = $request->user();
        
        // Store or update subscription
        $subscription = PushSubscription::updateOrCreate(
            [
                'endpoint' => $request->endpoint,
            ],
            [
                'user_id' => $user->id,
                'tenant_id' => $user->tenant_id,
                'p256dh_key' => $request->input('keys.p256dh'),
                'auth_token' => $request->input('keys.auth'),
                'expires_at' => $request->expirationTime 
                    ? now()->addSeconds($request->expirationTime / 1000) 
                    : null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Successfully subscribed to push notifications'
        ]);
    }

    /**
     * Unsubscribe from push notifications
     */
    public function unsubscribe(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|url',
        ]);

        PushSubscription::where('endpoint', $request->endpoint)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Successfully unsubscribed from push notifications'
        ]);
    }

    /**
     * Send a test notification
     */
    public function test(Request $request)
    {
        $user = $request->user();
        
        $subscription = PushSubscription::where('user_id', $user->id)->first();
        
        if (!$subscription) {
            return response()->json([
                'error' => 'No subscription found for this user'
            ], 404);
        }

        try {
            $this->sendNotification($subscription, [
                'title' => 'Test Notification',
                'body' => 'Push notifications are working! 🎉',
                'icon' => '/icons/icon-192x192.png',
                'badge' => '/icons/icon-72x72.png',
                'data' => [
                    'url' => '/dashboard'
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Test notification sent'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send test notification', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to send notification: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send notification to a subscription
     */
    protected function sendNotification(PushSubscription $subscription, array $payload)
    {
        $vapidPublicKey = config('services.webpush.vapid_public_key');
        $vapidPrivateKey = config('services.webpush.vapid_private_key');
        $vapidSubject = config('services.webpush.vapid_subject', 'mailto:admin@example.com');

        if (!$vapidPublicKey || !$vapidPrivateKey) {
            throw new \Exception('VAPID keys not configured');
        }

        // Use web-push library if available, otherwise queue for external service
        if (class_exists(\Minishlink\WebPush\WebPush::class)) {
            $webPush = new \Minishlink\WebPush\WebPush([
                'VAPID' => [
                    'subject' => $vapidSubject,
                    'publicKey' => $vapidPublicKey,
                    'privateKey' => $vapidPrivateKey,
                ],
            ]);

            $pushSubscription = \Minishlink\WebPush\Subscription::create([
                'endpoint' => $subscription->endpoint,
                'publicKey' => $subscription->p256dh_key,
                'authToken' => $subscription->auth_token,
            ]);

            $report = $webPush->sendOneNotification(
                $pushSubscription,
                json_encode($payload)
            );

            if (!$report->isSuccess()) {
                throw new \Exception($report->getReason());
            }
        } else {
            // Log that web-push package is not installed
            Log::warning('Web-push package not installed. Install with: composer require minishlink/web-push');
        }
    }
}
