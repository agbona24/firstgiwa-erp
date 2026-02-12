# Credit & Payments System Guide

## Overview

This document explains how credit transactions and payments work in the FirstGIWA ERP system.

---

## Database Structure

### 1. **Sales Orders** (`sales_orders`)
The source of all sales transactions.

| Field | Description |
|-------|-------------|
| `id` | Primary key |
| `customer_id` | Link to customer |
| `total_amount` | Full order value (e.g., ₦500,000) |
| `payment_type` | `cash`, `credit`, `pos`, `transfer` |
| `payment_status` | `pending`, `partial`, `paid` |
| `paid_amount` | Amount paid so far |

### 2. **Customer Credit Transactions** (`customer_credit_transactions`)
Tracks credit purchases separately for credit facility management.

| Field | Description |
|-------|-------------|
| `id` | Primary key |
| `customer_id` | Link to customer |
| `sales_order_id` | Link to the sales order |
| `reference_number` | e.g., `CTX-2026-0007` |
| `transaction_type` | `purchase` or `payment` |
| `amount` | Credit amount (e.g., ₦500,000) |
| `due_date` | When payment is due |
| `status` | `pending`, `partial`, `paid`, `overdue` |

### 3. **Payments** (`payments`)
**The master payment record** - stores ALL payments using polymorphic relationships.

| Field | Description |
|-------|-------------|
| `id` | Primary key |
| `payment_reference` | e.g., `PAY-2026-001` |
| `payable_type` | `App\Models\SalesOrder` or `App\Models\CustomerCreditTransaction` |
| `payable_id` | ID of the linked record |
| `customer_id` | Link to customer |
| `amount` | Payment amount (e.g., ₦250,000) |
| `payment_method` | `cash`, `transfer`, `pos`, `cheque` |
| `payment_date` | When payment was made |
| `notes` | Optional notes |

### 4. **Customer Credit Payments** (`customer_credit_payments`)
Legacy table for direct credit payments (less commonly used now).

---

## Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CREDIT SALE FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Customer makes a CREDIT purchase
─────────────────────────────────────────
    ┌──────────────────┐
    │   Sales Order    │  payment_type = 'credit'
    │   ID: 5          │  total_amount = ₦500,000
    │   ₦500,000       │  payment_status = 'pending'
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Credit Tracking  │  Creates a tracking record
    │ CTX-2026-0007    │  amount = ₦500,000
    │ sales_order_id=5 │  status = 'pending'
    └──────────────────┘


Step 2: Customer makes a PAYMENT
────────────────────────────────
    ┌──────────────────┐
    │    Payment       │  payable_type = 'App\Models\SalesOrder'
    │  PAY-2026-001    │  payable_id = 5
    │   ₦300,000       │  amount = ₦300,000
    └──────────────────┘

    Now:
    - Sales Order 5: paid ₦300,000, balance ₦200,000 → PARTIAL
    - CTX-2026-0007: same calculation → PARTIAL


Step 3: Customer pays remaining balance
───────────────────────────────────────
    ┌──────────────────┐
    │    Payment       │  payable_type = 'App\Models\SalesOrder'
    │  PAY-2026-002    │  payable_id = 5
    │   ₦200,000       │  amount = ₦200,000
    └──────────────────┘

    Now:
    - Sales Order 5: paid ₦500,000, balance ₦0 → PAID
    - CTX-2026-0007: same calculation → PAID
```

---

## Status Calculation Logic

The system **dynamically calculates** transaction status based on actual payments:

```php
// Get all payments for a sales order
$payments = Payment::where('payable_type', 'App\Models\SalesOrder')
                   ->where('payable_id', $salesOrder->id)
                   ->sum('amount');

$totalAmount = $salesOrder->total_amount;  // e.g., ₦500,000
$paidAmount = $payments;                    // e.g., ₦300,000
$balance = $totalAmount - $paidAmount;      // e.g., ₦200,000

// Determine status
if ($balance <= 0) {
    $status = 'paid';       // Fully paid
} elseif ($paidAmount > 0) {
    $status = 'partial';    // Some payment made
} elseif (now() > $dueDate) {
    $status = 'overdue';    // Past due date, no payment
} else {
    $status = 'pending';    // Not yet due
}
```

---

## Payment Summary Explained

| Status | Meaning | Color |
|--------|---------|-------|
| **Paid** | Balance = ₦0 (fully paid) | 🟢 Green |
| **Partial** | Paid > ₦0 but Balance > ₦0 | 🔵 Blue |
| **Pending** | No payment yet, not overdue | 🟡 Yellow |
| **Overdue** | No/partial payment, past due date | 🔴 Red |

---

## Example: Customer 6 (Feedmill Distributors Ltd)

### Transactions:

| Reference | Amount | Paid | Balance | Status |
|-----------|--------|------|---------|--------|
| CTX-2026-0007 | ₦500,000 | ₦498,500 | ₦1,500 | **PARTIAL** |
| CTX-2026-0006 | ₦500,000 | ₦500,000 | ₦0 | **PAID** |
| CTX-2026-0005 | ₦500,000 | ₦501,500 | ₦0 | **PAID** |

### How Paid Amounts are Calculated:

```
CTX-2026-0007 (Sales Order ID: 7)
├── Payment 1: ₦200,000
├── Payment 2: ₦150,000
├── Payment 3: ₦148,500
└── Total Paid: ₦498,500 (Balance: ₦1,500) → PARTIAL

CTX-2026-0006 (Sales Order ID: 6)
├── Payment 1: ₦500,000
└── Total Paid: ₦500,000 (Balance: ₦0) → PAID

CTX-2026-0005 (Sales Order ID: 5)
├── Payment 1: ₦501,500 (overpayment applied)
└── Total Paid: ₦501,500 (Balance: ₦0) → PAID
```

### Summary:
- **Total Transactions:** 3
- **Paid:** 2
- **Partial:** 1
- **Pending:** 0
- **Overdue:** 0

---

## Key Relationships

```
Customer (ID: 6)
    │
    ├── SalesOrder (ID: 5, credit, ₦500,000)
    │       │
    │       ├── CustomerCreditTransaction (CTX-2026-0005)
    │       │
    │       └── Payment (₦501,500) ─────────────────┐
    │                                                │
    ├── SalesOrder (ID: 6, credit, ₦500,000)        │
    │       │                                        │
    │       ├── CustomerCreditTransaction (CTX-2026-0006)
    │       │                                        │
    │       └── Payment (₦500,000) ─────────────────┤
    │                                                │
    └── SalesOrder (ID: 7, credit, ₦500,000)        │
            │                                        │
            ├── CustomerCreditTransaction (CTX-2026-0007)
            │                                        │
            └── Payments (₦498,500 total) ──────────┘
                                                     │
                                                     ▼
                                            ┌─────────────────┐
                                            │ payments table  │
                                            │ payable_type =  │
                                            │ 'SalesOrder'    │
                                            └─────────────────┘
```

---

## Why This Design?

### Polymorphic Payments Table
- **Flexibility:** One `payments` table handles payments for ANY payable entity
- **Scalability:** Can add payments for Purchase Orders, Expenses, etc.
- **Auditability:** Complete payment history in one place

### Credit Tracking Separation
- **Credit Facility Management:** Separate tracking for credit limits, utilization
- **Aging Reports:** Easy to calculate 30/60/90 day aging
- **Risk Assessment:** Credit score calculation based on payment history

---

## Common Queries

### Get all payments for a customer's credit transactions:
```php
$payments = Payment::where('customer_id', $customerId)
    ->where('payable_type', 'App\Models\SalesOrder')
    ->whereHas('payable', fn($q) => $q->where('payment_type', 'credit'))
    ->get();
```

### Calculate outstanding balance:
```php
$totalCredit = SalesOrder::where('customer_id', $customerId)
    ->where('payment_type', 'credit')
    ->sum('total_amount');

$totalPaid = Payment::where('customer_id', $customerId)
    ->where('payable_type', 'App\Models\SalesOrder')
    ->sum('amount');

$outstanding = $totalCredit - $totalPaid;
```

### Get partial payments:
```php
// Transactions where paid > 0 but paid < total
$partialTransactions = CustomerCreditTransaction::where('customer_id', $customerId)
    ->get()
    ->filter(function($tx) {
        $paid = Payment::where('payable_type', 'App\Models\SalesOrder')
            ->where('payable_id', $tx->sales_order_id)
            ->sum('amount');
        return $paid > 0 && $paid < $tx->amount;
    });
```

---

## Recording a New Payment

When a customer makes a payment against their credit:

```php
// 1. Create payment record
$payment = Payment::create([
    'payment_reference' => 'PAY-' . date('Y') . '-' . str_pad($nextId, 3, '0', STR_PAD_LEFT),
    'payable_type' => 'App\Models\SalesOrder',
    'payable_id' => $salesOrder->id,
    'customer_id' => $customer->id,
    'amount' => $paymentAmount,
    'payment_method' => 'transfer',
    'payment_date' => now(),
    'notes' => 'Credit payment',
]);

// 2. Update sales order paid_amount (optional, for quick lookups)
$salesOrder->increment('paid_amount', $paymentAmount);

// 3. Check if fully paid
$totalPaid = Payment::where('payable_type', 'App\Models\SalesOrder')
    ->where('payable_id', $salesOrder->id)
    ->sum('amount');

if ($totalPaid >= $salesOrder->total_amount) {
    $salesOrder->update(['payment_status' => 'paid']);
} elseif ($totalPaid > 0) {
    $salesOrder->update(['payment_status' => 'partial']);
}

// 4. Update customer outstanding balance
$customer->recalculateOutstandingBalance();
```

---

## Summary

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `sales_orders` | All sales | `total_amount`, `payment_type`, `payment_status` |
| `customer_credit_transactions` | Credit tracking | `sales_order_id`, `amount`, `due_date` |
| `payments` | All payments (polymorphic) | `payable_type`, `payable_id`, `amount` |
| `customer_credit_payments` | Legacy direct payments | `transaction_id`, `amount` |

**The `payments` table is the source of truth for payment amounts.** Status is calculated dynamically by summing payments and comparing to the transaction amount.
