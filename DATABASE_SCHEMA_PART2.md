# Database Schema - Part 2 (Payments, Audit, Accounting)

## 6. PAYMENTS MODULE

#### payments
```sql
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    payment_number VARCHAR(50) NOT NULL UNIQUE,

    -- Reference
    reference_type VARCHAR(30) NOT NULL, -- sales_order, purchase_order, refund
    reference_id BIGINT NOT NULL,

    -- Payer info
    payer_type VARCHAR(20) NOT NULL, -- customer, supplier, other
    payer_id BIGINT, -- customer_id or supplier_id
    payer_name VARCHAR(255),

    -- Payment details
    payment_date DATE NOT NULL,
    payment_method VARCHAR(20) NOT NULL, -- cash, bank_transfer, card, mobile_money, mixed
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',

    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    -- pending → confirmed → reconciled → failed → cancelled

    -- Bank transfer details
    bank_name VARCHAR(150),
    account_number VARCHAR(50),
    transaction_reference VARCHAR(100),
    bank_confirmation_date DATE,
    confirmed_by BIGINT REFERENCES users(id),

    -- Card payment details
    card_last_four VARCHAR(4),
    card_type VARCHAR(20), -- visa, mastercard, verve
    card_transaction_id VARCHAR(100),

    -- Reconciliation
    reconciled_at TIMESTAMP,
    reconciled_by BIGINT REFERENCES users(id),

    -- Metadata
    notes TEXT,
    receipt_url VARCHAR(500),
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_payment_reference_type CHECK (reference_type IN ('sales_order', 'purchase_order', 'refund', 'other')),
    CONSTRAINT chk_payment_payer_type CHECK (payer_type IN ('customer', 'supplier', 'other')),
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'mobile_money', 'mixed')),
    CONSTRAINT chk_payment_status CHECK (status IN ('pending', 'confirmed', 'reconciled', 'failed', 'cancelled'))
);

CREATE INDEX idx_payments_number ON payments(payment_number);
CREATE INDEX idx_payments_reference ON payments(reference_type, reference_id);
CREATE INDEX idx_payments_payer ON payments(payer_type, payer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_method ON payments(payment_method);
```

#### payment_splits
```sql
-- For mixed payments (e.g., part cash + part transfer)
CREATE TABLE payment_splits (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    payment_method VARCHAR(20) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,

    -- Method-specific details
    bank_name VARCHAR(150),
    transaction_reference VARCHAR(100),
    card_last_four VARCHAR(4),

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_split_payment_method CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'mobile_money'))
);

CREATE INDEX idx_payment_splits_payment ON payment_splits(payment_id);
```

#### refunds
```sql
CREATE TABLE refunds (
    id BIGSERIAL PRIMARY KEY,
    refund_number VARCHAR(50) NOT NULL UNIQUE,
    sales_order_id BIGINT REFERENCES sales_orders(id),
    original_payment_id BIGINT REFERENCES payments(id),

    -- Refund details
    refund_amount DECIMAL(15, 2) NOT NULL,
    refund_reason VARCHAR(50) NOT NULL, -- damaged_goods, wrong_item, customer_request, etc.
    refund_type VARCHAR(20) DEFAULT 'full', -- full, partial

    -- Status & approval
    status VARCHAR(20) DEFAULT 'pending',
    -- pending → approved → processed → completed → rejected
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    requested_by BIGINT NOT NULL REFERENCES users(id),
    approved_at TIMESTAMP,
    approved_by BIGINT REFERENCES users(id),
    processed_at TIMESTAMP,
    processed_by BIGINT REFERENCES users(id),
    rejection_reason TEXT,

    -- Refund method
    refund_method VARCHAR(20), -- cash, bank_transfer, store_credit
    bank_reference VARCHAR(100),

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_refund_type CHECK (refund_type IN ('full', 'partial')),
    CONSTRAINT chk_refund_status CHECK (status IN ('pending', 'approved', 'processed', 'completed', 'rejected')),
    CONSTRAINT chk_refund_method CHECK (refund_method IN ('cash', 'bank_transfer', 'store_credit')),
    CONSTRAINT chk_refund_requester_approver CHECK (requested_by != approved_by OR approved_by IS NULL)
);

CREATE INDEX idx_refunds_number ON refunds(refund_number);
CREATE INDEX idx_refunds_order ON refunds(sales_order_id);
CREATE INDEX idx_refunds_status ON refunds(status);
```

---

## 7. ACCOUNTING READINESS

#### transaction_ledger
```sql
-- Immutable financial ledger
CREATE TABLE transaction_ledger (
    id BIGSERIAL PRIMARY KEY,
    transaction_number VARCHAR(50) NOT NULL UNIQUE,

    -- Transaction details
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(30) NOT NULL, -- sale, purchase, payment, refund, adjustment

    -- Reference
    reference_type VARCHAR(30) NOT NULL,
    reference_id BIGINT NOT NULL,
    reference_number VARCHAR(50),

    -- Accounting
    account_code VARCHAR(20),
    account_name VARCHAR(150),
    debit_amount DECIMAL(15, 2) DEFAULT 0,
    credit_amount DECIMAL(15, 2) DEFAULT 0,

    -- Parties involved
    customer_id BIGINT REFERENCES customers(id),
    supplier_id BIGINT REFERENCES suppliers(id),

    -- Metadata
    description TEXT NOT NULL,
    posted_by BIGINT NOT NULL REFERENCES users(id),
    posted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Reversal tracking
    is_reversed BOOLEAN DEFAULT FALSE,
    reversed_by_transaction_id BIGINT REFERENCES transaction_ledger(id),

    CONSTRAINT chk_ledger_transaction_type CHECK (transaction_type IN ('sale', 'purchase', 'payment', 'refund', 'adjustment', 'transfer')),
    CONSTRAINT chk_ledger_amounts CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR
        (credit_amount > 0 AND debit_amount = 0)
    )
);

CREATE INDEX idx_ledger_date ON transaction_ledger(transaction_date);
CREATE INDEX idx_ledger_type ON transaction_ledger(transaction_type);
CREATE INDEX idx_ledger_reference ON transaction_ledger(reference_type, reference_id);
CREATE INDEX idx_ledger_account ON transaction_ledger(account_code);
CREATE INDEX idx_ledger_posted_at ON transaction_ledger(posted_at);
```

#### daily_summaries
```sql
-- Daily financial summaries for fast reporting
CREATE TABLE daily_summaries (
    id BIGSERIAL PRIMARY KEY,
    summary_date DATE NOT NULL UNIQUE,

    -- Sales
    total_sales_amount DECIMAL(15, 2) DEFAULT 0,
    total_sales_count INT DEFAULT 0,
    total_sales_cost DECIMAL(15, 2) DEFAULT 0,
    total_sales_profit DECIMAL(15, 2) DEFAULT 0,

    -- Purchases
    total_purchase_amount DECIMAL(15, 2) DEFAULT 0,
    total_purchase_count INT DEFAULT 0,

    -- Payments
    total_payments_received DECIMAL(15, 2) DEFAULT 0,
    total_payments_made DECIMAL(15, 2) DEFAULT 0,
    cash_payments DECIMAL(15, 2) DEFAULT 0,
    bank_payments DECIMAL(15, 2) DEFAULT 0,
    card_payments DECIMAL(15, 2) DEFAULT 0,

    -- Inventory
    total_stock_value DECIMAL(15, 2) DEFAULT 0,

    -- Metadata
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    generated_by BIGINT REFERENCES users(id)
);

CREATE INDEX idx_daily_summaries_date ON daily_summaries(summary_date);
```

---

## 8. AUDIT TRAIL (CRITICAL)

#### audit_logs
```sql
-- Immutable audit trail
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,

    -- Who
    user_id BIGINT REFERENCES users(id),
    username VARCHAR(50) NOT NULL,
    user_role VARCHAR(50),

    -- What
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, LOGOUT, etc.
    entity_type VARCHAR(50) NOT NULL, -- users, products, orders, payments, etc.
    entity_id BIGINT,

    -- When
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Where
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),

    -- Why (optional but recommended for critical actions)
    reason TEXT,

    -- Changes (JSON diff)
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[], -- Array of changed field names

    -- Context
    request_id VARCHAR(50), -- For tracking related actions
    session_id VARCHAR(100),

    -- Metadata
    additional_data JSONB,

    CONSTRAINT chk_audit_action CHECK (action IN (
        'CREATE', 'UPDATE', 'DELETE', 'VIEW',
        'APPROVE', 'REJECT', 'SUBMIT',
        'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
        'PERMISSION_DENIED', 'EXPORT', 'IMPORT'
    ))
);

-- Critical indexes for audit queries
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_ip ON audit_logs(ip_address);

-- GIN index for JSON searching
CREATE INDEX idx_audit_old_values ON audit_logs USING GIN (old_values);
CREATE INDEX idx_audit_new_values ON audit_logs USING GIN (new_values);
```

#### approval_workflows
```sql
CREATE TABLE approval_workflows (
    id BIGSERIAL PRIMARY KEY,
    workflow_name VARCHAR(100) NOT NULL UNIQUE,
    entity_type VARCHAR(50) NOT NULL, -- purchase_order, refund, stock_adjustment, etc.

    -- Approval levels
    levels_required INT DEFAULT 1,

    -- Amount thresholds (if applicable)
    min_amount DECIMAL(15, 2),
    max_amount DECIMAL(15, 2),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### approval_workflow_steps
```sql
CREATE TABLE approval_workflow_steps (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    required_permission VARCHAR(100) NOT NULL,
    required_role_id BIGINT REFERENCES roles(id),

    -- Timeouts
    timeout_hours INT,

    -- Escalation
    escalate_to_role_id BIGINT REFERENCES roles(id),

    CONSTRAINT uq_workflow_step_order UNIQUE (workflow_id, step_order)
);
```

#### approval_requests
```sql
CREATE TABLE approval_requests (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT NOT NULL REFERENCES approval_workflows(id),

    -- Request details
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    requested_action VARCHAR(50) NOT NULL,

    -- Requester
    requested_by BIGINT NOT NULL REFERENCES users(id),
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Current status
    current_step INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending',
    -- pending → approved → rejected → cancelled

    -- Final outcome
    completed_at TIMESTAMP,
    final_approver_id BIGINT REFERENCES users(id),

    -- Metadata
    request_data JSONB,
    notes TEXT,

    CONSTRAINT chk_approval_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired'))
);

CREATE INDEX idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_requester ON approval_requests(requested_by);
```

#### approval_actions
```sql
CREATE TABLE approval_actions (
    id BIGSERIAL PRIMARY KEY,
    approval_request_id BIGINT NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    workflow_step_id BIGINT NOT NULL REFERENCES approval_workflow_steps(id),

    -- Action
    action VARCHAR(20) NOT NULL, -- approve, reject, delegate
    action_by BIGINT NOT NULL REFERENCES users(id),
    action_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Delegation
    delegated_to BIGINT REFERENCES users(id),

    -- Comments
    comments TEXT,

    CONSTRAINT chk_approval_action CHECK (action IN ('approve', 'reject', 'delegate', 'escalate'))
);

CREATE INDEX idx_approval_actions_request ON approval_actions(approval_request_id);
```

---

## 9. SYSTEM CONFIGURATION

#### system_settings
```sql
CREATE TABLE system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    category VARCHAR(50), -- general, inventory, sales, accounting, etc.
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,

    -- Audit
    updated_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_category ON system_settings(category);
```

#### number_sequences
```sql
-- For auto-generating document numbers
CREATE TABLE number_sequences (
    id BIGSERIAL PRIMARY KEY,
    sequence_name VARCHAR(50) NOT NULL UNIQUE, -- PO, SO, INV, GRN, etc.
    prefix VARCHAR(20) NOT NULL,
    current_number BIGINT DEFAULT 0,
    padding INT DEFAULT 5, -- Number of digits (e.g., 00001)
    year_reset BOOLEAN DEFAULT FALSE,
    last_reset_year INT,

    -- Format example: PO-2026-00001
    format_template VARCHAR(100), -- {PREFIX}-{YEAR}-{NUMBER}

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 10. NOTIFICATIONS & ALERTS

#### notifications
```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification details
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(30), -- info, warning, error, success, approval_request

    -- Reference
    reference_type VARCHAR(50),
    reference_id BIGINT,
    action_url VARCHAR(500),

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,

    -- Priority
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,

    CONSTRAINT chk_notification_type CHECK (notification_type IN ('info', 'warning', 'error', 'success', 'approval_request', 'system')),
    CONSTRAINT chk_notification_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

#### system_alerts
```sql
-- System-wide alerts (low stock, expiring products, pending approvals)
CREATE TABLE system_alerts (
    id BIGSERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    -- low_stock, expiring_soon, pending_approval, overdue_payment, etc.

    -- Alert details
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Reference
    entity_type VARCHAR(50),
    entity_id BIGINT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by BIGINT REFERENCES users(id),
    acknowledged_at TIMESTAMP,

    -- Auto-resolve
    auto_resolve BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_alert_severity CHECK (severity IN ('info', 'warning', 'critical'))
);

CREATE INDEX idx_alerts_active ON system_alerts(is_active, is_acknowledged);
CREATE INDEX idx_alerts_type ON system_alerts(alert_type);
CREATE INDEX idx_alerts_severity ON system_alerts(severity);
```

---

## 11. DOCUMENTS & ATTACHMENTS

#### documents
```sql
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    document_type VARCHAR(50) NOT NULL, -- invoice, receipt, po, grn, contract, etc.

    -- Reference
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,

    -- File details
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT, -- In bytes
    mime_type VARCHAR(100),
    file_hash VARCHAR(64), -- SHA-256 for integrity

    -- Metadata
    title VARCHAR(255),
    description TEXT,
    uploaded_by BIGINT NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Versioning
    version INT DEFAULT 1,
    is_latest_version BOOLEAN DEFAULT TRUE,

    deleted_at TIMESTAMP
);

CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
```

---

## Database Relationships Summary

### Foreign Key Cascade Rules

**ON DELETE CASCADE**:
- `role_permissions` → `roles`
- `user_roles` → `users`, `roles`
- `purchase_order_items` → `purchase_orders`
- `sales_order_items` → `sales_orders`
- `payment_splits` → `payments`
- `approval_workflow_steps` → `approval_workflows`

**ON DELETE RESTRICT** (Default):
- `purchase_orders` → `suppliers`
- `sales_orders` → `customers`
- `inventory_stock` → `products`, `warehouses`
- `payments` → Users who created them
- All audit trail references

**ON DELETE SET NULL**:
- Optional references like `approved_by`, `updated_by`

---

## Indexing Strategy

### Primary Indexes (Created)
1. **Unique constraints**: All business keys (SKU, order numbers, etc.)
2. **Foreign keys**: All relationship columns
3. **Status columns**: For filtering active/completed records
4. **Date columns**: For date range queries
5. **Audit queries**: timestamp, user_id, entity_type

### Composite Indexes Needed
```sql
-- Orders by customer and status
CREATE INDEX idx_orders_customer_status ON sales_orders(customer_id, status) WHERE deleted_at IS NULL;

-- Inventory by warehouse and product
CREATE INDEX idx_inventory_warehouse_product ON inventory_stock(warehouse_id, product_id);

-- Payments by date and method
CREATE INDEX idx_payments_date_method ON payments(payment_date, payment_method);

-- Audit trail by date and action
CREATE INDEX idx_audit_date_action ON audit_logs(timestamp DESC, action);
```

---

## Data Integrity Constraints

### Check Constraints
- Status field enums enforced
- Amount fields must be >= 0
- Quantity fields validation
- Date logical ordering (order_date <= delivery_date)

### Separation of Duty Constraints
```sql
-- Creator cannot be approver
CONSTRAINT chk_creator_approver CHECK (created_by != approved_by OR approved_by IS NULL)

-- Receiver cannot approve own GRN
CONSTRAINT chk_receiver_approver CHECK (received_by != approved_by OR approved_by IS NULL)
```

### Computed Columns
```sql
-- Available quantity = quantity - reserved
available_quantity DECIMAL(15, 3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED

-- Balance due = total - paid
balance_due DECIMAL(15, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED
```

---

## Performance Optimizations

### Partitioning Strategy (Future)
```sql
-- Partition audit_logs by month
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Partition transaction_ledger by year
CREATE TABLE transaction_ledger_2026 PARTITION OF transaction_ledger
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

### Materialized Views for Reporting
```sql
-- Product sales summary
CREATE MATERIALIZED VIEW mv_product_sales_summary AS
SELECT
    p.id, p.name, p.sku,
    COUNT(soi.id) as total_orders,
    SUM(soi.quantity) as total_quantity_sold,
    SUM(soi.total_amount) as total_revenue,
    MAX(so.order_date) as last_sale_date
FROM products p
LEFT JOIN sales_order_items soi ON p.id = soi.product_id
LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
WHERE so.status = 'completed'
GROUP BY p.id, p.name, p.sku;

-- Refresh daily via cron job
REFRESH MATERIALIZED VIEW mv_product_sales_summary;
```

---

**Total Tables**: 40+
**Estimated Database Size**: 10-50 GB (first year, depending on transaction volume)
**Backup Strategy**: Daily full backup, hourly incremental, 7-year retention for audit tables
**Document Version**: 1.0
