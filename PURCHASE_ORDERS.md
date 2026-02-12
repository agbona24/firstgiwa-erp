# Purchase Order System

## Overview
Enterprise procurement system with:
- Supplier management
- Multi-level approval workflows
- Goods receipt management (GRN)
- Automatic inventory updates
- Partial delivery handling
- Supplier performance tracking
- Audit-ready procurement trail

---

## Purchase Order Lifecycle

### Status Flow Diagram
```
┌─────────┐
│  DRAFT  │ ← PO created, can be edited
└────┬────┘
     │ Submit for approval
     ▼
┌──────────────────┐
│ PENDING_APPROVAL │ ← Cannot edit, awaiting approval
└────┬────────────┬┘
     │            │ Rejected
     │ Approved   ▼
     ▼         ┌──────────┐
┌──────────┐  │ REJECTED │ → Can revise and resubmit
│ APPROVED │  └──────────┘
└────┬─────┘
     │ Goods start arriving
     ▼
┌───────────────────────┐
│ PARTIALLY_RECEIVED    │ ← Some items received
└────┬──────────────────┘
     │ All items received
     ▼
┌──────────┐
│ RECEIVED │ ← All goods received
└────┬─────┘
     │ Quality check, invoicing complete
     ▼
┌───────────┐
│ COMPLETED │ ← Final status
└───────────┘

 Can cancel from DRAFT, PENDING_APPROVAL, or APPROVED (if not received)
     ▼
┌───────────┐
│ CANCELLED │
└───────────┘
```

---

## Supplier Management

### Supplier Master Data

```typescript
interface Supplier {
  id: number
  code: string                    // SUP-001
  name: string
  registration_number: string     // Business registration
  tax_id: string                  // Tax ID / TIN

  // Contact Information
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string

  // Financial Terms
  payment_terms: number           // Days (30, 60, 90)
  credit_limit: decimal
  currency: string                // NGN, USD, etc.

  // Contact Person
  contact_person_name: string
  contact_person_phone: string
  contact_person_email: string

  // Performance & Status
  status: 'active' | 'inactive' | 'blacklisted'
  rating: decimal                 // 1.00 to 5.00
  total_purchases: decimal
  on_time_delivery_rate: decimal  // Percentage

  // Metadata
  notes: string
  created_by: number
  created_at: timestamp
}
```

### Supplier Performance Tracking
```typescript
interface SupplierMetrics {
  supplier_id: number
  total_pos: number
  total_value: decimal
  on_time_deliveries: number
  late_deliveries: number
  quality_issues: number
  on_time_rate: decimal           // Calculated
  average_rating: decimal
  last_order_date: date
}

// Calculated after each GRN
function updateSupplierMetrics(supplierId: number, grnId: number) {
  const grn = getGRN(grnId)
  const po = getPO(grn.purchase_order_id)

  // Check if delivery was on time
  const onTime = grn.received_date <= po.expected_delivery_date

  // Check for quality issues (damaged goods)
  const hasQualityIssues = grn.items.some(item => item.damaged_quantity > 0)

  // Update metrics
  updateSupplier(supplierId, {
    total_purchases: supplier.total_purchases + po.total_amount,
    on_time_deliveries: supplier.on_time_deliveries + (onTime ? 1 : 0),
    late_deliveries: supplier.late_deliveries + (onTime ? 0 : 1),
    quality_issues: supplier.quality_issues + (hasQualityIssues ? 1 : 0)
  })

  // Recalculate rating
  const rating = calculateSupplierRating(supplierId)
  updateSupplier(supplierId, { rating })
}
```

---

## Purchase Order Creation

### PO Data Structure

```typescript
interface PurchaseOrder {
  id: number
  po_number: string               // PO-2026-00001
  supplier_id: number
  warehouse_id: number            // Destination warehouse

  // Dates
  order_date: date
  expected_delivery_date: date
  actual_delivery_date: date | null

  // Financial
  subtotal: decimal
  tax_amount: decimal
  discount_amount: decimal
  shipping_cost: decimal
  total_amount: decimal

  // Status
  status: POStatus
  payment_terms: number           // Days

  // Approval Chain
  created_by: number
  created_at: timestamp
  submitted_at: timestamp | null
  submitted_by: number | null
  approved_at: timestamp | null
  approved_by: number | null
  rejected_at: timestamp | null
  rejected_by: number | null
  rejection_reason: string | null

  // Items
  items: POItem[]

  // Metadata
  notes: string
}

interface POItem {
  id: number
  purchase_order_id: number
  product_id: number

  // Quantity
  quantity: decimal
  unit_id: number
  received_quantity: decimal      // Updated from GRN

  // Pricing
  unit_price: decimal
  discount_percent: decimal
  discount_amount: decimal
  tax_percent: decimal
  tax_amount: decimal
  total_amount: decimal

  notes: string
}
```

### PO Creation Workflow

```
Step 1: Initiate PO
  Actor: Inventory Manager / Purchase Officer
  Permission: purchases.po.create
  Actions:
    - Select supplier
    - Select destination warehouse
    - Set expected delivery date
    - Status: DRAFT

Step 2: Add Line Items
  - Select products from catalog
  - Enter quantities and units
  - Enter unit prices (may pre-fill from last purchase)
  - Apply discounts/taxes
  - System calculates totals

Step 3: Review & Save
  - Verify all details
  - Save as DRAFT
  - Can edit/delete while in DRAFT

Step 4: Submit for Approval
  Permission: purchases.po.submit
  Actions:
    - Final validation (all required fields)
    - Status: DRAFT → PENDING_APPROVAL
    - Cannot edit after submission
    - Triggers notification to approvers

Step 5: Approval Process
  Approver: Based on amount threshold
  - Amount < ₦500,000: Inventory Manager can approve
  - Amount ₦500,000 - ₦1,000,000: Requires Approver role
  - Amount > ₦1,000,000: Requires Admin + Approver

  Permission: purchases.po.approve
  Checks:
    - Approver ≠ Creator (Separation of Duties)
    - Has approval permission
    - Amount within authority limit

  Actions:
    - Approve: Status → APPROVED
    - Reject: Status → REJECTED, provide reason

Step 6: Generate PO Document
  - PDF generation with company letterhead
  - PO number, supplier details
  - Line items with terms
  - Signatures (digital)
  - Send to supplier via email
```

---

## Approval Workflow Engine

### Amount-Based Approval Levels

```typescript
interface ApprovalRule {
  min_amount: decimal
  max_amount: decimal
  required_approvals: number
  allowed_roles: string[]
}

const approvalRules: ApprovalRule[] = [
  {
    min_amount: 0,
    max_amount: 500000,
    required_approvals: 1,
    allowed_roles: ['Inventory Manager', 'Admin']
  },
  {
    min_amount: 500000,
    max_amount: 1000000,
    required_approvals: 1,
    allowed_roles: ['Approver', 'Admin']
  },
  {
    min_amount: 1000000,
    max_amount: Infinity,
    required_approvals: 2,
    allowed_roles: ['Approver', 'Admin']
  }
]

function getApprovalRequirements(amount: decimal): ApprovalRule {
  return approvalRules.find(rule =>
    amount >= rule.min_amount && amount < rule.max_amount
  )
}

async function approvePO(poId: number, userId: number) {
  const po = await getPO(poId)
  const user = await getUser(userId)

  // Check 1: Cannot approve own PO
  if (po.created_by === userId) {
    throw new Error('Cannot approve your own purchase order (SOD violation)')
  }

  // Check 2: Has approval permission
  if (!user.hasPermission('purchases.po.approve')) {
    throw new Error('Insufficient permissions')
  }

  // Check 3: Check approval authority
  const approvalRule = getApprovalRequirements(po.total_amount)
  const userRoles = user.roles.map(r => r.name)
  const hasAuthority = approvalRule.allowed_roles.some(role =>
    userRoles.includes(role)
  )

  if (!hasAuthority) {
    throw new Error(`Amount ${po.total_amount} exceeds your approval authority`)
  }

  // Check 4: Multi-level approval check
  const existingApprovals = await getApprovalActions(poId)
  if (existingApprovals.length >= approvalRule.required_approvals) {
    throw new Error('PO already fully approved')
  }

  // Record approval
  await createApprovalAction({
    approval_request_id: po.approval_request_id,
    action: 'approve',
    action_by: userId,
    comments: null
  })

  // Update PO status
  if (existingApprovals.length + 1 >= approvalRule.required_approvals) {
    await updatePO(poId, {
      status: 'APPROVED',
      approved_at: new Date(),
      approved_by: userId
    })

    // Notify creator
    await notifyUser(po.created_by, {
      title: 'PO Approved',
      message: `Your purchase order ${po.po_number} has been approved`
    })

    // Notify supplier
    await sendPOToSupplier(poId)
  }

  // Audit trail
  await auditLog({
    action: 'APPROVE',
    entity_type: 'purchase_order',
    entity_id: poId,
    user_id: userId,
    new_values: { status: 'APPROVED' }
  })
}
```

---

## Goods Received Note (GRN)

### GRN Purpose
- Record physical receipt of goods
- Verify quantities received vs. ordered
- Identify damaged/missing items
- Trigger inventory update
- Enable invoice matching (3-way match: PO → GRN → Invoice)

### GRN Workflow

```
Step 1: Goods Arrival
  - Supplier delivers goods to warehouse
  - Security logs delivery vehicle
  - Warehouse staff notified

Step 2: Create GRN
  Actor: Warehouse Receiver
  Permission: purchases.grn.create
  Actions:
    - Select approved PO
    - Enter received date
    - Enter supplier's invoice number
    - Enter delivery note number
    - Status: DRAFT

Step 3: Inspect & Record Items
  For each PO line item:
    - Count received quantity
    - Verify quality
    - Check batch numbers (if batch-tracked)
    - Check expiry dates
    - Record damaged/rejected quantities
    - Enter accepted quantity

Step 4: Handle Discrepancies
  If received_qty ≠ ordered_qty:
    - Record variance
    - Add notes explaining discrepancy
    - Options:
      a) Short delivery: Record partial receipt
      b) Over delivery: Record excess (may need approval)
      c) Damaged: Reject damaged items

Step 5: Submit GRN for Approval
  Permission: purchases.grn.submit
  - Status: DRAFT → PENDING_APPROVAL
  - Notifies GRN Approver

Step 6: GRN Approval
  Actor: GRN Approver (≠ Receiver)
  Permission: purchases.grn.approve
  Checks:
    - Approver ≠ Receiver (SOD)
    - Quantities reasonable
    - Discrepancies explained
  Actions:
    - Approve: Status → APPROVED
    - Reject: Status → REJECTED, provide reason

Step 7: Update Inventory (Automatic on Approval)
  For each GRN item:
    - Add to inventory_stock table
    - Create stock_movements record
    - Update PO item received_quantity
    - Update product average cost price

Step 8: Update PO Status
  - Check if all items fully received
  - If yes: PO status → RECEIVED
  - If partial: PO status → PARTIALLY_RECEIVED

Step 9: Generate GRN Document
  - PDF with all details
  - Attach to PO
  - Archive for audit
```

### GRN Data Structure

```typescript
interface GoodsReceivedNote {
  id: number
  grn_number: string              // GRN-2026-00001
  purchase_order_id: number
  warehouse_id: number

  // Receipt Details
  received_date: date
  invoice_number: string          // Supplier's invoice
  delivery_note_number: string    // Supplier's delivery note

  // Status
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected'

  // Approval
  received_by: number
  approved_by: number | null
  approved_at: timestamp | null

  // Items
  items: GRNItem[]

  remarks: string
}

interface GRNItem {
  id: number
  grn_id: number
  po_item_id: number
  product_id: number

  // Quantities
  ordered_quantity: decimal       // From PO
  received_quantity: decimal      // Actually received
  damaged_quantity: decimal       // Damaged/rejected
  accepted_quantity: decimal      // Received - Damaged
  unit_id: number

  // Batch Tracking
  batch_number: string | null
  manufacturing_date: date | null
  expiry_date: date | null

  // Quality Notes
  notes: string
}
```

### Inventory Update Logic (On GRN Approval)

```typescript
async function updateInventoryFromGRN(grnId: number) {
  const grn = await getGRN(grnId)
  const po = await getPO(grn.purchase_order_id)

  for (const item of grn.items) {
    if (item.accepted_quantity <= 0) continue

    const product = await getProduct(item.product_id)

    // 1. Update or create inventory_stock record
    let stock = await getInventoryStock({
      warehouse_id: grn.warehouse_id,
      product_id: item.product_id,
      batch_number: item.batch_number
    })

    const previousQty = stock?.quantity || 0

    if (stock) {
      // Update existing stock
      await updateInventoryStock(stock.id, {
        quantity: stock.quantity + item.accepted_quantity,
        last_updated_at: new Date()
      })
    } else {
      // Create new stock record
      stock = await createInventoryStock({
        warehouse_id: grn.warehouse_id,
        product_id: item.product_id,
        batch_number: item.batch_number,
        quantity: item.accepted_quantity,
        reserved_quantity: 0,
        manufacturing_date: item.manufacturing_date,
        expiry_date: item.expiry_date,
        unit_cost: item.unit_price
      })
    }

    // 2. Create stock movement record
    await createStockMovement({
      warehouse_id: grn.warehouse_id,
      product_id: item.product_id,
      batch_number: item.batch_number,
      movement_type: 'in',
      quantity: item.accepted_quantity,
      unit_id: item.unit_id,
      reference_type: 'goods_received_note',
      reference_id: grn.id,
      quantity_before: previousQty,
      quantity_after: previousQty + item.accepted_quantity,
      created_by: grn.approved_by,
      remarks: `GRN ${grn.grn_number} - PO ${po.po_number}`
    })

    // 3. Update PO item received quantity
    const poItem = await getPOItem(item.po_item_id)
    await updatePOItem(item.po_item_id, {
      received_quantity: poItem.received_quantity + item.accepted_quantity
    })

    // 4. Update product average cost
    await updateAverageCost(
      item.product_id,
      item.accepted_quantity,
      item.unit_price
    )

    // 5. Audit log
    await auditLog({
      action: 'CREATE',
      entity_type: 'stock_movement',
      entity_id: stock.id,
      user_id: grn.approved_by,
      new_values: {
        quantity: item.accepted_quantity,
        reference: `GRN-${grn.grn_number}`
      }
    })
  }

  // 6. Update PO status
  await updatePOStatus(grn.purchase_order_id)
}

async function updatePOStatus(poId: number) {
  const po = await getPO(poId)
  const items = po.items

  const allFullyReceived = items.every(item =>
    item.received_quantity >= item.quantity
  )

  const anyReceived = items.some(item =>
    item.received_quantity > 0
  )

  if (allFullyReceived) {
    await updatePO(poId, { status: 'RECEIVED' })
  } else if (anyReceived) {
    await updatePO(poId, { status: 'PARTIALLY_RECEIVED' })
  }
}
```

---

## Partial Deliveries

### Handling Partial Deliveries

```
Scenario: PO for 1000 kg of maize

Delivery 1 (Day 1):
  - Received: 600 kg
  - Create GRN-1
  - Inventory updated: +600 kg
  - PO status: PARTIALLY_RECEIVED
  - PO item: received_quantity = 600

Delivery 2 (Day 5):
  - Received: 400 kg
  - Create GRN-2
  - Inventory updated: +400 kg
  - PO status: RECEIVED (fully received)
  - PO item: received_quantity = 1000

Multiple GRNs can reference the same PO
Each GRN is approved independently
Inventory updated incrementally
```

---

## PO Amendments

### Amending Approved POs

**Rule**: Cannot edit approved POs directly

**Process**:
1. If PO status = APPROVED and not yet received:
   - Option A: Cancel original PO, create new one
   - Option B: Create Amendment Request (future feature)

2. If PO status = PARTIALLY_RECEIVED:
   - Can only amend unreceived items
   - Requires new approval

3. If PO status = RECEIVED:
   - Cannot amend
   - Create new PO if needed

---

## Purchase Reports

### 1. Purchase Order Report
- List all POs with filters (date, supplier, status)
- Total purchase value
- Pending approvals
- Overdue deliveries

### 2. Supplier Performance Report
- On-time delivery rate
- Quality metrics
- Total purchase value
- Average order value
- Rating trends

### 3. Outstanding POs Report
- Approved but not received
- Expected delivery dates
- Age analysis
- Follow-up actions

### 4. GRN Variance Report
- Ordered vs. received quantities
- Damaged/rejected items
- Value of discrepancies
- Supplier-wise variances

### 5. Purchase Analysis
- Category-wise purchases
- Month-over-month trends
- Top suppliers
- Seasonal patterns

---

## Integration Points

### With Inventory
- GRN approval → automatic stock update
- Average cost recalculation
- Batch and expiry tracking

### With Accounting
- PO creates purchase commitment
- GRN triggers accrual entry
- Invoice matching (3-way match)

### With Payments
- Track payment due dates
- Payment terms from supplier master
- Outstanding payables

---

## API Endpoints

```
# Purchase Orders
POST   /api/purchase-orders
GET    /api/purchase-orders
GET    /api/purchase-orders/{id}
PUT    /api/purchase-orders/{id}
DELETE /api/purchase-orders/{id}
POST   /api/purchase-orders/{id}/submit
POST   /api/purchase-orders/{id}/approve
POST   /api/purchase-orders/{id}/reject
POST   /api/purchase-orders/{id}/cancel
GET    /api/purchase-orders/{id}/pdf

# GRN
POST   /api/goods-received-notes
GET    /api/goods-received-notes
GET    /api/goods-received-notes/{id}
POST   /api/goods-received-notes/{id}/approve
POST   /api/goods-received-notes/{id}/reject
GET    /api/purchase-orders/{po_id}/grns

# Suppliers
GET    /api/suppliers
POST   /api/suppliers
GET    /api/suppliers/{id}
PUT    /api/suppliers/{id}
GET    /api/suppliers/{id}/performance

# Reports
GET    /api/reports/purchase-orders
GET    /api/reports/supplier-performance
GET    /api/reports/outstanding-pos
GET    /api/reports/grn-variances
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-31
**Next**: [Sales Order System](SALES_ORDERS.md)
