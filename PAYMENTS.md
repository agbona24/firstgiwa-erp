# Payments Module

## Overview
Enterprise payment management system supporting:
- Multiple payment methods (cash, card, bank transfer, mobile money)
- Mixed payments (multiple methods for single transaction)
- Payment reconciliation
- Refund management with approval workflow
- Over/under-payment handling
- Payment confirmations and receipts
- Comprehensive audit trail

---

## Payment Methods

### Supported Methods

1. **Cash**
   - Immediate confirmation
   - Physical cash handling
   - Daily reconciliation required

2. **Bank Transfer**
   - Requires transaction reference
   - Pending confirmation status
   - Manual/automated reconciliation

3. **Card (POS Terminal)**
   - Visa, Mastercard, Verve
   - Immediate authorization
   - Settlement within 24-48 hours

4. **Mobile Money** (Future)
   - MTN Mobile Money
   - Airtel Money
   - API integration

5. **Mixed Payment**
   - Combination of above methods
   - Split amounts tracked separately
   - Total must match order amount

---

## Payment Data Structure

```typescript
interface Payment {
  id: number
  payment_number: string          // PAY-2026-00001

  // Reference (what is being paid)
  reference_type: 'sales_order' | 'purchase_order' | 'refund'
  reference_id: number
  reference_number: string        // Order number for easy lookup

  // Payer Information
  payer_type: 'customer' | 'supplier' | 'other'
  payer_id: number | null
  payer_name: string

  // Payment Details
  payment_date: date
  payment_method: PaymentMethod
  amount: decimal
  currency: string                // NGN, USD, etc.

  // Status Workflow
  status: 'pending' | 'confirmed' | 'reconciled' | 'failed' | 'cancelled'

  // Method-Specific Details
  bank_name: string | null
  account_number: string | null
  transaction_reference: string | null
  bank_confirmation_date: date | null
  confirmed_by: number | null

  card_last_four: string | null
  card_type: 'visa' | 'mastercard' | 'verve' | null
  card_transaction_id: string | null

  // Reconciliation
  reconciled_at: timestamp | null
  reconciled_by: number | null

  // Metadata
  notes: string
  receipt_url: string | null
  created_by: number
  created_at: timestamp
  updated_at: timestamp
}

type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'mobile_money' | 'mixed'
```

---

## Payment Status Workflow

```
┌──────────┐
│ PENDING  │ ← Payment recorded, awaiting confirmation
└────┬─────┘
     │ Confirm payment (cash/card: immediate, transfer: after verification)
     ▼
┌───────────┐
│ CONFIRMED │ ← Payment verified, funds received
└────┬──────┘
     │ Reconciled with bank statement / cash count
     ▼
┌─────────────┐
│ RECONCILED  │ ← Matched with actual funds
└─────────────┘

Can fail or be cancelled from PENDING
     ▼
┌─────────┐   ┌───────────┐
│ FAILED  │   │ CANCELLED │
└─────────┘   └───────────┘
```

---

## Recording Payments

### Simple Payment (Single Method)

```typescript
async function recordPayment(data: PaymentData): Promise<Payment> {
  const order = await getSalesOrder(data.order_id)

  // Validate amount
  if (data.amount <= 0) {
    throw new Error('Payment amount must be greater than 0')
  }

  if (data.amount > order.balance_due) {
    // Overpayment - ask user to confirm
    const confirmed = await confirmOverpayment(data.amount, order.balance_due)
    if (!confirmed) {
      throw new Error('Payment amount exceeds balance due')
    }
  }

  // Create payment record
  const payment = await createPayment({
    payment_number: await getNextNumber('PAY'),
    reference_type: 'sales_order',
    reference_id: order.id,
    reference_number: order.order_number,
    payer_type: 'customer',
    payer_id: order.customer_id,
    payer_name: order.customer.name,
    payment_date: data.payment_date || new Date(),
    payment_method: data.method,
    amount: data.amount,
    currency: 'NGN',
    status: getInitialStatus(data.method),
    created_by: data.created_by
  })

  // Method-specific handling
  if (data.method === 'bank_transfer') {
    await updatePayment(payment.id, {
      bank_name: data.bank_name,
      transaction_reference: data.transaction_reference,
      status: 'pending'  // Requires confirmation
    })
  } else if (data.method === 'card') {
    await updatePayment(payment.id, {
      card_last_four: data.card_number.slice(-4),
      card_type: data.card_type,
      card_transaction_id: data.transaction_id,
      status: 'confirmed'  // Card payments are immediately confirmed
    })
  } else if (data.method === 'cash') {
    await updatePayment(payment.id, {
      status: 'confirmed'  // Cash is immediately confirmed
    })
  }

  // Update order payment tracking
  await updateOrderPayment(order.id, payment.amount)

  // Audit log
  await auditLog({
    action: 'CREATE',
    entity_type: 'payment',
    entity_id: payment.id,
    user_id: data.created_by,
    new_values: payment
  })

  return payment
}

function getInitialStatus(method: PaymentMethod): string {
  switch (method) {
    case 'cash':
    case 'card':
      return 'confirmed'
    case 'bank_transfer':
    case 'mobile_money':
      return 'pending'
    default:
      return 'pending'
  }
}

async function updateOrderPayment(orderId: number, paymentAmount: decimal) {
  const order = await getSalesOrder(orderId)

  const newAmountPaid = order.amount_paid + paymentAmount
  const newBalanceDue = order.total_amount - newAmountPaid

  let paymentStatus: PaymentStatus
  if (newBalanceDue <= 0) {
    paymentStatus = 'paid'
  } else if (newAmountPaid > 0) {
    paymentStatus = 'partially_paid'
  } else {
    paymentStatus = 'unpaid'
  }

  // Update order
  await updateSalesOrder(orderId, {
    amount_paid: newAmountPaid,
    payment_status: paymentStatus
  })

  // If fully paid, may trigger fulfillment
  if (paymentStatus === 'paid') {
    await notifyFulfillment(orderId)
  }

  // Update customer credit used (if on credit)
  if (order.payment_terms > 0) {
    await updateCreditUsed(order.customer_id, paymentAmount, 'decrease')
  }
}
```

---

## Mixed Payments

### Recording Split Payments

```typescript
interface MixedPaymentData {
  order_id: number
  total_amount: decimal
  splits: PaymentSplit[]
  created_by: number
}

interface PaymentSplit {
  method: PaymentMethod
  amount: decimal
  // Method-specific fields
  bank_name?: string
  transaction_reference?: string
  card_last_four?: string
  card_type?: string
  card_transaction_id?: string
}

async function recordMixedPayment(data: MixedPaymentData): Promise<Payment> {
  // Validate split totals
  const splitTotal = data.splits.reduce((sum, split) => sum + split.amount, 0)

  if (Math.abs(splitTotal - data.total_amount) > 0.01) {
    throw new Error(`Split amounts (₦${splitTotal}) do not match total (₦${data.total_amount})`)
  }

  // Create main payment record
  const payment = await createPayment({
    payment_number: await getNextNumber('PAY'),
    reference_type: 'sales_order',
    reference_id: data.order_id,
    payment_method: 'mixed',
    amount: data.total_amount,
    status: 'pending',  // Will update based on all splits
    created_by: data.created_by
  })

  // Create split records
  for (const split of data.splits) {
    await createPaymentSplit({
      payment_id: payment.id,
      payment_method: split.method,
      amount: split.amount,
      bank_name: split.bank_name,
      transaction_reference: split.transaction_reference,
      card_last_four: split.card_last_four
    })
  }

  // Determine overall status
  // If all splits are confirmed (cash/card), payment is confirmed
  // If any split is pending (transfer), payment is pending
  const hasP endingSplit = data.splits.some(split =>
    split.method === 'bank_transfer' || split.method === 'mobile_money'
  )

  await updatePayment(payment.id, {
    status: hasPendingSplit ? 'pending' : 'confirmed'
  })

  // Update order
  await updateOrderPayment(data.order_id, data.total_amount)

  return payment
}

// Example: Customer pays ₦100,000
// ₦60,000 cash + ₦40,000 bank transfer
const mixedPayment = await recordMixedPayment({
  order_id: 123,
  total_amount: 100000,
  splits: [
    {
      method: 'cash',
      amount: 60000
    },
    {
      method: 'bank_transfer',
      amount: 40000,
      bank_name: 'GTBank',
      transaction_reference: 'TRF987654321'
    }
  ],
  created_by: currentUser.id
})
```

---

## Payment Confirmation

### Bank Transfer Confirmation

```typescript
async function confirmBankPayment(
  paymentId: number,
  confirmationData: {
    confirmed_by: number
    confirmation_date: date
    verified: boolean
    notes?: string
  }
): Promise<void> {
  const payment = await getPayment(paymentId)

  // Permission check
  const user = await getUser(confirmationData.confirmed_by)
  if (!user.hasPermission('payments.reconcile')) {
    throw new Error('Insufficient permission to confirm payments')
  }

  // Update payment
  await updatePayment(paymentId, {
    status: confirmationData.verified ? 'confirmed' : 'failed',
    bank_confirmation_date: confirmationData.confirmation_date,
    confirmed_by: confirmationData.confirmed_by
  })

  // Audit log
  await auditLog({
    action: 'CONFIRM',
    entity_type: 'payment',
    entity_id: paymentId,
    user_id: confirmationData.confirmed_by,
    old_values: { status: payment.status },
    new_values: { status: confirmationData.verified ? 'confirmed' : 'failed' },
    reason: confirmationData.notes
  })

  // If failed, may need to follow up
  if (!confirmationData.verified) {
    await createSystemAlert({
      type: 'PAYMENT_FAILED',
      severity: 'WARNING',
      title: 'Payment Verification Failed',
      message: `Payment ${payment.payment_number} failed verification`,
      entity_type: 'payment',
      entity_id: paymentId
    })

    // Revert order payment status if needed
    await revertOrderPayment(payment.reference_id, payment.amount)
  }
}
```

---

## Payment Reconciliation

### Daily Cash Reconciliation

```typescript
interface CashReconciliation {
  date: date
  cashier_id: number

  // Expected (from system)
  opening_cash: decimal
  total_cash_sales: decimal
  total_cash_expenses: decimal
  expected_closing_cash: decimal

  // Actual (physical count)
  actual_closing_cash: decimal

  // Variance
  variance: decimal
  variance_reason: string | null

  // Denominations (optional)
  denominations: CashDenomination[]
}

interface CashDenomination {
  note_value: decimal
  count: number
  total: decimal
}

async function performCashReconciliation(
  data: CashReconciliation
): Promise<void> {
  // Calculate expected
  const expected = data.opening_cash +
                   data.total_cash_sales -
                   data.total_cash_expenses

  const variance = data.actual_closing_cash - expected

  // Record reconciliation
  await createCashReconciliation({
    ...data,
    expected_closing_cash: expected,
    variance: variance
  })

  // Update all cash payments to 'reconciled'
  await updatePayments({
    payment_date: data.date,
    payment_method: 'cash',
    status: 'confirmed'
  }, {
    status: 'reconciled',
    reconciled_at: new Date(),
    reconciled_by: data.cashier_id
  })

  // Alert if significant variance
  if (Math.abs(variance) > 500) {
    await createSystemAlert({
      type: 'CASH_VARIANCE',
      severity: variance > 0 ? 'INFO' : 'WARNING',
      title: 'Significant Cash Variance',
      message: `Variance of ₦${variance} detected for ${data.date}`,
      entity_type: 'cash_reconciliation'
    })
  }

  // Audit log
  await auditLog({
    action: 'RECONCILE',
    entity_type: 'cash_reconciliation',
    user_id: data.cashier_id,
    new_values: {
      expected: expected,
      actual: data.actual_closing_cash,
      variance: variance
    }
  })
}
```

### Bank Reconciliation

```typescript
async function reconcileBankPayments(
  bankStatementData: BankStatement[]
): Promise<ReconciliationReport> {
  const pendingPayments = await getPayments({
    payment_method: 'bank_transfer',
    status: 'pending'
  })

  const matched: Payment[] = []
  const unmatched: Payment[] = []

  for (const payment of pendingPayments) {
    // Try to match with bank statement
    const statementEntry = bankStatementData.find(entry =>
      entry.reference === payment.transaction_reference &&
      Math.abs(entry.amount - payment.amount) < 0.01 &&
      entry.credit_debit === 'credit'
    )

    if (statementEntry) {
      // Match found
      await confirmBankPayment(payment.id, {
        confirmed_by: getCurrentUser().id,
        confirmation_date: statementEntry.transaction_date,
        verified: true,
        notes: `Auto-matched with bank statement`
      })
      matched.push(payment)
    } else {
      unmatched.push(payment)
    }
  }

  return {
    total_processed: pendingPayments.length,
    matched: matched.length,
    unmatched: unmatched.length,
    matched_payments: matched,
    unmatched_payments: unmatched
  }
}
```

---

## Refunds Management

### Refund Request Workflow

```
Step 1: Initiate Refund Request
  Actor: Cashier / Sales Officer
  Permission: payments.refund.request
  - Select original sale/order
  - Enter refund amount
  - Select reason
  - Upload supporting documents (optional)
  - Status: PENDING

Step 2: Approval
  Actor: Approver / Manager
  Permission: payments.refund.approve
  Checks:
    - Approver ≠ Requester
    - Refund amount <= original payment
    - Reason is valid
  Actions:
    - Approve → Status: APPROVED
    - Reject → Status: REJECTED

Step 3: Process Refund
  Actor: Accountant / Cashier
  Permission: payments.refund.process
  - Select refund method (cash / bank transfer / store credit)
  - Record refund transaction
  - Status: PROCESSED

Step 4: Complete Refund
  - Update original order status
  - Adjust inventory (if goods returned)
  - Update financial records
  - Status: COMPLETED
```

### Refund Data Structure

```typescript
interface Refund {
  id: number
  refund_number: string           // REF-2026-00001
  sales_order_id: number
  original_payment_id: number

  // Refund Details
  refund_amount: decimal
  refund_reason: 'damaged_goods' | 'wrong_item' | 'customer_request' | 'quality_issue' | 'other'
  refund_type: 'full' | 'partial'
  reason_notes: string

  // Status & Workflow
  status: 'pending' | 'approved' | 'processed' | 'completed' | 'rejected'

  requested_at: timestamp
  requested_by: number

  approved_at: timestamp | null
  approved_by: number | null

  processed_at: timestamp | null
  processed_by: number | null

  rejection_reason: string | null

  // Refund Method
  refund_method: 'cash' | 'bank_transfer' | 'store_credit'
  bank_reference: string | null

  // Metadata
  notes: string
  attachments: string[]
}

async function requestRefund(data: RefundRequestData): Promise<Refund> {
  const order = await getSalesOrder(data.order_id)
  const originalPayment = await getPayment(data.payment_id)

  // Validation
  if (data.refund_amount > originalPayment.amount) {
    throw new Error('Refund amount cannot exceed original payment')
  }

  if (order.status === 'cancelled') {
    throw new Error('Cannot refund cancelled order')
  }

  // Create refund request
  const refund = await createRefund({
    refund_number: await getNextNumber('REF'),
    sales_order_id: order.id,
    original_payment_id: originalPayment.id,
    refund_amount: data.refund_amount,
    refund_reason: data.reason,
    refund_type: data.refund_amount >= order.total_amount ? 'full' : 'partial',
    reason_notes: data.notes,
    status: 'pending',
    requested_at: new Date(),
    requested_by: data.requested_by
  })

  // Notify approvers
  await notifyApprovers('refund_approval', refund.id)

  return refund
}

async function approveRefund(refundId: number, approverId: number): Promise<void> {
  const refund = await getRefund(refundId)

  // SOD check
  if (refund.requested_by === approverId) {
    throw new Error('Cannot approve own refund request (SOD violation)')
  }

  // Permission check
  const approver = await getUser(approverId)
  if (!approver.hasPermission('payments.refund.approve')) {
    throw new Error('Insufficient permission')
  }

  // Approve
  await updateRefund(refundId, {
    status: 'approved',
    approved_at: new Date(),
    approved_by: approverId
  })

  // Audit log
  await auditLog({
    action: 'APPROVE',
    entity_type: 'refund',
    entity_id: refundId,
    user_id: approverId
  })

  // Notify requester
  await notifyUser(refund.requested_by, {
    title: 'Refund Approved',
    message: `Refund ${refund.refund_number} has been approved`
  })
}

async function processRefund(
  refundId: number,
  method: 'cash' | 'bank_transfer' | 'store_credit',
  processedBy: number
): Promise<void> {
  const refund = await getRefund(refundId)

  if (refund.status !== 'approved') {
    throw new Error('Only approved refunds can be processed')
  }

  // Process based on method
  if (method === 'cash') {
    // Record cash disbursement
    // Update cash register
  } else if (method === 'bank_transfer') {
    // Initiate bank transfer
    // Record bank reference
  } else if (method === 'store_credit') {
    // Credit customer account
    await addStoreCredit(refund.customer_id, refund.refund_amount)
  }

  // Update refund
  await updateRefund(refundId, {
    status: 'processed',
    processed_at: new Date(),
    processed_by: processedBy,
    refund_method: method
  })

  // Update original order
  await updateOrderAfterRefund(refund.sales_order_id, refund.refund_amount)

  // Create negative payment record
  await createPayment({
    payment_number: await getNextNumber('PAY'),
    reference_type: 'refund',
    reference_id: refundId,
    payment_method: method,
    amount: -refund.refund_amount,  // Negative for refund
    status: 'confirmed',
    created_by: processedBy
  })

  // Mark as completed
  await updateRefund(refundId, {
    status: 'completed'
  })
}
```

---

## Over/Under Payment Handling

### Overpayment

```typescript
async function handleOverpayment(
  orderId: number,
  excessAmount: decimal
): Promise<void> {
  const order = await getSalesOrder(orderId)

  // Options for overpayment:
  // 1. Refund excess
  // 2. Apply as store credit
  // 3. Apply to next order

  await createSystemAlert({
    type: 'OVERPAYMENT',
    severity: 'INFO',
    title: 'Overpayment Detected',
    message: `Order ${order.order_number} has excess payment of ₦${excessAmount}`,
    entity_type: 'sales_order',
    entity_id: orderId
  })

  // For now, mark order as paid
  await updateSalesOrder(orderId, {
    payment_status: 'paid',
    // Store excess in notes for manual handling
    internal_notes: `Overpayment of ₦${excessAmount}. Requires resolution.`
  })

  // Accountant will handle excess manually
}
```

### Underpayment

```typescript
async function handleUnderpayment(
  orderId: number,
  shortfall: decimal
): Promise<void> {
  const order = await getSalesOrder(orderId)

  // Cannot fulfill until fully paid (or partial fulfillment allowed)
  await updateSalesOrder(orderId, {
    payment_status: 'partially_paid',
    internal_notes: `Shortfall of ₦${shortfall} remaining`
  })

  // Notify sales team
  await notifyUser(order.created_by, {
    title: 'Partial Payment Received',
    message: `Order ${order.order_number} still has ₦${shortfall} outstanding`
  })
}
```

---

## Payment Reports

### 1. Payment Summary Report
- Total payments by period
- Breakdown by payment method
- Pending confirmations
- Reconciliation status

### 2. Outstanding Payments Report
- Orders awaiting payment
- Partially paid orders
- Overdue invoices (by due date)

### 3. Refund Report
- Total refunds by period
- Refund reasons analysis
- Pending refund approvals
- Average refund processing time

### 4. Reconciliation Report
- Cash reconciliation with variances
- Bank reconciliation status
- Unmatched payments

---

## API Endpoints

```
# Payments
POST   /api/payments
GET    /api/payments
GET    /api/payments/{id}
POST   /api/payments/{id}/confirm
POST   /api/payments/mixed

# Refunds
POST   /api/refunds
GET    /api/refunds
GET    /api/refunds/{id}
POST   /api/refunds/{id}/approve
POST   /api/refunds/{id}/reject
POST   /api/refunds/{id}/process

# Reconciliation
POST   /api/payments/reconcile/cash
POST   /api/payments/reconcile/bank
GET    /api/payments/pending-reconciliation

# Reports
GET    /api/reports/payments-summary
GET    /api/reports/outstanding-payments
GET    /api/reports/refunds
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-31
**Next**: [Audit Trail System](AUDIT_TRAIL.md)
