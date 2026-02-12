# RBAC System Design - Role-Based Access Control

## Overview
This is a **permission-based RBAC system**, not a simple role-based system. Permissions are granted at the **action level**, not just CRUD operations.

**Key Principle**: Separation of Duties - Creator ≠ Approver ≠ Executor

---

## System Roles

### 1. Super Admin
**Purpose**: System administration and configuration
**Access Level**: Full system access (use sparingly)
**Restrictions**: Cannot bypass audit trail

**Capabilities**:
- Manage all users and roles
- Configure system settings
- Access all modules
- View all audit logs
- Emergency overrides (logged)

**Cannot Do**:
- Delete audit logs
- Bypass approval workflows in production

---

### 2. Admin
**Purpose**: Business administration
**Access Level**: High-level operational access
**Restrictions**: Cannot modify system configuration

**Capabilities**:
- Manage users (except Super Admin)
- Configure business rules
- Approve high-value transactions
- Access financial reports
- Manage suppliers and customers

**Cannot Do**:
- Modify system roles and permissions
- Access system logs
- Override audit trails

---

### 3. Inventory Manager
**Purpose**: Inventory control and warehouse operations
**Access Level**: Full inventory management
**Restrictions**: Cannot approve own stock adjustments

**Capabilities**:
- Create stock adjustments
- Transfer inventory between warehouses
- Set minimum stock levels
- Receive goods (GRN)
- View inventory reports
- Manage product catalog

**Cannot Do**:
- Approve own adjustments
- Delete inventory records
- Modify financial data
- Access payment information

---

### 4. Accountant
**Purpose**: Financial management and reconciliation
**Access Level**: Financial data access
**Restrictions**: Read-only for operational data

**Capabilities**:
- View all financial transactions
- Reconcile payments
- Generate financial reports
- Manage chart of accounts
- Export accounting data
- Review payment records

**Cannot Do**:
- Create sales orders
- Modify inventory
- Approve purchase orders
- Process refunds without approval

---

### 5. Cashier (POS)
**Purpose**: Point of sale operations
**Access Level**: Restricted to POS terminal
**Restrictions**: Cannot modify prices or approve refunds

**Capabilities**:
- Create POS sales
- Accept payments (cash, card, transfer)
- Print receipts
- View product prices
- Process returns (with approval)

**Cannot Do**:
- Modify product prices
- Apply discounts (without permission)
- Approve refunds
- View financial reports
- Access inventory management
- Edit completed transactions

---

### 6. Sales Officer
**Purpose**: Sales order management
**Access Level**: Sales operations
**Restrictions**: Cannot approve own orders above threshold

**Capabilities**:
- Create sales orders
- Manage customer accounts
- Generate quotations
- Track order status
- Issue invoices
- Apply approved discounts

**Cannot Do**:
- Approve high-value orders
- Modify payment terms without approval
- Access inventory adjustments
- View full financial reports

---

### 7. Approver
**Purpose**: Transaction approval and authorization
**Access Level**: Review and approval rights
**Restrictions**: Cannot create what they approve

**Capabilities**:
- Approve purchase orders
- Approve stock adjustments
- Approve refunds
- Review pending transactions
- Reject with reason
- Delegate approval (temporary)

**Cannot Do**:
- Approve own created transactions
- Modify approved transactions
- Delete transactions
- Bypass approval workflows

---

### 8. Auditor (Read-Only)
**Purpose**: Compliance and audit review
**Access Level**: System-wide read access
**Restrictions**: Zero write permissions

**Capabilities**:
- View all transactions
- Access audit trails
- Generate compliance reports
- Export audit data
- Review user activities
- Analyze system logs

**Cannot Do**:
- Any CREATE, UPDATE, DELETE operations
- Approve or reject transactions
- Modify any data
- Access user credentials

---

### 9. External Vendor (Restricted)
**Purpose**: Supplier portal access
**Access Level**: Own data only
**Restrictions**: Limited to own purchase orders

**Capabilities**:
- View own purchase orders
- Update delivery status
- Upload invoices
- View payment status
- Update company profile

**Cannot Do**:
- View other suppliers' data
- Access customer information
- View system pricing
- Access inventory data

---

## Permission Structure

### Permission Naming Convention
```
{module}.{entity}.{action}.{scope}

Examples:
- inventory.products.create
- inventory.products.update.own
- inventory.products.approve
- orders.sales.view.all
- orders.sales.view.own
- payments.refund.approve
- users.roles.assign
```

### Permission Scopes
- **all**: Access all records
- **own**: Access only own created records
- **team**: Access team/department records
- **approved**: Access only approved records

---

## Comprehensive Permission Matrix

| Permission | Super Admin | Admin | Inventory Mgr | Accountant | Cashier | Sales Officer | Approver | Auditor | Vendor |
|------------|:-----------:|:-----:|:-------------:|:----------:|:-------:|:-------------:|:--------:|:-------:|:------:|
| **USER MANAGEMENT** |
| users.view.all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| users.create | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| users.update | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| users.delete | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| users.assign_role | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| roles.manage | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| permissions.manage | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **INVENTORY** |
| inventory.products.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| inventory.products.create | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| inventory.products.update | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| inventory.stock.adjust | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| inventory.stock.approve | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| inventory.transfer.create | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| inventory.transfer.approve | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| inventory.batch.track | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| **PURCHASE ORDERS** |
| purchases.po.view.all | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ |
| purchases.po.view.own | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| purchases.po.create | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| purchases.po.update | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| purchases.po.approve | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| purchases.grn.create | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| purchases.grn.approve | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| **SALES ORDERS** |
| sales.orders.view.all | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ |
| sales.orders.view.own | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| sales.orders.create | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| sales.orders.update | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| sales.orders.approve | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| sales.orders.cancel | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| sales.orders.complete | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |
| sales.discount.apply | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| sales.discount.approve | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| **POS** |
| pos.sales.create | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| pos.payment.accept | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| pos.receipt.print | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| pos.refund.request | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| pos.refund.approve | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| pos.price.override | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| **PAYMENTS** |
| payments.view.all | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ |
| payments.view.own | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| payments.record | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| payments.reconcile | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| payments.refund.create | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| payments.refund.approve | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| **ACCOUNTING** |
| accounting.reports.view | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ |
| accounting.export | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ |
| accounting.reconcile | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **AUDIT** |
| audit.logs.view | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| audit.logs.export | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| audit.reports.generate | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ |
| **SUPPLIERS** |
| suppliers.view.all | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ |
| suppliers.create | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| suppliers.update | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **CUSTOMERS** |
| customers.view.all | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ |
| customers.create | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| customers.update | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| customers.credit.manage | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |

---

## Separation of Duties Rules

### Rule 1: Creator Cannot Approve
```php
// Example enforcement
if ($transaction->created_by === $currentUser->id) {
    throw new UnauthorizedException('Cannot approve own transaction');
}
```

### Rule 2: Amount-Based Escalation
```php
// Example thresholds
if ($purchaseOrder->total_amount > 1000000) { // 1M threshold
    $requiredApprovals = 2; // Requires Admin + Approver
} elseif ($purchaseOrder->total_amount > 500000) {
    $requiredApprovals = 1; // Requires Approver
}
```

### Rule 3: Financial Segregation
- Cashier can record payments but cannot reconcile
- Accountant can reconcile but cannot approve refunds
- Sales Officer can create orders but cannot approve discounts > 10%

### Rule 4: Inventory Segregation
- Inventory Manager can adjust stock but cannot approve
- Approver can approve but cannot create adjustments
- GRN creator cannot be PO approver

---

## Permission Checking Implementation

### Middleware Level
```php
// routes/api.php
Route::middleware(['auth:sanctum', 'permission:purchases.po.approve'])
    ->post('/purchase-orders/{id}/approve', [POController::class, 'approve']);
```

### Controller Level
```php
public function approve(Request $request, $id)
{
    $this->authorize('approve', PurchaseOrder::find($id));

    // Business logic
}
```

### Policy Level
```php
// app/Policies/PurchaseOrderPolicy.php
public function approve(User $user, PurchaseOrder $po)
{
    // Cannot approve own PO
    if ($po->created_by === $user->id) {
        return false;
    }

    // Must have approval permission
    if (!$user->hasPermission('purchases.po.approve')) {
        return false;
    }

    // Amount-based approval level check
    if ($po->total_amount > 1000000 && !$user->hasRole('Admin')) {
        return false;
    }

    return true;
}
```

---

## Role Assignment Rules

### Assignment Restrictions
1. Only Super Admin can assign Super Admin role
2. Admin can assign all roles except Super Admin
3. Users cannot change their own role
4. Role changes are audited
5. Downgrading roles requires approval

### Multi-Role Support
- Users can have multiple roles (e.g., Sales Officer + Cashier)
- Permissions are cumulative (union of all role permissions)
- Restrictions are intersected (most restrictive wins)

---

## Access Control Matrix Example

### Scenario: Purchase Order Approval

| Step | Actor | Permission Required | Separation Check |
|------|-------|---------------------|------------------|
| 1. Create PO | Inventory Manager | purchases.po.create | ✓ |
| 2. Submit for approval | Inventory Manager | purchases.po.submit | ✓ |
| 3. Review PO | Approver | purchases.po.view.all | ✓ |
| 4. Approve PO | Approver | purchases.po.approve | Must ≠ Creator |
| 5. Receive goods (GRN) | Inventory Manager | purchases.grn.create | Must ≠ PO Approver |
| 6. Approve GRN | Different Approver | purchases.grn.approve | Must ≠ GRN Creator |
| 7. Update inventory | System (automated) | - | Audit logged |

---

## Emergency Access Protocol

### Break-Glass Access
For emergency situations (system down, urgent business need):

1. **Request Emergency Access**
   - User submits break-glass request
   - Reason mandatory
   - Time-limited (e.g., 2 hours)

2. **Approval Required**
   - Super Admin must approve
   - Second factor authentication required
   - All actions under emergency access flagged

3. **Audit Trail**
   - Emergency access logged separately
   - Actions during emergency access highlighted
   - Post-incident review required

4. **Auto-Revocation**
   - Access auto-expires after time limit
   - Cannot be extended without new request
   - Notification sent to compliance team

---

## API Permission Response Format

### Success Response
```json
{
  "allowed": true,
  "user_id": 123,
  "permissions": ["purchases.po.approve", "purchases.po.view.all"],
  "restrictions": []
}
```

### Denial Response
```json
{
  "allowed": false,
  "reason": "Insufficient permissions",
  "required_permission": "purchases.po.approve",
  "user_permissions": ["purchases.po.create", "purchases.po.view.own"],
  "suggestion": "Contact your administrator to request approval rights"
}
```

### Separation of Duty Violation
```json
{
  "allowed": false,
  "reason": "Separation of duty violation",
  "details": "Cannot approve transaction created by yourself",
  "policy": "SOD_CREATOR_APPROVER",
  "alternative": "Request approval from another authorized user"
}
```

---

**Document Version**: 1.0
**Compliance Level**: Enterprise Grade
**Last Updated**: 2026-01-31
