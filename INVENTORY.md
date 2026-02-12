# Inventory Management System

## Overview
Enterprise-grade inventory management for agro-products with:
- Multi-warehouse support
- Batch tracking for traceability
- Expiry date management
- Multi-unit handling (kg, bags, tons)
- Real-time stock levels
- Automated reorder alerts
- Stock movement audit trail

---

## Key Features

### 1. Multi-Warehouse Management
- Unlimited warehouse locations
- Warehouse-specific stock levels
- Inter-warehouse transfers with approval
- Warehouse capacity monitoring
- Location-based access control

### 2. Batch Tracking
- Unique batch numbers for each receipt
- Manufacturing and expiry dates
- FIFO (First In, First Out) enforcement
- Batch-level traceability
- Recall capability by batch

### 3. Unit Conversion System
```
Example: Maize (Corn)
Base Unit: Kilogram (kg)

Conversions:
- 1 bag = 50 kg
- 1 ton = 1000 kg = 20 bags
- 1 trailer = 30 tons = 30000 kg = 600 bags

System automatically converts between units
```

---

## Product Management

### Product Master Data

#### Essential Fields
```typescript
interface Product {
  id: number
  sku: string                    // Unique identifier (e.g., MAZ-001)
  barcode: string | null         // For POS scanning
  name: string                   // Product name
  description: string
  category_id: number            // Product category

  // Unit Management
  base_unit_id: number           // kg, liter, piece, etc.
  is_batch_tracked: boolean      // Track by batch?
  has_expiry: boolean            // Has expiration date?

  // Pricing
  cost_price: decimal            // Average cost (auto-calculated)
  selling_price: decimal         // Standard selling price
  minimum_selling_price: decimal // Below this needs approval

  // Inventory Control
  reorder_level: decimal         // Trigger reorder alert
  reorder_quantity: decimal      // Suggested order quantity
  minimum_stock: decimal         // Safety stock level
  maximum_stock: decimal         // Max inventory level

  // Status
  status: 'active' | 'inactive' | 'discontinued'
}
```

#### Business Rules
1. **SKU Generation**: Auto-generated or manual entry
   - Format: `{CATEGORY_CODE}-{SEQUENCE}` (e.g., GRN-001, FED-012)
   - Must be unique across system

2. **Pricing Rules**:
   - Cost price calculated as weighted average
   - Selling price must be >= minimum selling price
   - Price changes require approval (logged in audit)

3. **Status Management**:
   - Active: Available for sale
   - Inactive: Not shown in POS, existing stock visible
   - Discontinued: No new stock, sell remaining inventory

---

## Stock Management

### Stock Levels

#### Real-Time Stock Calculation
```sql
-- Available stock query
SELECT
    p.name,
    w.name as warehouse,
    SUM(s.quantity) as total_quantity,
    SUM(s.reserved_quantity) as reserved,
    SUM(s.available_quantity) as available,
    p.minimum_stock,
    CASE
        WHEN SUM(s.available_quantity) <= p.minimum_stock THEN 'LOW'
        WHEN SUM(s.available_quantity) <= p.reorder_level THEN 'REORDER'
        ELSE 'OK'
    END as stock_status
FROM products p
JOIN inventory_stock s ON p.id = s.product_id
JOIN warehouses w ON s.warehouse_id = w.id
GROUP BY p.id, w.id
```

#### Stock Reservation
When a sales order is created:
1. Check available quantity (quantity - reserved)
2. If sufficient, reserve the quantity
3. Update `reserved_quantity` in inventory_stock
4. When order is fulfilled, deduct from both quantity and reserved_quantity
5. If order is cancelled, release reservation

```typescript
// Stock reservation logic
async function reserveStock(orderId: number, items: OrderItem[]) {
  for (const item of items) {
    const stock = await getStock(item.product_id, item.warehouse_id, item.batch_number)

    if (stock.available_quantity < item.quantity) {
      throw new InsufficientStockError(item.product_id)
    }

    await updateStock({
      product_id: item.product_id,
      warehouse_id: item.warehouse_id,
      batch_number: item.batch_number,
      reserved_quantity: stock.reserved_quantity + item.quantity
    })

    await logStockMovement({
      type: 'reservation',
      quantity: item.quantity,
      reference_type: 'sales_order',
      reference_id: orderId
    })
  }
}
```

---

## Stock Movements

### Movement Types

1. **Stock In (Receipt)**
   - Source: Purchase orders (GRN)
   - Effect: Increase quantity
   - Requires: Batch number (if tracked), expiry date (if applicable)
   - Approval: Required for GRN

2. **Stock Out (Issue)**
   - Source: Sales orders, POS sales
   - Effect: Decrease quantity
   - Selection: FIFO by expiry date (for batch-tracked items)
   - Automatic: On order fulfillment

3. **Stock Adjustment**
   - Source: Physical count, damage, shrinkage
   - Effect: Increase or decrease
   - Approval: Required (creator ≠ approver)
   - Reason: Mandatory field

4. **Inter-Warehouse Transfer**
   - Source: Transfer request
   - Effect: Decrease from source, increase in destination
   - Approval: Required
   - Two-step: Dispatch from source → Receive at destination

### Movement Workflow

#### Stock Adjustment Example
```
Step 1: Inventory Manager performs physical count
  ↓
Step 2: Creates adjustment request
  - Current system quantity: 1000 kg
  - Actual physical count: 980 kg
  - Adjustment: -20 kg
  - Reason: "Spillage during storage"
  ↓
Step 3: Submit for approval
  - Status: PENDING_APPROVAL
  - Cannot modify after submission
  ↓
Step 4: Approver reviews
  - Verifies reason
  - Checks adjustment magnitude
  - Approves or rejects
  ↓
Step 5: If approved:
  - Update inventory_stock quantity
  - Create stock_movements record
  - Update audit trail
  - Adjust cost price if significant
```

---

## Batch Tracking & Traceability

### Batch Number Format
```
Format: {PRODUCT_CODE}-{YEAR}{MONTH}{DAY}-{SEQUENCE}
Example: MAZ-20260125-001

Components:
- MAZ: Product code (Maize)
- 20260125: Receipt date (2026-01-25)
- 001: Sequence number for the day
```

### FIFO Implementation
For batch-tracked products, sales must follow FIFO:

```sql
-- Get oldest batch first (FIFO)
SELECT
    s.id,
    s.batch_number,
    s.expiry_date,
    s.available_quantity,
    COALESCE(s.expiry_date, '9999-12-31') as sort_expiry
FROM inventory_stock s
WHERE s.product_id = :product_id
  AND s.warehouse_id = :warehouse_id
  AND s.available_quantity > 0
ORDER BY sort_expiry ASC, s.id ASC
LIMIT 1;
```

### Batch Recall Process
If a batch needs to be recalled:
1. Search all stock movements for batch number
2. Identify all sales orders using that batch
3. Generate customer notification list
4. Flag batch as "RECALLED" in system
5. Block future sales of that batch
6. Track returned quantities

---

## Expiry Management

### Expiry Date Alerts

**Alert Levels**:
- **Expired**: Expiry date < today (CRITICAL)
- **Expiring Soon**: Expiry within 30 days (WARNING)
- **Near Expiry**: Expiry within 60 days (INFO)

**Alert Actions**:
```typescript
// Daily cron job
async function checkExpiringProducts() {
  const today = new Date()
  const warning30 = addDays(today, 30)
  const info60 = addDays(today, 60)

  // Expired products
  const expired = await inventoryStock.find({
    expiry_date: { $lt: today },
    quantity: { $gt: 0 }
  })

  for (const stock of expired) {
    await createSystemAlert({
      type: 'EXPIRED_PRODUCT',
      severity: 'CRITICAL',
      title: `Expired Stock: ${stock.product.name}`,
      message: `Batch ${stock.batch_number} expired on ${stock.expiry_date}`,
      entity_type: 'inventory_stock',
      entity_id: stock.id
    })

    // Auto-flag for removal
    await flagForDisposal(stock.id)
  }

  // Expiring soon (30 days)
  const expiringSoon = await inventoryStock.find({
    expiry_date: { $gte: today, $lt: warning30 },
    quantity: { $gt: 0 }
  })

  for (const stock of expiringSoon) {
    await createSystemAlert({
      type: 'EXPIRING_SOON',
      severity: 'WARNING',
      message: `Batch ${stock.batch_number} expires in ${daysUntil(stock.expiry_date)} days`
    })
  }
}
```

### Disposal Process
For expired products:
1. Inventory Manager creates disposal request
2. Lists all expired batches for disposal
3. Requires approval from Admin
4. Approval creates stock adjustment (negative)
5. Updates inventory
6. Generates disposal certificate (compliance document)

---

## Inter-Warehouse Transfers

### Transfer Workflow

```
Step 1: Transfer Request
  Creator: Inventory Manager (Warehouse A)
  - Select destination warehouse (Warehouse B)
  - Select products and quantities
  - Reason for transfer
  - Status: DRAFT

Step 2: Submit for Approval
  - Status: PENDING_APPROVAL
  - Notifies Approver

Step 3: Approval
  Approver: Admin or designated approver
  - Reviews transfer request
  - Approves or rejects
  - If approved, status: APPROVED

Step 4: Dispatch (Source Warehouse)
  Handler: Inventory Manager (Warehouse A)
  - Physically ships goods
  - Records dispatch
  - Status: IN_TRANSIT
  - Reduces stock in Warehouse A

Step 5: Receive (Destination Warehouse)
  Receiver: Inventory Manager (Warehouse B)
  - Confirms receipt
  - Verifies quantity
  - Records any discrepancies
  - Status: COMPLETED
  - Increases stock in Warehouse B

If discrepancy:
  - Record damaged/missing quantity
  - Create incident report
  - Adjust both warehouses accordingly
```

### Transfer Data Model
```typescript
interface StockTransfer {
  id: number
  transfer_number: string
  from_warehouse_id: number
  to_warehouse_id: number

  status: 'draft' | 'pending_approval' | 'approved' | 'in_transit' | 'completed' | 'cancelled'

  // Lifecycle tracking
  requested_by: number
  requested_at: timestamp
  approved_by: number | null
  approved_at: timestamp | null
  dispatched_by: number | null
  dispatched_at: timestamp | null
  received_by: number | null
  received_at: timestamp | null

  items: TransferItem[]
}

interface TransferItem {
  product_id: number
  batch_number: string | null
  quantity_requested: decimal
  quantity_dispatched: decimal
  quantity_received: decimal
  discrepancy_quantity: decimal
  discrepancy_reason: string | null
}
```

---

## Stock Valuation

### Costing Methods

**Weighted Average Cost (WAC)** - Used by default

```
New Average Cost = (Previous Stock Value + New Purchase Value) / (Previous Stock + New Stock)

Example:
Opening Stock: 100 kg @ ₦50/kg = ₦5,000
New Purchase: 200 kg @ ₦60/kg = ₦12,000

New Average = (₦5,000 + ₦12,000) / (100 + 200) = ₦17,000 / 300 = ₦56.67/kg
```

**Implementation**:
```typescript
async function updateAverageCost(productId: number, newQuantity: decimal, newUnitCost: decimal) {
  const product = await getProduct(productId)
  const currentStock = await getTotalStock(productId)

  const currentValue = currentStock * product.cost_price
  const newValue = newQuantity * newUnitCost
  const totalStock = currentStock + newQuantity

  const newAverageCost = (currentValue + newValue) / totalStock

  await updateProduct(productId, {
    cost_price: newAverageCost
  })

  // Log cost price change
  await auditLog({
    action: 'UPDATE',
    entity_type: 'product',
    entity_id: productId,
    old_values: { cost_price: product.cost_price },
    new_values: { cost_price: newAverageCost },
    reason: 'Automatic cost averaging after purchase'
  })
}
```

### Inventory Valuation Report
```sql
SELECT
    p.sku,
    p.name,
    SUM(s.quantity) as total_quantity,
    p.cost_price,
    SUM(s.quantity * p.cost_price) as inventory_value,
    p.selling_price,
    SUM(s.quantity * p.selling_price) as potential_revenue,
    SUM(s.quantity * (p.selling_price - p.cost_price)) as potential_profit
FROM products p
JOIN inventory_stock s ON p.id = s.product_id
WHERE s.quantity > 0
GROUP BY p.id
ORDER BY inventory_value DESC;
```

---

## Inventory Reports

### 1. Stock Status Report
- Current stock levels by product
- Warehouse-wise breakdown
- Stock status (OK, Low, Reorder, Out of Stock)
- Value of inventory

### 2. Stock Movement Report
- All movements in date range
- Filter by: product, warehouse, movement type
- Quantities in/out
- Running balance

### 3. Expiry Report
- Products expiring within timeframe
- Expired products still in stock
- Batch details
- Suggested actions

### 4. Slow-Moving Stock Report
- Products with no sales in X days
- Aging analysis (0-30, 31-60, 61-90, 90+ days)
- Recommended actions (discount, promotion, disposal)

### 5. Stock Variance Report
- System quantity vs. physical count
- Variance amount and percentage
- Value of variance
- Reasons for adjustments

### 6. ABC Analysis
```
Category A: Top 20% products by value (contribute ~80% of inventory value)
Category B: Next 30% products (~15% of value)
Category C: Remaining 50% products (~5% of value)

Focus: More control and monitoring for Category A items
```

---

## Physical Stock Count

### Stock Count Process

**Annual Full Count** + **Quarterly Cycle Counts**

```
Step 1: Plan Count
  - Select warehouse
  - Select count date
  - Assign count teams
  - Print count sheets

Step 2: Freeze Transactions
  - Lock warehouse for duration
  - No sales/receipts during count
  - Or use "last movement" snapshot

Step 3: Physical Count
  - Teams count all products
  - Record batch numbers
  - Note damaged/expired items
  - Enter into system

Step 4: Variance Analysis
  - System calculates differences
  - Classify: acceptable vs. requires investigation
  - Generate variance report

Step 5: Adjustment
  - Create stock adjustments
  - Requires approval
  - Update inventory
  - Close count
```

### Count Sheet Format
```
Warehouse: Main Warehouse
Count Date: 2026-01-31
Counter: John Doe
Verifier: Jane Smith

SKU      | Product Name    | Batch No      | Expiry   | System Qty | Count Qty | Variance
---------|-----------------|---------------|----------|------------|-----------|----------
MAZ-001  | Yellow Maize    | MAZ-20260115  | 2027-01  | 1000       | 980       | -20
SBM-002  | Soybean Meal    | SBM-20260120  | 2026-12  | 500        | 505       | +5
```

---

## Inventory Permissions

### Permission Matrix for Inventory Module

| Action | Inventory Manager | Approver | Admin | Auditor |
|--------|:-----------------:|:--------:|:-----:|:-------:|
| View stock levels | ✓ | ✓ | ✓ | ✓ |
| Create products | ✓ | ✗ | ✓ | ✗ |
| Update products | ✓ | ✗ | ✓ | ✗ |
| Create stock adjustment | ✓ | ✗ | ✓ | ✗ |
| Approve stock adjustment | ✗ | ✓ | ✓ | ✗ |
| Create transfer | ✓ | ✗ | ✓ | ✗ |
| Approve transfer | ✗ | ✓ | ✓ | ✗ |
| View audit trail | ✗ | ✗ | ✓ | ✓ |
| Physical count | ✓ | ✗ | ✓ | ✗ |
| Approve count variance | ✗ | ✓ | ✓ | ✗ |

---

## API Endpoints

### Stock Queries
```
GET /api/inventory/stock?warehouse_id={id}&product_id={id}
GET /api/inventory/stock/low-stock
GET /api/inventory/stock/expiring?days={30}
GET /api/inventory/stock/by-batch/{batch_number}
```

### Stock Movements
```
GET /api/inventory/movements?product_id={id}&start_date={date}&end_date={date}
POST /api/inventory/adjustments
PUT /api/inventory/adjustments/{id}/approve
```

### Transfers
```
POST /api/inventory/transfers
PUT /api/inventory/transfers/{id}/approve
PUT /api/inventory/transfers/{id}/dispatch
PUT /api/inventory/transfers/{id}/receive
```

### Reports
```
GET /api/inventory/reports/stock-status
GET /api/inventory/reports/movement-summary
GET /api/inventory/reports/valuation
GET /api/inventory/reports/abc-analysis
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-31
**Next**: [Purchase Order System](PURCHASE_ORDERS.md)
