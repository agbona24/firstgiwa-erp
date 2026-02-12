<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\PurchaseOrder;
use App\Models\Expense;
use App\Models\ProductionRun;
use App\Models\Payment;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    /**
     * Create a notification
     */
    public static function create(array $data): Notification
    {
        $iconData = Notification::getIconForType($data['type'] ?? Notification::TYPE_SYSTEM);

        return Notification::create([
            'tenant_id' => $data['tenant_id'],
            'user_id' => $data['user_id'] ?? null,
            'type' => $data['type'] ?? Notification::TYPE_SYSTEM,
            'title' => $data['title'],
            'message' => $data['message'] ?? null,
            'icon' => $data['icon'] ?? $iconData['icon'],
            'icon_color' => $data['icon_color'] ?? $iconData['color'],
            'action_url' => $data['action_url'] ?? null,
            'reference_type' => $data['reference_type'] ?? null,
            'reference_id' => $data['reference_id'] ?? null,
            'data' => $data['data'] ?? null,
        ]);
    }

    /**
     * Notify about low stock
     */
    public static function notifyLowStock(Product $product, int $currentQty): Notification
    {
        $level = $currentQty <= $product->critical_level ? 'critically low' : 'low';
        
        return self::create([
            'tenant_id' => $product->tenant_id,
            'type' => Notification::TYPE_STOCK,
            'title' => "{$product->name} is {$level}",
            'message' => "Current stock: {$currentQty} {$product->unit_of_measure}. Reorder level: {$product->reorder_level}",
            'action_url' => '/inventory',
            'reference_type' => Product::class,
            'reference_id' => $product->id,
            'data' => [
                'product_id' => $product->id,
                'product_sku' => $product->sku,
                'current_qty' => $currentQty,
                'reorder_level' => $product->reorder_level,
                'critical_level' => $product->critical_level,
            ],
        ]);
    }

    /**
     * Notify about pending approval
     */
    public static function notifyPendingApproval($model, string $type, ?int $userId = null): Notification
    {
        $typeLabels = [
            'sales_order' => 'Sales Order',
            'purchase_order' => 'Purchase Order',
            'expense' => 'Expense',
        ];

        $label = $typeLabels[$type] ?? 'Item';
        $number = $model->order_number ?? $model->po_number ?? $model->expense_number ?? "#{$model->id}";

        return self::create([
            'tenant_id' => $model->tenant_id,
            'user_id' => $userId,
            'type' => Notification::TYPE_APPROVAL,
            'title' => "{$label} {$number} pending approval",
            'message' => "Amount: " . number_format($model->total_amount ?? 0, 2),
            'action_url' => "/{$type}s/{$model->id}",
            'reference_type' => get_class($model),
            'reference_id' => $model->id,
        ]);
    }

    /**
     * Notify about overdue payment
     */
    public static function notifyOverduePayment($salesOrder): Notification
    {
        $customerName = $salesOrder->customer->name ?? 'Unknown';
        $daysOverdue = now()->diffInDays($salesOrder->delivery_date ?? $salesOrder->order_date);

        return self::create([
            'tenant_id' => $salesOrder->tenant_id,
            'type' => Notification::TYPE_PAYMENT,
            'title' => "Payment overdue: {$salesOrder->order_number}",
            'message' => "{$customerName} - {$daysOverdue} days overdue. Amount: " . number_format($salesOrder->total_amount, 2),
            'action_url' => '/payments',
            'reference_type' => SalesOrder::class,
            'reference_id' => $salesOrder->id,
            'data' => [
                'customer_id' => $salesOrder->customer_id,
                'customer_name' => $customerName,
                'days_overdue' => $daysOverdue,
                'amount' => $salesOrder->total_amount,
            ],
        ]);
    }

    /**
     * Notify about production completion
     */
    public static function notifyProductionComplete(ProductionRun $run): Notification
    {
        $productName = $run->finishedProduct->name ?? 'Unknown Product';
        $unitOfMeasure = $run->finishedProduct->unit_of_measure ?? 'units';

        return self::create([
            'tenant_id' => $run->tenant_id,
            'type' => Notification::TYPE_PRODUCTION,
            'title' => "Production run {$run->batch_number} completed",
            'message' => "{$productName} - Output: {$run->actual_output} {$unitOfMeasure}",
            'action_url' => "/production/{$run->id}",
            'reference_type' => ProductionRun::class,
            'reference_id' => $run->id,
        ]);
    }

    /**
     * Notify about new order
     */
    public static function notifyNewOrder(SalesOrder $order): Notification
    {
        $customerName = $order->customer->name ?? 'Unknown';

        return self::create([
            'tenant_id' => $order->tenant_id,
            'type' => Notification::TYPE_ORDER,
            'title' => "New order {$order->order_number}",
            'message' => "{$customerName} - " . number_format($order->total_amount, 2),
            'action_url' => "/sales-orders/{$order->id}",
            'reference_type' => SalesOrder::class,
            'reference_id' => $order->id,
        ]);
    }

    /**
     * Generate system notifications (called by scheduler)
     */
    public static function generateSystemNotifications(int $tenantId): array
    {
        $generated = [];

        // Check low stock products
        $lowStockProducts = Product::where('tenant_id', $tenantId)
            ->where('track_inventory', true)
            ->where('is_active', true)
            ->whereHas('inventory', function ($q) {
                $q->whereRaw('quantity <= products.reorder_level');
            })
            ->with('inventory')
            ->get();

        foreach ($lowStockProducts as $product) {
            $totalQty = $product->inventory->sum('quantity');
            
            // Check if notification already exists for this product (within last 24 hours)
            $exists = Notification::where('tenant_id', $tenantId)
                ->where('type', Notification::TYPE_STOCK)
                ->where('reference_type', Product::class)
                ->where('reference_id', $product->id)
                ->where('created_at', '>=', now()->subDay())
                ->exists();

            if (!$exists) {
                $generated[] = self::notifyLowStock($product, $totalQty);
            }
        }

        // Check pending approvals
        $pendingSales = SalesOrder::where('tenant_id', $tenantId)
            ->where('status', 'pending_approval')
            ->get();

        foreach ($pendingSales as $order) {
            $exists = Notification::where('tenant_id', $tenantId)
                ->where('type', Notification::TYPE_APPROVAL)
                ->where('reference_type', SalesOrder::class)
                ->where('reference_id', $order->id)
                ->whereNull('read_at')
                ->exists();

            if (!$exists) {
                $generated[] = self::notifyPendingApproval($order, 'sales_order');
            }
        }

        // Check overdue payments
        $overdueOrders = SalesOrder::where('tenant_id', $tenantId)
            ->where('payment_status', '!=', 'paid')
            ->where('status', 'completed')
            ->where(function ($q) {
                $q->where('delivery_date', '<', now()->subDays(30))
                  ->orWhere(function ($q2) {
                      $q2->whereNull('delivery_date')
                         ->where('order_date', '<', now()->subDays(30));
                  });
            })
            ->with('customer')
            ->get();

        foreach ($overdueOrders as $order) {
            $exists = Notification::where('tenant_id', $tenantId)
                ->where('type', Notification::TYPE_PAYMENT)
                ->where('reference_type', SalesOrder::class)
                ->where('reference_id', $order->id)
                ->where('created_at', '>=', now()->subDays(7))
                ->exists();

            if (!$exists) {
                $generated[] = self::notifyOverduePayment($order);
            }
        }

        return $generated;
    }

    /**
     * Cleanup old notifications
     */
    public static function cleanup(int $tenantId, int $daysToKeep = 30): int
    {
        return Notification::where('tenant_id', $tenantId)
            ->where('created_at', '<', now()->subDays($daysToKeep))
            ->whereNotNull('read_at')
            ->delete();
    }
}
