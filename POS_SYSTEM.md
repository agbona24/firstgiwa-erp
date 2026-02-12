# POS (Point of Sale) System

## Overview
Fast, secure POS system optimized for cashier operations with:
- Streamlined checkout interface
- Barcode scanning support
- Multiple payment methods
- Restricted cashier permissions
- Offline capability (future)
- End-of-day reconciliation
- Real-time inventory deduction

---

## POS vs Back-Office Separation

### Key Differences

| Feature | POS (Cashier) | Back-Office (Sales Order) |
|---------|--------------|---------------------------|
| **User Role** | Cashier | Sales Officer, Admin |
| **Interface** | Simplified, fast checkout | Full order management |
| **Customer** | Walk-in, quick selection | Can be pre-registered |
| **Pricing** | Fixed, cannot modify | Can apply custom pricing |
| **Discounts** | Limited or none | Flexible discounts |
| **Payment** | Immediate (cash/card) | Can be on credit |
| **Approval** | Not required | May require approval |
| **Inventory** | Immediate deduction | Deducted on fulfillment |
| **Use Case** | Retail store, quick sales | Wholesale, large orders |

---

## POS Architecture

### System Components

```
┌─────────────────────────────────────────────┐
│            POS Terminal (React)              │
│  ┌────────────┐  ┌────────────┐             │
│  │  Product   │  │  Payment   │             │
│  │  Catalog   │  │  Screen    │             │
│  └────────────┘  └────────────┘             │
│  ┌────────────┐  ┌────────────┐             │
│  │   Cart     │  │  Receipt   │             │
│  │  Manager   │  │  Printer   │             │
│  └────────────┘  └────────────┘             │
└─────────────────────────────────────────────┘
                    │
                    │ API
                    ▼
┌─────────────────────────────────────────────┐
│          POS Backend Service                 │
│  ┌────────────┐  ┌────────────┐             │
│  │   Sales    │  │  Inventory │             │
│  │  Service   │  │  Service   │             │
│  └────────────┘  └────────────┘             │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│           PostgreSQL Database                │
└─────────────────────────────────────────────┘
```

---

## Cashier Permissions (Restricted)

### What Cashiers CAN Do

✅ **View Products**
- Browse product catalog
- View prices
- View available stock (limited to "in stock" / "out of stock")

✅ **Create Sales**
- Add products to cart
- Enter quantities
- Apply approved discounts (if configured)
- Create quick customer records

✅ **Accept Payments**
- Accept cash
- Process card payments
- Process bank transfers
- Mixed payments (cash + card)

✅ **Print Receipts**
- Print sale receipts
- Reprint last receipt (own sales only)

✅ **Request Refunds**
- Initiate refund request
- Cannot approve refunds

### What Cashiers CANNOT Do

❌ **Cannot Modify Prices**
- Cannot change product prices
- Cannot override system pricing
- Requires supervisor override for price changes

❌ **Cannot Apply Unauthorized Discounts**
- Discounts > configured limit (e.g., 5%) require approval
- Cannot create custom discount percentages

❌ **Cannot Approve Refunds**
- Can only request refunds
- Supervisor/Manager must approve

❌ **Cannot View Financial Reports**
- Cannot access sales reports
- Cannot view other cashiers' sales
- Cannot view business intelligence

❌ **Cannot Modify Inventory**
- Cannot adjust stock
- Cannot create stock transfers
- No access to inventory management

❌ **Cannot Edit Completed Sales**
- Sales are immutable once payment accepted
- Can only void with supervisor approval

---

## POS Workflow

### Standard Sale Flow

```
Step 1: Start Sale
  - Cashier logs in to POS terminal
  - System loads active session
  - New sale initialized
  - Cart empty

Step 2: Add Products
  Method A: Barcode Scan
    - Scan product barcode
    - Product added to cart
    - Quantity = 1 (can adjust)

  Method B: Manual Search
    - Search by name or SKU
    - Select product from results
    - Enter quantity
    - Add to cart

  Method C: Quick Keys (Optional)
    - Pre-configured buttons for popular items
    - One-click add to cart

Step 3: Review Cart
  For each item in cart:
    - Product name
    - Quantity × Unit price = Line total
    - Option to remove item
    - Option to adjust quantity (if no stock constraint)

  Show:
    - Subtotal
    - Tax (if applicable)
    - Discount (if applicable)
    - Total Amount Due

Step 4: Customer Information (Optional)
  Options:
    a) Walk-in customer (default)
    b) Search existing customer (phone/name)
    c) Quick create customer (name + phone)

Step 5: Apply Discount (If Authorized)
  - Enter discount percentage or amount
  - If > threshold: Requires supervisor PIN
  - Discount applied to total

Step 6: Process Payment
  - Go to payment screen
  - Select payment method(s)
  - See Payments section below

Step 7: Complete Sale
  - Deduct inventory automatically
  - Generate sale receipt
  - Print receipt
  - Clear cart for next sale
  - Update daily sales totals
```

---

## POS Interface Design (Premium Feel)

### Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  FIRSTGIWA ERP - POS Terminal        [User: John] [Shift: 1]   │
├─────────────────────────────────────┬───────────────────────────┤
│                                     │   CART                    │
│   PRODUCT SEARCH                    │  ┌─────────────────────┐ │
│  ┌───────────────────────────────┐  │  │ Maize Yellow        │ │
│  │ [🔍 Search products...]       │  │  │ 50 kg × ₦35,000     │ │
│  └───────────────────────────────┘  │  │ = ₦1,750,000    [×] │ │
│                                     │  └─────────────────────┘ │
│   CATEGORIES                        │  ┌─────────────────────┐ │
│  ┌───────┐ ┌───────┐ ┌───────┐    │  │ Soybean Meal        │ │
│  │ Grains│ │ Feeds │ │ Seeds │    │  │ 25 kg × ₦28,500     │ │
│  └───────┘ └───────┘ └───────┘    │  │ = ₦712,500      [×] │ │
│                                     │  └─────────────────────┘ │
│   PRODUCTS (Grains)                 │                          │
│  ┌─────────────────────────────┐   │  ─────────────────────── │
│  │ Maize Yellow                │   │  Subtotal: ₦2,462,500   │
│  │ ₦35,000 / 50kg bag          │   │  Tax (7.5%): ₦184,688   │
│  │ [In Stock]            [ADD] │   │  Discount: -₦0          │
│  └─────────────────────────────┘   │  ─────────────────────── │
│  ┌─────────────────────────────┐   │  TOTAL:  ₦2,647,188     │
│  │ Maize White                 │   │                          │
│  │ ₦33,500 / 50kg bag          │   │  ┌───────────────────┐  │
│  │ [In Stock]            [ADD] │   │  │  PAYMENT     [F2] │  │
│  └─────────────────────────────┘   │  └───────────────────┘  │
└─────────────────────────────────────┴───────────────────────────┘
│ [F1: New Sale] [F5: Hold] [F8: Void] [F12: End Shift]         │
└─────────────────────────────────────────────────────────────────┘
```

### Color Scheme (Deep Blue & Gold)

```css
/* Primary Colors */
--primary-blue: #1e40af;      /* Deep Blue */
--primary-gold: #d97706;      /* Amber/Gold */
--accent-blue: #3b82f6;       /* Lighter blue for hover */
--accent-gold: #f59e0b;       /* Lighter gold for highlights */

/* Neutrals */
--slate-50: #f8fafc;          /* Background */
--slate-100: #f1f5f9;         /* Cards */
--slate-700: #334155;         /* Text primary */
--slate-500: #64748b;         /* Text secondary */
--white: #ffffff;

/* Status Colors */
--success-green: #10b981;
--warning-amber: #f59e0b;
--error-red: #ef4444;

/* UI Application */
.pos-header {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  color: white;
}

.product-card {
  background: white;
  border: 2px solid #f1f5f9;
  border-radius: 12px;
}

.product-card:hover {
  border-color: #d97706;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.15);
}

.cart-item {
  background: #f8fafc;
  border-left: 4px solid #1e40af;
}

.total-amount {
  color: #1e40af;
  font-size: 32px;
  font-weight: bold;
}

.btn-payment {
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  color: white;
  font-weight: 600;
}

.btn-primary {
  background: #1e40af;
  color: white;
}

.btn-primary:hover {
  background: #3b82f6;
}
```

---

## Payment Processing in POS

### Payment Methods

#### 1. Cash Payment
```typescript
interface CashPayment {
  method: 'cash'
  amount_tendered: decimal
  amount_due: decimal
  change: decimal
}

// Flow
const amountDue = 2647.50
const cashTendered = 3000.00
const change = cashTendered - amountDue  // 352.50

// Display change prominently
showChangeAlert(change)
```

#### 2. Card Payment
```typescript
interface CardPayment {
  method: 'card'
  card_type: 'visa' | 'mastercard' | 'verve'
  card_last_four: string
  transaction_id: string
  amount: decimal
}

// Integration with payment terminal
const result = await processCardPayment({
  amount: orderTotal,
  terminal_id: posConfig.terminal_id
})

if (result.status === 'approved') {
  recordPayment({
    method: 'card',
    card_last_four: result.card_number.slice(-4),
    transaction_id: result.transaction_id,
    amount: result.amount
  })
}
```

#### 3. Bank Transfer
```typescript
interface BankTransferPayment {
  method: 'bank_transfer'
  bank_name: string
  transaction_reference: string
  amount: decimal
  confirmation_pending: boolean
}

// Customer shows transfer receipt
// Cashier records details
recordPayment({
  method: 'bank_transfer',
  bank_name: 'Zenith Bank',
  transaction_reference: 'TRF123456789',
  amount: orderTotal,
  status: 'pending'  // Requires back-office confirmation
})
```

#### 4. Mixed Payment
```typescript
interface MixedPayment {
  method: 'mixed'
  total_amount: decimal
  splits: PaymentSplit[]
}

interface PaymentSplit {
  method: 'cash' | 'card' | 'bank_transfer'
  amount: decimal
}

// Example: Part cash, part card
const mixedPayment = {
  method: 'mixed',
  total_amount: 2647.50,
  splits: [
    { method: 'cash', amount: 1000.00 },
    { method: 'card', amount: 1647.50 }
  ]
}

// Validate total
const splitTotal = mixedPayment.splits.reduce((sum, split) => sum + split.amount, 0)
if (Math.abs(splitTotal - mixedPayment.total_amount) > 0.01) {
  throw new Error('Split amounts do not match total')
}
```

---

## Inventory Deduction (Real-Time)

### Immediate Stock Update

```typescript
async function completePOSSale(sale: POSSale): Promise<void> {
  // Start transaction
  await db.transaction(async (trx) => {
    // 1. Create sales order
    const order = await createSalesOrder({
      order_number: await getNextNumber('POS'),
      customer_id: sale.customer_id || getWalkInCustomer(),
      warehouse_id: sale.warehouse_id,
      order_type: 'pos',
      order_date: new Date(),
      status: 'completed',
      payment_status: 'paid',
      fulfillment_status: 'fulfilled',
      total_amount: sale.total_amount,
      amount_paid: sale.total_amount,
      created_by: sale.cashier_id
    }, trx)

    // 2. Create order items
    for (const item of sale.items) {
      await createOrderItem({
        sales_order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_id: item.unit_id,
        unit_price: item.unit_price,
        total_amount: item.total_amount,
        fulfilled_quantity: item.quantity  // Already fulfilled
      }, trx)

      // 3. Deduct inventory immediately
      const stock = await getStock(sale.warehouse_id, item.product_id, trx)

      if (stock.available_quantity < item.quantity) {
        throw new InsufficientStockError(item.product_id)
      }

      await updateInventoryStock(stock.id, {
        quantity: stock.quantity - item.quantity
      }, trx)

      // 4. Record stock movement
      await createStockMovement({
        warehouse_id: sale.warehouse_id,
        product_id: item.product_id,
        movement_type: 'out',
        quantity: item.quantity,
        reference_type: 'sales_order',
        reference_id: order.id,
        quantity_before: stock.quantity,
        quantity_after: stock.quantity - item.quantity,
        created_by: sale.cashier_id
      }, trx)
    }

    // 5. Record payment
    await createPayment({
      payment_number: await getNextNumber('PAY'),
      reference_type: 'sales_order',
      reference_id: order.id,
      payment_method: sale.payment_method,
      amount: sale.total_amount,
      status: 'confirmed',
      created_by: sale.cashier_id
    }, trx)

    // 6. Update daily summary
    await updateDailySummary(new Date(), {
      total_sales_amount: { increment: sale.total_amount },
      total_sales_count: { increment: 1 },
      [`${sale.payment_method}_payments`]: { increment: sale.total_amount }
    }, trx)

    // Commit transaction
  })
}
```

---

## Cashier Session Management

### Shift/Session Tracking

```typescript
interface CashierSession {
  id: number
  session_number: string
  cashier_id: number
  terminal_id: string

  // Timing
  started_at: timestamp
  ended_at: timestamp | null

  // Cash management
  opening_cash: decimal
  closing_cash: decimal
  expected_cash: decimal
  cash_variance: decimal

  // Sales summary
  total_sales: number
  total_amount: decimal
  cash_sales: decimal
  card_sales: decimal
  transfer_sales: decimal

  // Status
  status: 'active' | 'closed' | 'reconciled'
}

// Start shift
async function startCashierShift(cashierId: number, openingCash: decimal) {
  const session = await createCashierSession({
    session_number: await getNextNumber('SHIFT'),
    cashier_id: cashierId,
    terminal_id: getTerminalId(),
    started_at: new Date(),
    opening_cash: openingCash,
    status: 'active'
  })

  return session
}

// End shift
async function endCashierShift(sessionId: number, closingCash: decimal) {
  const session = await getCashierSession(sessionId)

  // Calculate expected cash
  const expectedCash = session.opening_cash + session.cash_sales

  // Calculate variance
  const variance = closingCash - expectedCash

  await updateCashierSession(sessionId, {
    ended_at: new Date(),
    closing_cash: closingCash,
    expected_cash: expectedCash,
    cash_variance: variance,
    status: 'closed'
  })

  // Generate shift report
  const report = await generateShiftReport(sessionId)

  // If variance exceeds threshold, flag for review
  if (Math.abs(variance) > 100) {
    await createAlert({
      type: 'CASH_VARIANCE',
      severity: 'WARNING',
      message: `Cash variance of ₦${variance} detected in session ${session.session_number}`
    })
  }

  return report
}
```

---

## Supervisor Override

### Price Override / High Discount

```typescript
async function requestSupervisorOverride(
  action: string,
  data: any,
  cashierId: number
): Promise<boolean> {
  // Display supervisor PIN prompt
  const supervisorPIN = await promptSupervisorPIN()

  // Validate supervisor
  const supervisor = await validateSupervisorPIN(supervisorPIN)

  if (!supervisor) {
    throw new Error('Invalid supervisor PIN')
  }

  // Check supervisor has required permission
  if (!supervisor.hasPermission(`pos.${action}.override`)) {
    throw new Error('Supervisor lacks required permission')
  }

  // Log override
  await auditLog({
    action: 'SUPERVISOR_OVERRIDE',
    entity_type: 'pos_sale',
    user_id: supervisor.id,
    additional_data: {
      cashier_id: cashierId,
      override_type: action,
      override_data: data
    }
  })

  return true
}

// Usage
if (discountPercent > 5) {
  const approved = await requestSupervisorOverride('discount', {
    discount_percent: discountPercent,
    original_total: subtotal,
    discounted_total: total
  }, cashierId)

  if (!approved) {
    throw new Error('Supervisor approval required for discounts > 5%')
  }
}
```

---

## Receipt Generation

### Receipt Format

```
┌─────────────────────────────────────────┐
│         FIRSTGIWA TRADING LTD           │
│      123 Commerce Street, Lagos         │
│         Tel: +234 800 123 4567          │
│          info@firstgiwa.com             │
├─────────────────────────────────────────┤
│  Receipt No: POS-2026-00142             │
│  Date: 2026-01-31 14:35:22              │
│  Cashier: John Doe                      │
│  Customer: Walk-in                      │
├─────────────────────────────────────────┤
│                                         │
│  Yellow Maize (50 kg)                   │
│  1 × ₦35,000.00        ₦35,000.00      │
│                                         │
│  Soybean Meal (25 kg)                   │
│  2 × ₦28,500.00        ₦57,000.00      │
│                                         │
├─────────────────────────────────────────┤
│  Subtotal:              ₦92,000.00     │
│  Tax (7.5%):             ₦6,900.00     │
│  Discount:                  ₦0.00      │
├─────────────────────────────────────────┤
│  TOTAL:                 ₦98,900.00     │
│                                         │
│  Payment Method: Cash                   │
│  Amount Tendered:      ₦100,000.00     │
│  Change:                 ₦1,100.00     │
├─────────────────────────────────────────┤
│     Thank you for your business!        │
│        Points Earned: 989               │
│                                         │
│      Goods sold are not returnable      │
│      except with this receipt           │
└─────────────────────────────────────────┘
```

---

## POS Reports

### 1. Cashier Shift Report
- Session details
- Number of transactions
- Total sales amount
- Payment method breakdown
- Cash reconciliation
- Variance analysis

### 2. Hourly Sales Report
- Sales by hour of day
- Peak hours identification
- Staff scheduling optimization

### 3. Product Sales Report
- Best sellers
- Slow movers
- Stock alerts for POS items

### 4. Daily Reconciliation
- Expected vs actual cash
- Card payment reconciliation
- Pending transfer confirmations

---

## API Endpoints

```
# POS Sales
POST   /api/pos/sales
GET    /api/pos/sales?session_id={id}
GET    /api/pos/products?available=true
GET    /api/pos/customers/search?q={phone}

# Sessions
POST   /api/pos/sessions/start
POST   /api/pos/sessions/{id}/end
GET    /api/pos/sessions/{id}/report

# Supervisor
POST   /api/pos/supervisor/override
POST   /api/pos/supervisor/void-sale

# Receipts
GET    /api/pos/sales/{id}/receipt
POST   /api/pos/sales/{id}/reprint
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-31
**Next**: [Payments Module](PAYMENTS.md)
