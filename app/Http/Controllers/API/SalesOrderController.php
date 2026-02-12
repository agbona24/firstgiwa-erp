<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SalesOrderService;
use App\Services\NotificationService;
use App\Http\Requests\SalesOrder\StoreSalesOrderRequest;
use App\Http\Requests\SalesOrder\UpdateSalesOrderRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Exceptions\CreditLimitExceededException;
use App\Exceptions\ApprovalRequiredException;
use Illuminate\Support\Facades\Auth;

class SalesOrderController extends Controller
{
    protected $salesOrderService;

    public function __construct(SalesOrderService $salesOrderService)
    {
        $this->salesOrderService = $salesOrderService;
    }

    /**
     * List sales orders
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'search', 'status', 'fulfillment_status', 'payment_type', 
            'customer_id', 'start_date', 'end_date', 'sort_by', 'sort_dir'
        ]);
        $perPage = $request->get('per_page', 15);

        $orders = $this->salesOrderService->list($filters, $perPage);

        return response()->json($orders);
    }

    /**
     * Store a new sales order
     */
    public function store(StoreSalesOrderRequest $request): JsonResponse
    {
        try {
            $order = $this->salesOrderService->create($request->validated());

            // Create notification for new sales order
            try {
                $tenantId = Auth::user()->tenant_id;
                $customerName = $order->customer->name ?? 'Customer';
                NotificationService::create([
                    'tenant_id' => $tenantId,
                    'type' => 'order',
                    'title' => 'New Sales Order',
                    'message' => "Sales order {$order->order_number} created for {$customerName} - ₦" . number_format($order->total_amount, 2),
                    'icon' => 'shopping-bag',
                    'action_url' => "/sales-orders?id={$order->id}",
                    'reference_type' => 'sales_order',
                    'reference_id' => $order->id,
                    'data' => [
                        'order_number' => $order->order_number,
                        'customer_name' => $customerName,
                        'total_amount' => $order->total_amount,
                        'status' => $order->status,
                    ]
                ]);
            } catch (\Exception $e) {
                \Log::warning('Failed to create sales order notification: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Sales order created successfully',
                'data' => $order,
            ], 201);

        } catch (CreditLimitExceededException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'credit_limit_exceeded',
            ], 422);

        } catch (ApprovalRequiredException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'approval_required',
                'data' => $order ?? null,
            ], 201); // Still created, but needs approval
        }
    }

    /**
     * Show sales order details
     */
    public function show(int $id): JsonResponse
    {
        $order = $this->salesOrderService->find($id);

        return response()->json(['data' => $order]);
    }

    /**
     * Approve a sales order
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $reason = $request->input('reason', 'Sales order approved');
        
        try {
            $order = $this->salesOrderService->approve($id, $reason);

            // Create notification for order approval
            try {
                $tenantId = Auth::user()->tenant_id;
                NotificationService::create([
                    'tenant_id' => $tenantId,
                    'type' => 'approval',
                    'title' => 'Sales Order Approved',
                    'message' => "Sales order {$order->order_number} has been approved",
                    'icon' => 'check-circle',
                    'action_url' => "/sales-orders?id={$order->id}",
                    'reference_type' => 'sales_order',
                    'reference_id' => $order->id
                ]);
            } catch (\Exception $e) {
                \Log::warning('Failed to create approval notification: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Sales order approved successfully',
                'data' => $order,
            ]);

        } catch (CreditLimitExceededException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'credit_limit_exceeded',
            ], 422);
        }
    }

    /**
     * Reject a sales order
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $reason = $request->input('reason', 'Sales order rejected');
        $order = $this->salesOrderService->reject($id, $reason);

        // Create notification for order rejection
        try {
            $tenantId = Auth::user()->tenant_id;
            NotificationService::create([
                'tenant_id' => $tenantId,
                'type' => 'approval',
                'title' => 'Sales Order Rejected',
                'message' => "Sales order {$order->order_number} has been rejected: {$reason}",
                'icon' => 'x-circle',
                'action_url' => "/sales-orders?id={$order->id}",
                'reference_type' => 'sales_order',
                'reference_id' => $order->id
            ]);
        } catch (\Exception $e) {
            \Log::warning('Failed to create rejection notification: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Sales order rejected successfully',
            'data' => $order,
        ]);
    }

    /**
     * Get pending orders
     */
    public function pending(Request $request): JsonResponse
    {
        $filters = array_merge(
            $request->only(['search', 'customer_id']),
            ['status' => 'pending']
        );
        $perPage = $request->get('per_page', 15);

        $orders = $this->salesOrderService->list($filters, $perPage);

        return response()->json($orders);
    }

    /**
     * Update fulfillment status of a sales order
     */
    public function fulfill(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'fulfillment_status' => 'required|in:awaiting,processing,shipped,delivered',
            'tracking_number' => 'nullable|string|max:100',
            'delivery_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $order = $this->salesOrderService->fulfill($id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Fulfillment status updated successfully',
                'data' => $order,
            ]);

        } catch (\App\Exceptions\BusinessRuleException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => 'business_rule_error',
            ], 422);
        }
    }
}
