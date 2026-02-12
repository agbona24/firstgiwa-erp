# Database Schema - PostgreSQL Design

## Overview
Enterprise-grade database design with:
- **Referential Integrity**: Foreign keys with appropriate cascade rules
- **Audit Trail**: Temporal tracking on all critical tables
- **Soft Deletes**: No hard deletes on transactional data
- **Indexing Strategy**: Performance-optimized queries
- **Data Types**: Appropriate precision for financial data

---

## Schema Naming Conventions
- Tables: `snake_case`, plural (e.g., `purchase_orders`)
- Columns: `snake_case` (e.g., `total_amount`)
- Foreign keys: `{table}_id` (e.g., `user_id`)
- Indexes: `idx_{table}_{columns}` (e.g., `idx_products_sku`)
- Unique constraints: `uq_{table}_{columns}`

---

## Core Tables

### 1. USERS & AUTHENTICATION

#### users
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive, suspended
    last_login_at TIMESTAMP,
    last_login_ip INET,
    password_changed_at TIMESTAMP,
    force_password_change BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT chk_user_status CHECK (status IN ('active', 'inactive', 'suspended'))
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
```

#### roles
```sql
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE, -- Cannot be deleted
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_name ON roles(name);
```

#### permissions
```sql
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'purchases.po.approve'
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL, -- inventory, purchases, sales, pos, etc.
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_module ON permissions(module);
```

#### role_permissions
```sql
CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
```

#### user_roles
```sql
CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by BIGINT REFERENCES users(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- For temporary role assignments

    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
```

---

### 2. SUPPLIERS & CUSTOMERS

#### suppliers
```sql
CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE, -- e.g., SUP-001
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(50), -- Business registration
    tax_id VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Nigeria',
    postal_code VARCHAR(20),

    -- Financial
    payment_terms INT DEFAULT 30, -- Days
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'NGN',

    -- Contact person
    contact_person_name VARCHAR(150),
    contact_person_phone VARCHAR(20),
    contact_person_email VARCHAR(255),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive, blacklisted
    rating DECIMAL(3, 2), -- 1.00 to 5.00

    -- Metadata
    notes TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT chk_supplier_status CHECK (status IN ('active', 'inactive', 'blacklisted')),
    CONSTRAINT chk_supplier_rating CHECK (rating >= 1.00 AND rating <= 5.00)
);

CREATE INDEX idx_suppliers_code ON suppliers(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_suppliers_status ON suppliers(status) WHERE deleted_at IS NULL;
```

#### customers
```sql
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE, -- e.g., CUST-001
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Nigeria',

    -- Customer type
    customer_type VARCHAR(20) DEFAULT 'retail', -- retail, wholesale, corporate

    -- Financial
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    credit_used DECIMAL(15, 2) DEFAULT 0,
    payment_terms INT DEFAULT 0, -- Days (0 = immediate)

    -- Loyalty
    loyalty_points INT DEFAULT 0,
    total_purchases DECIMAL(15, 2) DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- Metadata
    notes TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT chk_customer_type CHECK (customer_type IN ('retail', 'wholesale', 'corporate')),
    CONSTRAINT chk_customer_status CHECK (status IN ('active', 'inactive', 'suspended'))
);

CREATE INDEX idx_customers_code ON customers(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_phone ON customers(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_status ON customers(status);
```

---

### 3. INVENTORY

#### warehouses
```sql
CREATE TABLE warehouses (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    capacity DECIMAL(15, 2), -- In cubic meters or tons
    manager_id BIGINT REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT chk_warehouse_status CHECK (status IN ('active', 'inactive', 'maintenance'))
);

CREATE INDEX idx_warehouses_code ON warehouses(code) WHERE deleted_at IS NULL;
```

#### categories
```sql
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id BIGINT REFERENCES categories(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_categories_parent ON categories(parent_id) WHERE deleted_at IS NULL;
```

#### units
```sql
CREATE TABLE units (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- kg, bag, ton, liter
    symbol VARCHAR(10) NOT NULL UNIQUE, -- kg, bag, t, L
    type VARCHAR(20) NOT NULL, -- weight, volume, count
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_unit_type CHECK (type IN ('weight', 'volume', 'count'))
);
```

#### products
```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id BIGINT REFERENCES categories(id),

    -- Unit handling
    base_unit_id BIGINT NOT NULL REFERENCES units(id),
    is_batch_tracked BOOLEAN DEFAULT FALSE,
    has_expiry BOOLEAN DEFAULT FALSE,

    -- Pricing
    cost_price DECIMAL(15, 2) DEFAULT 0, -- Average cost
    selling_price DECIMAL(15, 2) NOT NULL,
    minimum_selling_price DECIMAL(15, 2), -- Below this needs approval

    -- Inventory
    reorder_level DECIMAL(15, 2) DEFAULT 0,
    reorder_quantity DECIMAL(15, 2) DEFAULT 0,
    minimum_stock DECIMAL(15, 2) DEFAULT 0,
    maximum_stock DECIMAL(15, 2),

    -- Status
    status VARCHAR(20) DEFAULT 'active',

    -- Metadata
    image_url VARCHAR(500),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT chk_product_status CHECK (status IN ('active', 'inactive', 'discontinued'))
);

CREATE INDEX idx_products_sku ON products(sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_barcode ON products(barcode) WHERE deleted_at IS NULL AND barcode IS NOT NULL;
CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON products(status);
```

#### product_unit_conversions
```sql
CREATE TABLE product_unit_conversions (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    from_unit_id BIGINT NOT NULL REFERENCES units(id),
    to_unit_id BIGINT NOT NULL REFERENCES units(id),
    conversion_factor DECIMAL(10, 4) NOT NULL, -- e.g., 1 bag = 50 kg
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_conversion UNIQUE (product_id, from_unit_id, to_unit_id)
);
```

#### inventory_stock
```sql
CREATE TABLE inventory_stock (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    batch_number VARCHAR(50), -- Nullable for non-batch tracked items

    -- Quantities
    quantity DECIMAL(15, 3) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(15, 3) DEFAULT 0, -- Reserved for pending orders
    available_quantity DECIMAL(15, 3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,

    -- Batch details
    manufacturing_date DATE,
    expiry_date DATE,

    -- Costing
    unit_cost DECIMAL(15, 2),

    -- Metadata
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_warehouse_product_batch UNIQUE (warehouse_id, product_id, batch_number)
);

CREATE INDEX idx_inventory_warehouse ON inventory_stock(warehouse_id);
CREATE INDEX idx_inventory_product ON inventory_stock(product_id);
CREATE INDEX idx_inventory_batch ON inventory_stock(batch_number) WHERE batch_number IS NOT NULL;
CREATE INDEX idx_inventory_expiry ON inventory_stock(expiry_date) WHERE expiry_date IS NOT NULL;
```

#### stock_movements
```sql
CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    batch_number VARCHAR(50),

    -- Movement details
    movement_type VARCHAR(20) NOT NULL, -- in, out, adjustment, transfer
    quantity DECIMAL(15, 3) NOT NULL,
    unit_id BIGINT NOT NULL REFERENCES units(id),

    -- Reference
    reference_type VARCHAR(50), -- purchase_order, sales_order, adjustment, transfer
    reference_id BIGINT,

    -- Before/After for audit
    quantity_before DECIMAL(15, 3) NOT NULL,
    quantity_after DECIMAL(15, 3) NOT NULL,

    -- Metadata
    remarks TEXT,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_movement_type CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer'))
);

CREATE INDEX idx_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_movements_product ON stock_movements(product_id);
CREATE INDEX idx_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_movements_created_at ON stock_movements(created_at);
```

---

### 4. PURCHASE ORDERS

#### purchase_orders
```sql
CREATE TABLE purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),

    -- Dates
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,

    -- Amounts
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    shipping_cost DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,

    -- Status workflow
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    -- draft → pending_approval → approved → partially_received → received → completed → cancelled

    -- Approval tracking
    submitted_at TIMESTAMP,
    submitted_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    approved_by BIGINT REFERENCES users(id),
    rejected_at TIMESTAMP,
    rejected_by BIGINT REFERENCES users(id),
    rejection_reason TEXT,

    -- Metadata
    notes TEXT,
    payment_terms INT, -- Days
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT chk_po_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'partially_received', 'received', 'completed', 'cancelled', 'rejected')),
    CONSTRAINT chk_po_creator_approver CHECK (created_by != approved_by OR approved_by IS NULL)
);

CREATE INDEX idx_po_number ON purchase_orders(po_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_dates ON purchase_orders(order_date, expected_delivery_date);
```

#### purchase_order_items
```sql
CREATE TABLE purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),

    -- Quantity
    quantity DECIMAL(15, 3) NOT NULL,
    unit_id BIGINT NOT NULL REFERENCES units(id),
    received_quantity DECIMAL(15, 3) DEFAULT 0,

    -- Pricing
    unit_price DECIMAL(15, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_percent DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_product ON purchase_order_items(product_id);
```

#### goods_received_notes
```sql
CREATE TABLE goods_received_notes (
    id BIGSERIAL PRIMARY KEY,
    grn_number VARCHAR(50) NOT NULL UNIQUE,
    purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id),
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),

    -- Receipt details
    received_date DATE NOT NULL,
    invoice_number VARCHAR(100),
    delivery_note_number VARCHAR(100),

    -- Status
    status VARCHAR(20) DEFAULT 'draft',
    -- draft → pending_approval → approved → rejected

    -- Approval
    approved_at TIMESTAMP,
    approved_by BIGINT REFERENCES users(id),

    -- Metadata
    remarks TEXT,
    received_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_grn_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
    CONSTRAINT chk_grn_receiver_approver CHECK (received_by != approved_by OR approved_by IS NULL)
);

CREATE INDEX idx_grn_number ON goods_received_notes(grn_number);
CREATE INDEX idx_grn_po ON goods_received_notes(purchase_order_id);
```

#### goods_received_note_items
```sql
CREATE TABLE goods_received_note_items (
    id BIGSERIAL PRIMARY KEY,
    grn_id BIGINT NOT NULL REFERENCES goods_received_notes(id) ON DELETE CASCADE,
    po_item_id BIGINT NOT NULL REFERENCES purchase_order_items(id),
    product_id BIGINT NOT NULL REFERENCES products(id),

    -- Received quantity
    ordered_quantity DECIMAL(15, 3) NOT NULL,
    received_quantity DECIMAL(15, 3) NOT NULL,
    unit_id BIGINT NOT NULL REFERENCES units(id),

    -- Batch tracking
    batch_number VARCHAR(50),
    manufacturing_date DATE,
    expiry_date DATE,

    -- Quality
    damaged_quantity DECIMAL(15, 3) DEFAULT 0,
    accepted_quantity DECIMAL(15, 3) NOT NULL,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grn_items_grn ON goods_received_note_items(grn_id);
CREATE INDEX idx_grn_items_product ON goods_received_note_items(product_id);
```

---

### 5. SALES ORDERS

#### sales_orders
```sql
CREATE TABLE sales_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),

    -- Order type
    order_type VARCHAR(20) DEFAULT 'regular', -- regular, pos, wholesale

    -- Dates
    order_date DATE NOT NULL,
    delivery_date DATE,

    -- Amounts
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    shipping_cost DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(15, 2) DEFAULT 0,
    balance_due DECIMAL(15, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,

    -- Status workflow
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    -- draft → pending_payment → partially_paid → paid → processing → completed → cancelled
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    -- unpaid → partially_paid → paid → refunded
    fulfillment_status VARCHAR(20) DEFAULT 'unfulfilled',
    -- unfulfilled → processing → partially_fulfilled → fulfilled

    -- Approval (for high-value or discount orders)
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP,
    approved_by BIGINT REFERENCES users(id),

    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT chk_order_type CHECK (order_type IN ('regular', 'pos', 'wholesale')),
    CONSTRAINT chk_order_status CHECK (status IN ('draft', 'pending_payment', 'partially_paid', 'paid', 'processing', 'completed', 'cancelled')),
    CONSTRAINT chk_payment_status CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'refunded')),
    CONSTRAINT chk_fulfillment_status CHECK (fulfillment_status IN ('unfulfilled', 'processing', 'partially_fulfilled', 'fulfilled'))
);

CREATE INDEX idx_orders_number ON sales_orders(order_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_customer ON sales_orders(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_status ON sales_orders(status);
CREATE INDEX idx_orders_payment_status ON sales_orders(payment_status);
CREATE INDEX idx_orders_dates ON sales_orders(order_date, delivery_date);
CREATE INDEX idx_orders_created_by ON sales_orders(created_by);
```

#### sales_order_items
```sql
CREATE TABLE sales_order_items (
    id BIGSERIAL PRIMARY KEY,
    sales_order_id BIGINT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),

    -- Quantity
    quantity DECIMAL(15, 3) NOT NULL,
    unit_id BIGINT NOT NULL REFERENCES units(id),
    fulfilled_quantity DECIMAL(15, 3) DEFAULT 0,

    -- Pricing
    unit_price DECIMAL(15, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_percent DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,

    -- Batch tracking
    batch_number VARCHAR(50),

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON sales_order_items(sales_order_id);
CREATE INDEX idx_order_items_product ON sales_order_items(product_id);
```

---

**CONTINUED IN NEXT FILE (Part 2)**
