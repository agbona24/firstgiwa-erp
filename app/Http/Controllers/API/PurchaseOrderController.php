<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Mail\PurchaseOrderMail;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Inventory;
use App\Models\Tenant;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of purchase orders.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PurchaseOrder::with(['supplier', 'warehouse', 'creator', 'approver', 'items.product']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Supplier filter
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->input('supplier_id'));
        }

        // Warehouse filter
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->input('warehouse_id'));
        }

        // Date range filter
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('order_date', [
                $request->input('start_date'),
                $request->input('end_date')
            ]);
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'order_date');
        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $perPage = $request->input('per_page', 15);
        $orders = $query->paginate($perPage);

        return response()->json($orders);
    }

    /**
     * Store a newly created purchase order.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date|after_or_equal:order_date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        DB::beginTransaction();
        try {
            // Calculate totals
            $subtotal = 0;
            $taxAmount = 0;

            foreach ($validated['items'] as $item) {
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $itemTax = $itemTotal * (($item['tax_rate'] ?? 0) / 100);
                $subtotal += $itemTotal;
                $taxAmount += $itemTax;
            }

            // Determine initial status based on approval workflow settings
            $totalAmount = $subtotal + $taxAmount;
            $requireApproval = Setting::get('approvals', 'purchase_order_require_approval', true);
            $approvalThreshold = Setting::get('approvals', 'purchase_order_threshold', 500000);
            
            $status = 'pending';
            $approvedBy = null;
            $approvedAt = null;
            
            // Auto-approve if approval is disabled or amount is below threshold
            if (!$requireApproval || $totalAmount <= $approvalThreshold) {
                $status = 'approved';
                $approvedBy = $request->user()->id;
                $approvedAt = now();
            }

            // Create purchase order
            $order = PurchaseOrder::create([
                'po_number' => $this->generatePoNumber(),
                'supplier_id' => $validated['supplier_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'status' => $status,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()->id,
                'approved_by' => $approvedBy,
                'approved_at' => $approvedAt,
            ]);

            // Create order items
            foreach ($validated['items'] as $item) {
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $itemTax = $itemTotal * (($item['tax_rate'] ?? 0) / 100);

                PurchaseOrderItem::create([
                    'purchase_order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity_ordered' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_percent' => $item['tax_rate'] ?? 0,
                    'tax_amount' => $itemTax,
                    'total_amount' => $itemTotal + $itemTax,
                    'quantity_received' => 0,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order created successfully',
                'data' => $order->load(['supplier', 'warehouse', 'items.product', 'creator']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create purchase order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified purchase order.
     */
    public function show(int $id): JsonResponse
    {
        $order = PurchaseOrder::with([
            'supplier',
            'warehouse',
            'items.product',
            'creator',
            'approver',
            'payments'
        ])->findOrFail($id);

        return response()->json(['data' => $order]);
    }

    /**
     * Update the specified purchase order.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $order = PurchaseOrder::findOrFail($id);

        // Can only update pending orders
        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Can only update pending purchase orders.',
            ], 422);
        }

        $validated = $request->validate([
            'supplier_id' => 'sometimes|required|exists:suppliers,id',
            'warehouse_id' => 'sometimes|required|exists:warehouses,id',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'sometimes|required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        DB::beginTransaction();
        try {
            // Update order details
            $order->update([
                'supplier_id' => $validated['supplier_id'] ?? $order->supplier_id,
                'warehouse_id' => $validated['warehouse_id'] ?? $order->warehouse_id,
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? $order->expected_delivery_date,
                'notes' => $validated['notes'] ?? $order->notes,
            ]);

            // Update items if provided
            if (isset($validated['items'])) {
                // Remove existing items
                $order->items()->delete();

                // Recalculate totals
                $subtotal = 0;
                $taxAmount = 0;

                foreach ($validated['items'] as $item) {
                    $itemTotal = $item['quantity'] * $item['unit_price'];
                    $itemTax = $itemTotal * (($item['tax_rate'] ?? 0) / 100);
                    $subtotal += $itemTotal;
                    $taxAmount += $itemTax;

                    PurchaseOrderItem::create([
                        'purchase_order_id' => $order->id,
                        'product_id' => $item['product_id'],
                        'quantity_ordered' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'tax_percent' => $item['tax_rate'] ?? 0,
                        'tax_amount' => $itemTax,
                        'total_amount' => $itemTotal + $itemTax,
                        'quantity_received' => 0,
                    ]);
                }

                $order->update([
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $subtotal + $taxAmount,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order updated successfully',
                'data' => $order->fresh(['supplier', 'warehouse', 'items.product']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update purchase order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified purchase order (soft delete).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $order = PurchaseOrder::findOrFail($id);

        // Can only delete pending orders
        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Can only delete pending purchase orders.',
            ], 422);
        }

        $order->delete();

        return response()->json([
            'message' => 'Purchase order deleted successfully',
        ]);
    }

    /**
     * Approve a purchase order.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $order = PurchaseOrder::findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending orders can be approved.',
            ], 422);
        }

        $order->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        // Log custom APPROVE action
        $order->logCustomAudit('APPROVE', null, [
            'approved_by' => $request->user()->name,
            'approved_at' => now()->toISOString(),
        ]);

        return response()->json([
            'message' => 'Purchase order approved successfully',
            'data' => $order->fresh(['supplier', 'warehouse', 'items.product', 'approver']),
        ]);
    }

    /**
     * Cancel a purchase order.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $order = PurchaseOrder::findOrFail($id);

        if (in_array($order->status, ['completed', 'cancelled'])) {
            return response()->json([
                'message' => 'Cannot cancel a completed or already cancelled order.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $order->update([
            'status' => 'cancelled',
            'cancelled_by' => $request->user()->id,
            'cancelled_at' => now(),
            'notes' => $order->notes . "\nCancellation reason: " . $validated['reason'],
        ]);

        // Log custom CANCEL action with reason
        $order->logCustomAudit('CANCEL', $validated['reason'], [
            'cancelled_by' => $request->user()->name,
            'cancelled_at' => now()->toISOString(),
        ]);

        return response()->json([
            'message' => 'Purchase order cancelled successfully',
            'data' => $order->fresh(),
        ]);
    }

    /**
     * Receive goods against a purchase order.
     */
    public function receive(Request $request, int $id): JsonResponse
    {
        $order = PurchaseOrder::findOrFail($id);

        if (!in_array($order->status, ['approved', 'partial'])) {
            return response()->json([
                'message' => 'Can only receive goods for approved or partially received orders.',
            ], 422);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:purchase_order_items,id',
            'items.*.quantity_received' => 'required|numeric|min:0',
            'actual_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $allReceived = true;

            foreach ($validated['items'] as $itemData) {
                $item = PurchaseOrderItem::findOrFail($itemData['item_id']);
                
                // Validate quantity
                $totalReceived = $item->quantity_received + $itemData['quantity_received'];
                if ($totalReceived > $item->quantity_ordered) {
                    return response()->json([
                        'message' => "Received quantity exceeds ordered quantity for product ID {$item->product_id}",
                    ], 422);
                }

                // Update item received quantity
                $item->update(['quantity_received' => $totalReceived]);

                // Update inventory
                if ($itemData['quantity_received'] > 0) {
                    $inventory = Inventory::firstOrCreate(
                        [
                            'product_id' => $item->product_id,
                            'warehouse_id' => $order->warehouse_id,
                        ],
                        ['quantity' => 0]
                    );
                    
                    $inventory->increment('quantity', $itemData['quantity_received']);
                }

                // Check if all items are fully received
                if ($totalReceived < $item->quantity_ordered) {
                    $allReceived = false;
                }
            }

            // Update order status
            $order->update([
                'status' => $allReceived ? 'completed' : 'partial',
                'actual_delivery_date' => $validated['actual_delivery_date'] ?? now(),
            ]);

            // Update supplier total purchases if completed
            if ($allReceived) {
                $order->supplier->increment('total_purchases', $order->total_amount);
                $order->supplier->increment('outstanding_balance', $order->total_amount);
            }

            DB::commit();

            return response()->json([
                'message' => $allReceived ? 'Goods fully received' : 'Goods partially received',
                'data' => $order->fresh(['items.product', 'supplier', 'warehouse']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to receive goods',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get pending purchase orders.
     */
    public function pending(Request $request): JsonResponse
    {
        $orders = PurchaseOrder::with(['supplier', 'warehouse', 'creator'])
            ->where('status', 'pending')
            ->orderBy('order_date', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($orders);
    }

    /**
     * Generate a unique PO number.
     */
    protected function generatePoNumber(): string
    {
        $prefix = 'PO';
        $date = now()->format('Ymd');
        $lastOrder = PurchaseOrder::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();
        
        $sequence = $lastOrder ? (intval(substr($lastOrder->po_number, -4)) + 1) : 1;
        
        return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate PDF for a purchase order.
     */
    public function downloadPdf(int $id): \Illuminate\Http\Response
    {
        $order = PurchaseOrder::with(['supplier', 'warehouse', 'items.product', 'creator'])
            ->findOrFail($id);
        
        // Get tenant from the user who created the order or current user
        $tenant = $order->creator?->tenant ?? Tenant::first();
        
        // Convert logo to base64 for PDF rendering
        $logoBase64 = $this->getLogoBase64($tenant);
        
        // Get currency - Use NGN for Naira as DomPDF doesn't support ₦ symbol
        $currencySymbol = Setting::get('company', 'currency_symbol', '₦');
        $currency = ($currencySymbol === '₦' || $currencySymbol === 'NGN') ? 'NGN ' : $currencySymbol;
        
        $pdf = Pdf::loadView('pdf.purchase-order', [
            'purchaseOrder' => $order,
            'supplier' => $order->supplier,
            'items' => $order->items,
            'tenant' => $tenant,
            'logoBase64' => $logoBase64,
            'currency' => $currency,
        ]);
        
        $pdf->setPaper('A4', 'portrait');
        
        return $pdf->download("PO-{$order->po_number}.pdf");
    }

    /**
     * Preview PDF (inline display).
     */
    public function previewPdf(int $id): \Illuminate\Http\Response
    {
        $order = PurchaseOrder::with(['supplier', 'warehouse', 'items.product', 'creator'])
            ->findOrFail($id);
        
        $tenant = $order->creator?->tenant ?? Tenant::first();
        
        // Convert logo to base64 for PDF rendering
        $logoBase64 = $this->getLogoBase64($tenant);
        
        // Get currency - Use NGN for Naira as DomPDF doesn't support ₦ symbol
        $currencySymbol = Setting::get('company', 'currency_symbol', '₦');
        $currency = ($currencySymbol === '₦' || $currencySymbol === 'NGN') ? 'NGN ' : $currencySymbol;
        
        $pdf = Pdf::loadView('pdf.purchase-order', [
            'purchaseOrder' => $order,
            'supplier' => $order->supplier,
            'items' => $order->items,
            'tenant' => $tenant,
            'logoBase64' => $logoBase64,
            'currency' => $currency,
        ]);
        
        $pdf->setPaper('A4', 'portrait');
        
        return $pdf->stream("PO-{$order->po_number}.pdf");
    }

    /**
     * Convert tenant logo to base64 for PDF rendering.
     */
    protected function getLogoBase64(?Tenant $tenant): ?string
    {
        if (!$tenant || empty($tenant->logo_url)) {
            return null;
        }
        
        try {
            // Handle different logo_url formats
            $logoPath = $tenant->logo_url;
            
            // If it's a relative URL (e.g., /storage/logos/logo.png)
            if (str_starts_with($logoPath, '/storage/')) {
                $logoPath = storage_path('app/public' . str_replace('/storage', '', $logoPath));
            } elseif (str_starts_with($logoPath, 'storage/')) {
                $logoPath = storage_path('app/public/' . str_replace('storage/', '', $logoPath));
            } elseif (str_starts_with($logoPath, 'http://') || str_starts_with($logoPath, 'https://')) {
                // For external URLs, try to fetch the image
                $imageContent = @file_get_contents($logoPath);
                if ($imageContent) {
                    $mimeType = $this->getMimeTypeFromContent($imageContent);
                    return 'data:' . $mimeType . ';base64,' . base64_encode($imageContent);
                }
                return null;
            } else {
                // Assume it's a path relative to public
                $logoPath = public_path($logoPath);
            }
            
            if (file_exists($logoPath)) {
                $imageContent = file_get_contents($logoPath);
                $mimeType = mime_content_type($logoPath) ?: 'image/png';
                return 'data:' . $mimeType . ';base64,' . base64_encode($imageContent);
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to load tenant logo: ' . $e->getMessage());
        }
        
        return null;
    }

    /**
     * Get MIME type from image content.
     */
    protected function getMimeTypeFromContent(string $content): string
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        return $finfo->buffer($content) ?: 'image/png';
    }

    /**
     * Send purchase order to supplier via email.
     */
    public function sendEmail(Request $request, int $id): JsonResponse
    {
        $order = PurchaseOrder::with(['supplier', 'warehouse', 'items.product', 'creator'])
            ->findOrFail($id);
        
        $supplier = $order->supplier;
        
        // Validate supplier has email
        if (empty($supplier->email)) {
            return response()->json([
                'message' => 'Supplier does not have an email address configured.',
            ], 422);
        }
        
        // Get tenant for company branding
        $tenant = $order->creator?->tenant ?? $request->user()?->tenant ?? Tenant::first();
        
        try {
            // Send the email with PDF attachment
            Mail::to($supplier->email)->send(new PurchaseOrderMail($order, $tenant));
            
            // Update order to mark email sent (optional: add a field for this)
            $order->update([
                'notes' => ($order->notes ? $order->notes . "\n" : '') . 
                           "Email sent to {$supplier->email} on " . now()->format('d M Y H:i'),
            ]);
            
            return response()->json([
                'message' => "Purchase order sent successfully to {$supplier->email}",
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send email',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
