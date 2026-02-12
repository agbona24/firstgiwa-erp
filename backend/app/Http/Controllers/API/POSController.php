<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Traits\UsesBranch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Inventory;
use App\Models\StockMovement;
use App\Models\Payment;
use App\Models\POSTicket;
use App\Models\CashierSession;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class POSController extends Controller
{
    use UsesBranch;
    
    /**
     * Get products for POS display
     */
    public function products(Request $request)
    {
        $tenantId = $this->getTenantId();
        $branchId = $this->getBranchId($request);

        // Check if there is actual INVENTORY in warehouses for this branch
        // (not just if warehouses exist, but if they have stock)
        $warehouseIdsForBranch = Warehouse::where('tenant_id', $tenantId)
            ->where('branch_id', $branchId)
            ->pluck('id')
            ->toArray();
        
        $hasInventoryForBranch = !empty($warehouseIdsForBranch) && 
            Inventory::whereIn('warehouse_id', $warehouseIdsForBranch)
                ->where('quantity', '>', 0)
                ->exists();

        $query = Product::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->with(['category', 'inventories' => function ($q) use ($tenantId, $hasInventoryForBranch, $warehouseIdsForBranch) {
                // Get inventory from warehouses
                $q->whereHas('warehouse', function ($wq) use ($tenantId, $hasInventoryForBranch, $warehouseIdsForBranch) {
                    $wq->where('tenant_id', $tenantId);
                    // Only filter by branch if there's actual inventory for this branch
                    if ($hasInventoryForBranch && !empty($warehouseIdsForBranch)) {
                        $wq->whereIn('id', $warehouseIdsForBranch);
                    }
                });
            }]);

        // Filter by category
        if ($request->has('category_id') && $request->category_id !== 'all') {
            $query->where('category_id', $request->category_id);
        }

        // Search by name or barcode
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $products = $query->get()->map(function ($product) {
            // Calculate total stock across all warehouses for this branch
            $stock = $product->inventories->sum('quantity');
            $lowStockThreshold = $product->reorder_level ?? 10;

            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'price' => (float) $product->selling_price,
                'cost_price' => (float) $product->cost_price,
                'stock' => $stock,
                'category' => $product->category?->slug ?? 'uncategorized',
                'category_id' => $product->category_id,
                'category_name' => $product->category?->name ?? 'Uncategorized',
                'lowStockThreshold' => $lowStockThreshold,
                'unit' => $product->unit,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    /**
     * Get categories for POS filter
     */
    public function categories(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;

        $categories = Category::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        // Add "All Products" as first option
        $result = collect([
            ['id' => 'all', 'name' => 'All Products', 'slug' => 'all']
        ])->concat($categories);

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    /**
     * Get customers for POS selection
     */
    public function customers(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;

        // Fields needed for POS including credit info
        $customerFields = ['id', 'name', 'phone', 'email', 'customer_type', 'credit_limit', 'outstanding_balance', 'credit_blocked', 'payment_terms_days'];

        $query = Customer::where('tenant_id', $tenantId)
            ->where('is_active', true);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Get walk-in customer first, then other customers
        $walkInCustomer = Customer::where('tenant_id', $tenantId)
            ->where('customer_type', 'walk-in')
            ->first($customerFields);
        
        $customers = $query->where('customer_type', '!=', 'walk-in')
            ->orderBy('name')
            ->take(50)
            ->get($customerFields);

        // Put walk-in customer first if it exists
        if ($walkInCustomer) {
            $result = collect([$walkInCustomer])->concat($customers);
        } else {
            $result = $customers;
        }

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    /**
     * Create a POS sale
     */
    public function createSale(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,card,transfer,split,credit',
            'discount' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|in:percentage,fixed',
            'customer_id' => 'required|exists:customers,id',
            'amount_received' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $tenantId = Auth::user()->tenant_id;
        $branchId = $request->input('branch_id', Auth::user()->branch_id);
        $user = Auth::user();

        // Check if credit sale and validate customer credit
        $isCredit = $request->payment_method === 'credit';
        $customer = Customer::find($request->customer_id);
        
        if ($isCredit) {
            if (!$customer->isCreditAllowed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credit is not allowed for this customer',
                ], 422);
            }
        }

        try {
            DB::beginTransaction();

            // Calculate totals
            $subtotal = 0;
            $items = $request->items;
            
            foreach ($items as $item) {
                $subtotal += $item['price'] * $item['quantity'];
            }

            // Calculate discount
            $discountAmount = 0;
            if ($request->discount) {
                if ($request->discount_type === 'percentage') {
                    $discountAmount = $subtotal * ($request->discount / 100);
                } else {
                    $discountAmount = $request->discount;
                }
            }

            // Calculate tax using rate from request (or no tax if not provided)
            $taxRate = $request->input('tax_rate', 0);
            $taxAmount = ($subtotal - $discountAmount) * $taxRate;
            $total = $subtotal - $discountAmount + $taxAmount;

            // Generate order number
            $lastOrder = SalesOrder::where('tenant_id', $tenantId)
                ->whereDate('created_at', today())
                ->orderBy('id', 'desc')
                ->first();
            $sequence = $lastOrder ? (intval(substr($lastOrder->order_number, -4)) + 1) : 1;
            $orderNumber = 'POS-' . now()->format('Ymd') . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);

            // Map payment method to payment type
            $paymentTypeMap = [
                'cash' => 'cash',
                'card' => 'card',
                'transfer' => 'transfer',
                'split' => 'cash', // Default to cash for split payments
                'credit' => 'credit',
            ];
            $paymentType = $paymentTypeMap[$request->payment_method] ?? 'cash';

            // Determine payment status based on payment method
            $paymentStatus = $isCredit ? 'pending' : 'paid';

            // Create sales order
            $salesOrder = SalesOrder::create([
                'tenant_id' => $tenantId,
                'branch_id' => $branchId,
                'order_number' => $orderNumber,
                'customer_id' => $request->customer_id,
                'order_type' => 'pos',
                'status' => 'completed',
                'payment_status' => $paymentStatus,
                'payment_type' => $paymentType,
                'subtotal' => $subtotal,
                'discount_type' => $request->discount_type ?? 'fixed',
                'discount_value' => $request->discount ?? 0,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'total_amount' => $total,
                'order_date' => now(),
                'notes' => $request->notes,
                'created_by' => $user->id,
            ]);

            // Create order items and update inventory
            foreach ($items as $item) {
                $itemTotal = $item['price'] * $item['quantity'];
                $itemTax = $itemTotal * $taxRate;
                
                // Create order item
                SalesOrderItem::create([
                    'sales_order_id' => $salesOrder->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'],
                    'discount_percent' => 0,
                    'discount_amount' => 0,
                    'tax_percent' => $taxRate * 100,
                    'tax_amount' => $itemTax,
                    'total_amount' => $itemTotal,
                ]);

                // Update inventory (reduce stock)
                $inventory = Inventory::where('product_id', $item['product_id'])
                    ->whereHas('warehouse', function ($q) use ($branchId) {
                        $q->where('branch_id', $branchId);
                    })
                    ->first();

                if ($inventory) {
                    $previousQty = $inventory->quantity;
                    $inventory->quantity -= $item['quantity'];
                    $inventory->save();

                    // Record inventory transaction
                    StockMovement::create([
                        'tenant_id' => $tenantId,
                        'inventory_id' => $inventory->id,
                        'product_id' => $item['product_id'],
                        'warehouse_id' => $inventory->warehouse_id,
                        'transaction_type' => 'sale',
                        'quantity' => -$item['quantity'],
                        'previous_quantity' => $previousQty,
                        'new_quantity' => $inventory->quantity,
                        'reference_type' => 'sales_order',
                        'reference_id' => $salesOrder->id,
                        'notes' => "POS Sale: {$orderNumber}",
                        'created_by' => $user->id,
                    ]);
                }
            }

            // Create payment record or credit transaction
            if ($isCredit) {
                // Create credit transaction for tracking
                $creditService = app(\App\Services\CreditAnalysisService::class);
                $creditTransaction = $creditService->createTransaction($customer, $total, [
                    'sales_order_id' => $salesOrder->id,
                    'notes' => "POS Credit Sale: {$orderNumber}",
                ]);
            } else {
                // Create immediate payment record
                $paymentReference = 'PAY-' . now()->format('Ymd') . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
                Payment::create([
                    'tenant_id' => $tenantId,
                    'branch_id' => $branchId,
                    'payment_reference' => $paymentReference,
                    'payable_type' => SalesOrder::class,
                    'payable_id' => $salesOrder->id,
                    'customer_id' => $request->customer_id,
                    'payment_type' => 'received',
                    'payment_method' => $request->payment_method,
                    'amount' => $total,
                    'payment_date' => now(),
                    'status' => 'completed',
                    'transaction_reference' => $orderNumber,
                    'notes' => 'POS Sale Payment',
                    'recorded_by' => $user->id,
                ]);
            }

            DB::commit();

            // Create notification for POS sale
            try {
                $customerName = $request->customer_id 
                    ? Customer::find($request->customer_id)?->name ?? 'Walk-in Customer'
                    : 'Walk-in Customer';
                
                NotificationService::create([
                    'tenant_id' => $tenantId,
                    'type' => 'order',
                    'title' => 'New POS Sale',
                    'message' => "POS sale {$orderNumber} completed for {$customerName} - ₦" . number_format($total, 2),
                    'icon' => 'shopping-cart',
                    'action_url' => "/sales-orders?id={$salesOrder->id}",
                    'reference_type' => 'sales_order',
                    'reference_id' => $salesOrder->id,
                    'data' => [
                        'order_number' => $orderNumber,
                        'customer_name' => $customerName,
                        'total' => $total,
                        'payment_method' => $request->payment_method,
                    ]
                ]);
            } catch (\Exception $e) {
                // Log notification error but don't fail the sale
                \Log::warning('Failed to create POS sale notification: ' . $e->getMessage());
            }

            // Prepare receipt data
            $receipt = [
                'id' => $orderNumber,
                'date' => now()->format('M d, Y h:i A'),
                'customer' => $request->customer_id 
                    ? Customer::find($request->customer_id, ['id', 'name', 'phone']) 
                    : ['id' => null, 'name' => 'Walk-in Customer', 'phone' => ''],
                'items' => $items,
                'subtotal' => $subtotal,
                'discount' => $discountAmount,
                'tax' => $taxAmount,
                'taxName' => $request->input('tax_name', 'Tax'),
                'total' => $total,
                'paymentMethod' => $request->payment_method,
                'amountReceived' => $request->amount_received ?? $total,
                'change' => ($request->amount_received ?? $total) - $total,
                'cashier' => $user->name,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Sale completed successfully',
                'data' => [
                    'order_id' => $salesOrder->id,
                    'order_number' => $orderNumber,
                    'receipt' => $receipt
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to process sale: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save order as ticket (pending payment)
     */
    public function saveTicket(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.name' => 'required|string',
            'customer_id' => 'required|exists:customers,id',
            'discount' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|in:percentage,fixed',
        ]);

        $tenantId = Auth::user()->tenant_id;
        $branchId = $request->input('branch_id', Auth::user()->branch_id);
        $user = Auth::user();

        // Calculate totals
        $subtotal = 0;
        foreach ($request->items as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }

        $discountAmount = 0;
        if ($request->discount) {
            if ($request->discount_type === 'percentage') {
                $discountAmount = $subtotal * ($request->discount / 100);
            } else {
                $discountAmount = $request->discount;
            }
        }

        // Use tax rate from request (or no tax if not provided)
        $taxRate = $request->input('tax_rate', 0);
        $taxAmount = ($subtotal - $discountAmount) * $taxRate;
        $total = $subtotal - $discountAmount + $taxAmount;

        // Generate ticket number
        $ticketNumber = 'TKT-' . time();

        $ticket = POSTicket::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'ticket_number' => $ticketNumber,
            'customer_id' => $request->customer_id,
            'items' => $request->items,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'total_amount' => $total,
            'status' => 'pending',
            'created_by' => $user->id,
        ]);

        $customer = Customer::find($request->customer_id, ['id', 'name', 'phone']);

        return response()->json([
            'success' => true,
            'message' => 'Order ticket saved successfully',
            'data' => [
                'id' => $ticket->ticket_number,
                'date' => $ticket->created_at->format('M d, Y h:i A'),
                'customer' => $customer,
                'items' => $request->items,
                'subtotal' => $subtotal,
                'discount' => $discountAmount,
                'tax' => $taxAmount,
                'taxName' => $request->input('tax_name', 'Tax'),
                'total' => $total,
                'status' => 'pending'
            ]
        ]);
    }

    /**
     * Get pending tickets
     */
    public function tickets(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        $branchId = $request->input('branch_id', Auth::user()->branch_id);

        $tickets = POSTicket::where('tenant_id', $tenantId)
            ->where('branch_id', $branchId)
            ->where('status', 'pending')
            ->with('customer:id,name,phone')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => $ticket->ticket_number,
                    'date' => $ticket->created_at->format('M d, Y h:i A'),
                    'customer' => $ticket->customer,
                    'items' => $ticket->items,
                    'subtotal' => (float) $ticket->subtotal,
                    'discount' => (float) $ticket->discount_amount,
                    'tax' => (float) $ticket->tax_amount,
                    'total' => (float) $ticket->total_amount,
                    'status' => $ticket->status
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $tickets
        ]);
    }

    /**
     * Resume a ticket (load into cart)
     */
    public function resumeTicket(Request $request, $ticketNumber)
    {
        $tenantId = Auth::user()->tenant_id;

        $ticket = POSTicket::where('tenant_id', $tenantId)
            ->where('ticket_number', $ticketNumber)
            ->where('status', 'pending')
            ->with('customer:id,name,phone')
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found or already processed'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $ticket->ticket_number,
                'customer' => $ticket->customer,
                'items' => $ticket->items,
                'discount' => (float) $ticket->discount_amount,
            ]
        ]);
    }

    /**
     * Cancel a ticket
     */
    public function cancelTicket(Request $request, $ticketNumber)
    {
        $tenantId = Auth::user()->tenant_id;

        $ticket = POSTicket::where('tenant_id', $tenantId)
            ->where('ticket_number', $ticketNumber)
            ->where('status', 'pending')
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found or already processed'
            ], 404);
        }

        $ticket->status = 'cancelled';
        $ticket->save();

        return response()->json([
            'success' => true,
            'message' => 'Ticket cancelled successfully'
        ]);
    }

    /**
     * Complete a ticket (convert to sale)
     */
    public function completeTicket(Request $request, $ticketNumber)
    {
        $tenantId = Auth::user()->tenant_id;

        $ticket = POSTicket::where('tenant_id', $tenantId)
            ->where('ticket_number', $ticketNumber)
            ->where('status', 'pending')
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found or already processed'
            ], 404);
        }

        // Prepare request data for createSale
        $saleRequest = new Request([
            'items' => collect($ticket->items)->map(function ($item) {
                return [
                    'product_id' => $item['id'] ?? $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                ];
            })->toArray(),
            'customer_id' => $ticket->customer_id,
            'payment_method' => $request->payment_method ?? 'cash',
            'amount_received' => $request->amount_received ?? $ticket->total_amount,
            'discount' => $ticket->discount_amount,
            'discount_type' => 'fixed',
            'branch_id' => $ticket->branch_id,
        ]);

        $response = $this->createSale($saleRequest);
        $responseData = json_decode($response->getContent(), true);

        if ($responseData['success']) {
            // Mark ticket as completed
            $ticket->status = 'completed';
            $ticket->save();
        }

        return $response;
    }

    /**
     * Get POS summary for dashboard
     */
    public function summary(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        $branchId = $request->input('branch_id', Auth::user()->branch_id);
        $today = now()->startOfDay();

        // Today's sales
        $todaySales = SalesOrder::where('tenant_id', $tenantId)
            ->where('branch_id', $branchId)
            ->where('order_type', 'pos')
            ->where('status', 'completed')
            ->whereDate('created_at', $today)
            ->selectRaw('COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total')
            ->first();

        // Pending tickets
        $pendingTickets = POSTicket::where('tenant_id', $tenantId)
            ->where('branch_id', $branchId)
            ->where('status', 'pending')
            ->count();

        // Low stock products
        $lowStockCount = Product::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereHas('inventories', function ($q) use ($branchId) {
                $q->whereHas('warehouse', function ($wq) use ($branchId) {
                    $wq->where('branch_id', $branchId);
                })->whereColumn('quantity', '<=', 'products.reorder_level');
            })
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'today_sales_count' => $todaySales->count ?? 0,
                'today_sales_total' => (float) ($todaySales->total ?? 0),
                'pending_tickets' => $pendingTickets,
                'low_stock_count' => $lowStockCount,
            ]
        ]);
    }

    // ==========================================
    // CASHIER SESSION / REGISTER MANAGEMENT
    // ==========================================

    /**
     * Get current active session for the logged-in user
     */
    public function getActiveSession(Request $request)
    {
        $user = $request->user();
        
        $session = CashierSession::where('tenant_id', $user->tenant_id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->with(['branch', 'user'])
            ->first();

        return response()->json([
            'success' => true,
            'data' => $session,
            'has_active_session' => $session !== null,
        ]);
    }

    /**
     * Open a new register/shift session
     */
    public function openRegister(Request $request)
    {
        $validated = $request->validate([
            'opening_cash' => 'required|numeric|min:0',
            'terminal_id' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $branchId = $this->getBranchId($request);

        // Check if user already has an active session
        $existingSession = CashierSession::where('tenant_id', $user->tenant_id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if ($existingSession) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active register session. Please close it before opening a new one.',
                'data' => $existingSession->load(['branch', 'user']),
            ], 422);
        }

        try {
            $session = CashierSession::create([
                'tenant_id' => $user->tenant_id,
                'user_id' => $user->id,
                'branch_id' => $branchId,
                'terminal_id' => $validated['terminal_id'] ?? null,
                'opened_at' => now(),
                'opening_cash' => $validated['opening_cash'],
                'status' => 'active',
                'notes' => $validated['notes'] ?? null,
            ]);

            $session->load(['branch', 'user']);

            return response()->json([
                'success' => true,
                'message' => 'Register opened successfully',
                'data' => $session,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to open register: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Close the current register/shift session
     */
    public function closeRegister(Request $request)
    {
        $validated = $request->validate([
            'closing_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();

        // Find active session
        $session = CashierSession::where('tenant_id', $user->tenant_id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'No active register session found.',
            ], 404);
        }

        try {
            // Calculate sales totals for this session
            $salesTotals = $this->calculateSessionSales($session);
            
            // Update session with sales totals
            $session->updateSalesTotals($salesTotals);

            // Close the session
            $session->close(
                $validated['closing_cash'],
                $validated['notes'] ?? null,
                $user->id
            );

            $session->load(['branch', 'user', 'closedByUser']);

            // Prepare summary report
            $report = [
                'session_number' => $session->session_number,
                'cashier' => $session->user->name,
                'branch' => $session->branch->name,
                'opened_at' => $session->opened_at->format('Y-m-d H:i:s'),
                'closed_at' => $session->closed_at->format('Y-m-d H:i:s'),
                'duration_hours' => $session->duration,
                'opening_cash' => (float) $session->opening_cash,
                'closing_cash' => (float) $session->closing_cash,
                'expected_cash' => (float) $session->expected_cash,
                'cash_variance' => (float) $session->cash_variance,
                'variance_status' => $session->variance_status,
                'total_transactions' => $session->total_transactions,
                'total_sales' => (float) $session->total_sales,
                'cash_sales' => (float) $session->cash_sales,
                'card_sales' => (float) $session->card_sales,
                'transfer_sales' => (float) $session->transfer_sales,
                'total_refunds' => (float) $session->total_refunds,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Register closed successfully',
                'data' => $session,
                'report' => $report,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to close register: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get session history for current user
     */
    public function getSessionHistory(Request $request)
    {
        $user = $request->user();
        
        $query = CashierSession::where('tenant_id', $user->tenant_id)
            ->with(['branch', 'user', 'closedByUser']);

        // Filter by user (admins can see all)
        if (!$user->hasRole(['admin', 'super-admin', 'manager'])) {
            $query->where('user_id', $user->id);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // Filter by branch
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('opened_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('opened_at', '<=', $request->input('date_to'));
        }

        $sessions = $query->orderBy('opened_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }

    /**
     * Get detailed session report
     */
    public function getSessionReport(Request $request, $sessionId)
    {
        $user = $request->user();

        $session = CashierSession::where('tenant_id', $user->tenant_id)
            ->with(['branch', 'user', 'closedByUser'])
            ->findOrFail($sessionId);

        // Check permission
        if (!$user->hasRole(['admin', 'super-admin', 'manager']) && $session->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to view this session.',
            ], 403);
        }

        // Get transactions for this session
        $transactions = SalesOrder::where('tenant_id', $user->tenant_id)
            ->where('created_by', $session->user_id)
            ->whereBetween('created_at', [$session->opened_at, $session->closed_at ?? now()])
            ->where('order_type', 'pos')
            ->with(['customer', 'payments'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'session' => $session,
                'transactions' => $transactions,
                'summary' => [
                    'total_transactions' => $transactions->count(),
                    'total_sales' => $transactions->sum('total_amount'),
                    'average_transaction' => $transactions->count() > 0 
                        ? $transactions->sum('total_amount') / $transactions->count() 
                        : 0,
                ],
            ],
        ]);
    }

    /**
     * Calculate sales totals for a session
     */
    protected function calculateSessionSales(CashierSession $session): array
    {
        $user = $session->user;
        
        // Get all POS sales made by this user during this session
        $sales = SalesOrder::where('tenant_id', $session->tenant_id)
            ->where('created_by', $session->user_id)
            ->where('branch_id', $session->branch_id)
            ->whereBetween('created_at', [$session->opened_at, now()])
            ->where('order_type', 'pos')
            ->whereIn('status', ['approved', 'completed', 'fulfilled'])
            ->with('payments')
            ->get();

        $totals = [
            'total_transactions' => $sales->count(),
            'total_sales' => 0,
            'cash_sales' => 0,
            'card_sales' => 0,
            'transfer_sales' => 0,
            'total_refunds' => 0,
        ];

        foreach ($sales as $sale) {
            $totals['total_sales'] += $sale->total_amount;

            // Categorize by payment method
            foreach ($sale->payments as $payment) {
                switch ($payment->payment_method) {
                    case 'cash':
                        $totals['cash_sales'] += $payment->amount;
                        break;
                    case 'card':
                    case 'pos':
                        $totals['card_sales'] += $payment->amount;
                        break;
                    case 'bank_transfer':
                    case 'transfer':
                        $totals['transfer_sales'] += $payment->amount;
                        break;
                }
            }
        }

        // Calculate refunds
        // TODO: Add refund calculation if refunds table exists

        return $totals;
    }
}
