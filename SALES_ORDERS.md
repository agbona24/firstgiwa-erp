# Sales Order System

## Overview
Comprehensive sales order management with:
- Multi-channel orders (Regular, POS, Wholesale)
- Complex order lifecycle tracking
- Payment tracking (full, partial, mixed)
- Fulfillment management
- Customer credit management
- Invoice generation
- Returns and refunds

---

## Sales Order Lifecycle

### Complete Status Flow

```
┌───────┐
│ DRAFT │ ← Order created, can be edited
└───┬───┘
    │ Submit / Save
    ▼
┌──────────────────┐
│ PENDING_PAYMENT  │ ← Awaiting payment
└────┬─────────────┘
     │ Partial payment
     ▼
┌──────────────────┐
│ PARTIALLY_PAID   │ ← Some payment received
└────┬─────────────┘
     │ Full payment
     ▼
┌──────┐
│ PAID │ ← Full amount paid
└──┬───┘
   │ Start fulfillment
   ▼
┌────────────┐
│ PROCESSING │ ← Picking/packing in progress
└─────┬──────┘
      │ All items fulfilled
      ▼
┌───────────┐
│ COMPLETED │ ← Order complete, inventory deducted
└───────────┘

Can cancel from DRAFT, PENDING_PAYMENT, PARTIALLY_PAID
      ▼
┌───────────┐
│ CANCELLED │
└───────────┘
```

### Parallel Status Tracking

Orders track THREE parallel statuses:

1. **Order Status**: Overall order state
   - draft, pending_payment, partially_paid, paid, processing, completed, cancelled

2. **Payment Status**: Payment state
   - unpaid, partially_paid, paid, refunded

3. **Fulfillment Status**: Delivery state
   - unfulfilled, processing, partially_fulfilled, fulfilled

---

## Customer Management

### Customer Master Data

```typescript
interface Customer {
  id: number
  code: string                    // CUST-001
  name: string
  email: string
  phone: string
  address: string

  // Customer Type
  customer_type: 'retail' | 'wholesale' | 'corporate'

  // Financial
  credit_limit: decimal
  credit_used: decimal            // Current outstanding
  payment_terms: number           // Days (0 = immediate)

  // Loyalty
  loyalty_points: number
  total_purchases: decimal
  last_purchase_date: date

  // Status
  status: 'active' | 'inactive' | 'suspended'
}
```

### Customer Credit Management

```typescript
async function checkCreditLimit(customerId: number, orderAmount: decimal): Promise<boolean> {
  const customer = await getCustomer(customerId)

  if (customer.customer_type === 'retail') {
    return true // No credit limit for retail
  }

  const availableCredit = customer.credit_limit - customer.credit_used

  if (orderAmount > availableCredit) {
    throw new CreditLimitExceededError(
      `Order amount ₦${orderAmount} exceeds available credit ₦${availableCredit}`
    )
  }

  return true
}

async function updateCreditUsed(customerId: number, amount: decimal, operation: 'increase' | 'decrease') {
  const customer = await getCustomer(customerId)

  const newCreditUsed = operation === 'increase'
    ? customer.credit_used + amount
    : customer.credit_used - amount

  await updateCustomer(customerId, {
    credit_used: Math.max(0, newCreditUsed)
  })
}
```

---

## Sales Order Creation

### Order Data Structure

```typescript
interface SalesOrder {
  id: number
  order_number: string            // ORD-2026-00001
  customer_id: number
  warehouse_id: number

  // Order Type
  order_type: 'regular' | 'pos' | 'wholesale'

  // Dates
  order_date: date
  delivery_date: date | null

  // Financial
  subtotal: decimal
  tax_amount: decimal
  discount_amount: decimal
  discount_percent: decimal
  shipping_cost: decimal
  total_amount: decimal
  amount_paid: decimal
  balance_due: decimal            // Computed: total - paid

  // Status (3 parallel statuses)
  status: OrderStatus
  payment_status: PaymentStatus
  fulfillment_status: FulfillmentStatus

  // Approval (for high-value orders or discounts)
  requires_approval: boolean
  approved_by: number | null
  approved_at: timestamp | null

  // Items
  items: OrderItem[]

  // Metadata
  notes: string                   // Customer-visible
  internal_notes: string          // Internal only
  created_by: number
  completed_at: timestamp | null
}

interface OrderItem {
  id: number
  sales_order_id: number
  product_id: number

  // Quantity
  quantity: decimal
  unit_id: number
  fulfilled_quantity: decimal

  // Pricing
  unit_price: decimal
  discount_percent: decimal
  discount_amount: decimal
  tax_percent: decimal
  tax_amount: decimal
  total_amount: decimal

  // Batch (if tracked)
  batch_number: string | null

  notes: string
}
```

### Order Creation Workflow

```
Step 1: Initialize Order
  Actor: Sales Officer / Cashier (for POS)
  Permission: sales.orders.create
  Actions:
    - Select/create customer
    - Select warehouse (source for inventory)
    - Set order type (regular, pos, wholesale)
    - Status: DRAFT

Step 2: Add Products
  - Select product from catalog
  - Enter quantity and unit
  - System shows: available stock, price, discounts
  - Line total calculated automatically

  Stock Validation:
    - Check available quantity in warehouse
    - If insufficient: warning or block (configurable)
    - Reserve stock option

Step 3: Apply Discounts
  Line-level discounts:
    - Percentage or fixed amount
    - Requires permission if > threshold (e.g., 10%)

  Order-level discounts:
    - Applied to subtotal
    - Requires approval if > threshold

Step 4: Calculate Totals
  - Subtotal: Sum of line totals
  - Discount: Line + order discounts
  - Tax: Applied to (subtotal - discount)
  - Shipping: Fixed or calculated
  - Total: Subtotal - discount + tax + shipping

Step 5: Save Order
  Options:
    a) Save as DRAFT: Can edit later
    b) Submit: Status → PENDING_PAYMENT (if unpaid)
    c) Save & Payment: Go to payment screen

Step 6: Approval (if required)
  Triggers approval if:
    - Total amount > threshold (e.g., ₦1M)
    - Discount > threshold (e.g., 15%)
    - Customer over credit limit

  Permission: sales.orders.approve
  Approver ≠ Creator

Step 7: Payment
  See Payments Module for details

Step 8: Fulfillment
  See below for fulfillment workflow
```

---

## Order Fulfillment Workflow

### Fulfillment Process

```
Step 1: Order Ready for Fulfillment
  Conditions:
    - Order status: PAID (full payment)
    - OR: PARTIALLY_PAID (if partial shipment allowed)
    - Stock available in warehouse

  Status: PAID → PROCESSING

Step 2: Pick Items
  Actor: Warehouse Staff
  - Generate pick list
  - Locate products in warehouse
  - For batch-tracked items: Pick FIFO (oldest batch first)
  - Verify quantities

Step 3: Pack Items
  - Pack items for delivery
  - Generate packing slip
  - Quality check

Step 4: Record Fulfillment
  For each order item:
    - Record fulfilled quantity
    - Record batch number (if tracked)
    - Update fulfilled_quantity

  If fulfilled_quantity == quantity for all items:
    - fulfillment_status: FULFILLED
    - Trigger inventory deduction
  Else:
    - fulfillment_status: PARTIALLY_FULFILLED

Step 5: Deduct Inventory (Automatic)
  For each fulfilled item:
    - Reduce inventory_stock.quantity
    - Reduce reserved_quantity (if was reserved)
    - Create stock_movements record (type: 'out')
    - Update product average cost (if FIFO costing)

Step 6: Generate Invoice
  - Create PDF invoice
  - Email to customer
  - Attach to order

Step 7: Complete Order
  When:
    - fulfillment_status: FULFILLED
    - payment_status: PAID
  Then:
    - status: PROCESSING → COMPLETED
    - completed_at: now
    - Cannot edit completed orders

Step 8: Delivery (Optional tracking)
  - Record delivery date
  - Delivery person
  - Customer signature (optional)
```

### Inventory Deduction Logic

```typescript
async function fulfillOrder(orderId: number, fulfillmentData: FulfillmentData) {
  const order = await getSalesOrder(orderId)

  // Validate order can be fulfilled
  if (order.payment_status !== 'paid' && !allowPartialFulfillment) {
    throw new Error('Order must be fully paid before fulfillment')
  }

  for (const item of fulfillmentData.items) {
    const orderItem = order.items.find(i => i.id === item.order_item_id)

    // Get stock (FIFO for batch-tracked items)
    const stock = await getStockForFulfillment(
      order.warehouse_id,
      orderItem.product_id,
      item.quantity_to_fulfill
    )

    if (!stock || stock.available_quantity < item.quantity_to_fulfill) {
      throw new InsufficientStockError(orderItem.product_id)
    }

    // Deduct from inventory
    await updateInventoryStock(stock.id, {
      quantity: stock.quantity - item.quantity_to_fulfill,
      reserved_quantity: stock.reserved_quantity - item.quantity_to_fulfill
    })

    // Record stock movement
    await createStockMovement({
      warehouse_id: order.warehouse_id,
      product_id: orderItem.product_id,
      batch_number: stock.batch_number,
      movement_type: 'out',
      quantity: item.quantity_to_fulfill,
      unit_id: orderItem.unit_id,
      reference_type: 'sales_order',
      reference_id: orderId,
      quantity_before: stock.quantity,
      quantity_after: stock.quantity - item.quantity_to_fulfill,
      created_by: fulfillmentData.fulfilled_by,
      remarks: `Sales Order ${order.order_number}`
    })

    // Update order item fulfilled quantity
    await updateOrderItem(orderItem.id, {
      fulfilled_quantity: orderItem.fulfilled_quantity + item.quantity_to_fulfill,
      batch_number: stock.batch_number
    })

    // Audit log
    await auditLog({
      action: 'UPDATE',
      entity_type: 'sales_order_fulfillment',
      entity_id: orderId,
      user_id: fulfillmentData.fulfilled_by,
      new_values: {
        fulfilled_quantity: item.quantity_to_fulfill,
        product_id: orderItem.product_id
      }
    })
  }

  // Update order fulfillment status
  await updateOrderFulfillmentStatus(orderId)

  // If fully fulfilled and paid, complete the order
  const updatedOrder = await getSalesOrder(orderId)
  if (updatedOrder.fulfillment_status === 'fulfilled' &&
      updatedOrder.payment_status === 'paid') {
    await updateSalesOrder(orderId, {
      status: 'completed',
      completed_at: new Date()
    })
  }
}

// FIFO stock selection for batch-tracked items
async function getStockForFulfillment(
  warehouseId: number,
  productId: number,
  quantityNeeded: decimal
): Promise<InventoryStock> {
  const stocks = await inventoryStock.find({
    warehouse_id: warehouseId,
    product_id: productId,
    available_quantity: { $gt: 0 }
  }).sort({
    expiry_date: 1,  // Oldest expiry first
    id: 1            // Then oldest receipt
  })

  // For simplicity, taking from first batch
  // In production, may need to split across batches
  return stocks[0]
}
```

---

## Partial Payments & Orders

### Handling Partial Payments

```typescript
interface PaymentScenario {
  order_total: decimal
  amount_paid: decimal
  balance_due: decimal
  payment_status: PaymentStatus
  can_fulfill: boolean
}

// Scenario 1: Full Payment
{
  order_total: 10000,
  amount_paid: 10000,
  balance_due: 0,
  payment_status: 'paid',
  can_fulfill: true
}

// Scenario 2: Partial Payment (50%)
{
  order_total: 10000,
  amount_paid: 5000,
  balance_due: 5000,
  payment_status: 'partially_paid',
  can_fulfill: false  // Or true, based on business rule
}

// Scenario 3: Overpayment (rare)
{
  order_total: 10000,
  amount_paid: 10500,
  balance_due: -500,  // Credit to customer
  payment_status: 'paid',
  can_fulfill: true
}
```

### Business Rules for Partial Payments

**Option A: Require Full Payment**
```typescript
const ALLOW_PARTIAL_FULFILLMENT = false

if (order.payment_status !== 'paid') {
  throw new Error('Order must be fully paid before fulfillment')
}
```

**Option B: Allow Partial Fulfillment**
```typescript
const ALLOW_PARTIAL_FULFILLMENT = true
const MINIMUM_PAYMENT_PERCENT = 50 // Must pay at least 50%

const paymentPercent = (order.amount_paid / order.total_amount) * 100

if (paymentPercent < MINIMUM_PAYMENT_PERCENT) {
  throw new Error(`Minimum ${MINIMUM_PAYMENT_PERCENT}% payment required for fulfillment`)
}

// Fulfill proportional to payment
const fulfillableQuantity = orderItem.quantity * (paymentPercent / 100)
```

---

## Order Modifications

### Editing Orders

**Rules**:
1. **DRAFT**: Fully editable
2. **PENDING_PAYMENT**: Can edit if no payment made
3. **PARTIALLY_PAID**: Cannot edit paid items, can add items
4. **PAID**: Cannot edit, must create credit note/refund
5. **COMPLETED**: Cannot edit, must create return

### Cancellation

```typescript
async function cancelOrder(orderId: number, userId: number, reason: string) {
  const order = await getSalesOrder(orderId)

  // Validation
  const cancellableStatuses = ['draft', 'pending_payment', 'partially_paid']
  if (!cancellableStatuses.includes(order.status)) {
    throw new Error('Order cannot be cancelled in current status')
  }

  if (order.fulfillment_status !== 'unfulfilled') {
    throw new Error('Cannot cancel order with fulfilled items')
  }

  // Permission check
  const user = await getUser(userId)
  if (!user.hasPermission('sales.orders.cancel')) {
    throw new Error('Insufficient permission to cancel orders')
  }

  // If partial payment, must refund first
  if (order.amount_paid > 0) {
    await initiateRefund(orderId, order.amount_paid, 'Order cancelled')
  }

  // Release stock reservation
  if (order.reserved_stock) {
    await releaseStockReservation(orderId)
  }

  // Update customer credit used
  if (order.payment_terms > 0) {
    await updateCreditUsed(order.customer_id, order.balance_due, 'decrease')
  }

  // Cancel order
  await updateSalesOrder(orderId, {
    status: 'cancelled',
    payment_status: 'refunded',
    cancelled_at: new Date(),
    cancelled_by: userId,
    cancellation_reason: reason
  })

  // Audit log
  await auditLog({
    action: 'CANCEL',
    entity_type: 'sales_order',
    entity_id: orderId,
    user_id: userId,
    reason: reason
  })

  // Notify customer
  await notifyCustomer(order.customer_id, {
    title: 'Order Cancelled',
    message: `Your order ${order.order_number} has been cancelled. Reason: ${reason}`
  })
}
```

---

## Returns & Refunds

### Return Process

```
Step 1: Customer Initiates Return
  - Customer contacts sales team
  - Return reason recorded
  - Return authorization number (RAN) generated

Step 2: Create Return Request
  Actor: Sales Officer
  - Select original order
  - Select items to return
  - Enter return quantities
  - Select return reason:
    * Damaged goods
    * Wrong item
    * Customer dissatisfaction
    * Quality issues
  - Upload photos (if damaged)

Step 3: Approve Return
  Permission: sales.refund.approve
  - Review return request
  - Approve or reject
  - If approved, generate RAN document

Step 4: Receive Returned Goods
  Actor: Warehouse Staff
  - Customer returns goods
  - Verify condition
  - Accept or reject based on policy
  - Update inventory (if goods are re-stockable)

Step 5: Process Refund
  See Payments Module - Refunds section

Step 6: Close Return
  - Return completed
  - Update order status if needed
```

---

## Invoicing

### Invoice Generation

```typescript
interface Invoice {
  id: number
  invoice_number: string          // INV-2026-00001
  sales_order_id: number

  // Dates
  invoice_date: date
  due_date: date

  // Amounts (from order)
  subtotal: decimal
  tax_amount: decimal
  discount_amount: decimal
  total_amount: decimal

  // Payment tracking
  amount_paid: decimal
  balance_due: decimal

  // Status
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

  // Metadata
  notes: string
  created_by: number
  sent_at: timestamp | null
}

async function generateInvoice(orderId: number): Promise<Invoice> {
  const order = await getSalesOrder(orderId)
  const customer = await getCustomer(order.customer_id)

  // Generate invoice number
  const invoiceNumber = await getNextNumber('INV')

  // Calculate due date
  const dueDate = addDays(order.order_date, customer.payment_terms)

  // Create invoice
  const invoice = await createInvoice({
    invoice_number: invoiceNumber,
    sales_order_id: orderId,
    invoice_date: order.order_date,
    due_date: dueDate,
    subtotal: order.subtotal,
    tax_amount: order.tax_amount,
    discount_amount: order.discount_amount,
    total_amount: order.total_amount,
    amount_paid: order.amount_paid,
    balance_due: order.balance_due,
    status: 'draft'
  })

  // Generate PDF
  const pdf = await generateInvoicePDF(invoice.id)

  // Send to customer
  await emailInvoice(customer.email, pdf)

  await updateInvoice(invoice.id, {
    status: 'sent',
    sent_at: new Date()
  })

  return invoice
}
```

---

## Sales Reports

### 1. Sales Summary Report
- Total sales by period (daily, weekly, monthly)
- Number of orders
- Average order value
- Sales by customer type
- Sales by product category

### 2. Customer Analysis
- Top customers by revenue
- Customer purchase frequency
- Average customer value
- New vs. returning customers

### 3. Product Performance
- Best-selling products
- Revenue by product
- Slow-moving items
- Product category analysis

### 4. Outstanding Orders Report
- Pending payment orders
- Partially paid orders
- Overdue invoices
- Credit limit utilization

### 5. Fulfillment Report
- Unfulfilled orders
- Partially fulfilled orders
- Average fulfillment time
- Fulfillment rate by warehouse

---

## API Endpoints

```
# Sales Orders
POST   /api/sales-orders
GET    /api/sales-orders
GET    /api/sales-orders/{id}
PUT    /api/sales-orders/{id}
DELETE /api/sales-orders/{id}
POST   /api/sales-orders/{id}/submit
POST   /api/sales-orders/{id}/approve
POST   /api/sales-orders/{id}/cancel
POST   /api/sales-orders/{id}/complete

# Fulfillment
POST   /api/sales-orders/{id}/fulfill
GET    /api/sales-orders/{id}/fulfillment-status

# Customers
GET    /api/customers
POST   /api/customers
GET    /api/customers/{id}
PUT    /api/customers/{id}
GET    /api/customers/{id}/orders
GET    /api/customers/{id}/credit-status

# Invoices
GET    /api/invoices
GET    /api/invoices/{id}
GET    /api/invoices/{id}/pdf
POST   /api/sales-orders/{id}/generate-invoice

# Reports
GET    /api/reports/sales-summary
GET    /api/reports/customer-analysis
GET    /api/reports/product-performance
GET    /api/reports/outstanding-orders
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-31
**Next**: [POS System](POS_SYSTEM.md)
