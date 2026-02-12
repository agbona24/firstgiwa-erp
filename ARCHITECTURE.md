# FIRSTGIWA ERP - Enterprise Architecture
**Agro Products Trading Company - Core Business System**

## Executive Summary

This is an **enterprise-grade, audit-ready ERP system** designed for regulated agro-trading operations with strict compliance requirements, separation of duties, and complete audit trails.

### Technology Stack
- **Backend**: Laravel 11+ (PHP 8.2+)
- **Frontend**: React 18+ with Vite
- **Database**: PostgreSQL 15+
- **API**: RESTful API-first architecture
- **Auth**: Laravel Sanctum (SPA) + Permission-based RBAC
- **UI Framework**: TailwindCSS with premium Deep Blue & Gold theme

### Design Principles
1. **Audit-First**: Every critical action logged immutably
2. **Zero Trust**: Permission-based access at action level
3. **Separation of Duties**: Creator ≠ Approver ≠ Executor
4. **Data Integrity**: No hard deletes, reversal-based corrections
5. **Approval Workflows**: Multi-level approval for financial transactions
6. **Scalability**: Modular, cloud-ready, horizontally scalable
7. **Compliance Ready**: Export-ready for customs, tax, and regulatory audits

---

## System Modules Overview

### Core Modules
1. **User Management & RBAC** - Identity, roles, permissions, access control
2. **Inventory Management** - Stock tracking, batch management, warehouse operations
3. **Purchase Orders** - Supplier management, procurement, goods receipt
4. **Sales Orders** - Customer management, order lifecycle, invoicing
5. **POS (Point of Sale)** - Fast cashier interface, restricted permissions
6. **Payments** - Multi-method payments, reconciliation, mixed payments
7. **Accounting Readiness** - Transaction ledger, financial summaries, export
8. **Audit Trail** - Global immutable log of all system changes

### Supporting Modules
- **Supplier Management** - Vendor registration, credit terms, performance tracking
- **Customer Management** - Customer profiles, credit limits, purchase history
- **Warehouse Management** - Multi-location inventory, transfers, adjustments
- **Reporting & Analytics** - Business intelligence, compliance reports, dashboards
- **Document Management** - Invoice storage, PO documents, compliance docs

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React SPA  │  │  POS Client  │  │ Mobile App   │          │
│  │  (Main ERP)  │  │  (Cashier)   │  │  (Future)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/JSON API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│         Laravel Routes → Middleware → Controllers                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth Guard   │  │ Rate Limiter │  │ API Versioning│         │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │   User     │ │ Inventory  │ │  Orders    │ │   Payments   │ │
│  │  Service   │ │  Service   │ │  Service   │ │   Service    │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │  Approval  │ │   Audit    │ │ Accounting │ │  Reporting   │ │
│  │  Service   │ │  Service   │ │  Service   │ │   Service    │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                           │
│     Eloquent ORM → Query Builder → Database Abstraction          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Repository Pattern (Optional)                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (PostgreSQL)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Transactional│  │  Audit Store │  │ Document Store│         │
│  │     DB       │  │ (Immutable)  │  │   (Files)     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Queue/Jobs   │  │   Cache      │  │  File Storage│          │
│  │  (Redis)     │  │  (Redis)     │  │   (S3/Local) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Authentication Flow
```
User Login → Credentials Verification → Session/Token Generation
    ↓
Role Loading → Permissions Loading → Access Matrix Caching
    ↓
Every Request → Permission Check → Audit Log → Execute/Deny
```

### Security Layers
1. **Network Security**: HTTPS only, CORS configuration
2. **Authentication**: Sanctum tokens, session management
3. **Authorization**: Permission-based RBAC (not role-based)
4. **Input Validation**: Request validation, SQL injection prevention
5. **Output Encoding**: XSS prevention, CSP headers
6. **Audit Logging**: All critical actions logged with context
7. **Data Encryption**: Sensitive fields encrypted at rest

---

## Data Flow Architecture

### Purchase Flow
```
Supplier → PO Creation → Approval → Goods Receipt → Inventory Update
                ↓            ↓            ↓              ↓
            Audit Log    Audit Log    Audit Log    Audit Log
```

### Sales Flow
```
Customer → Order Creation → Payment → Fulfillment → Inventory Deduction
                ↓            ↓           ↓              ↓
            Audit Log    Audit Log   Audit Log    Audit Log
```

### POS Flow
```
Cashier → Product Selection → Payment → Receipt → Inventory Deduction
              ↓                  ↓         ↓            ↓
          Audit Log          Audit Log  Audit Log  Audit Log
```

---

## Approval Workflow Engine

### Generic Approval Pattern
```
Creator creates transaction → Status: DRAFT
    ↓
Submit for approval → Status: PENDING_APPROVAL
    ↓
Approver 1 reviews → Status: LEVEL_1_APPROVED
    ↓
Approver 2 reviews (if required) → Status: LEVEL_2_APPROVED
    ↓
Final Approval → Status: APPROVED → Execute transaction
    ↓
Audit trail records: Creator ≠ Approver (enforced)
```

### Approval Rules
- **Separation of Duties**: Creator cannot approve own transaction
- **Multi-Level Approval**: Amount-based threshold triggers additional approval
- **Approval Delegation**: Temporary delegation with audit trail
- **Rejection Handling**: Rejected transactions return to DRAFT with reason
- **Timeout Handling**: Auto-escalation after configured timeout

---

## Audit & Compliance Architecture

### Audit Trail Requirements
Every critical action must log:
- **Who**: User ID + Username
- **What**: Action performed (CREATE, UPDATE, DELETE, APPROVE, REJECT)
- **When**: Timestamp (UTC + local timezone)
- **Where**: IP address, device fingerprint
- **Why**: Reason for change (mandatory for certain operations)
- **Old → New**: Before/after values (JSON diff)
- **Context**: Related entity IDs (order_id, inventory_id, etc.)

### Immutable Audit Log
- Append-only database table
- No UPDATE or DELETE operations allowed
- Cryptographic hash chain (optional for maximum security)
- Daily backup to cold storage
- 7-year retention policy (configurable)

### Compliance Reports
- User access reports
- Transaction history reports
- Inventory movement reports
- Financial reconciliation reports
- Approval workflow reports
- Exception reports (failed approvals, voided transactions)

---

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers (scale via load balancer)
- Separate POS instances (can run offline, sync later)
- Database read replicas for reporting
- Queue workers for background jobs

### Performance Optimization
- Redis caching for permissions, product catalog
- Database indexing strategy
- Lazy loading for large datasets
- Pagination for all list endpoints
- Background jobs for heavy operations (reports, exports)

### Data Partitioning
- Archive old transactions (yearly partitioning)
- Separate audit database (optional)
- Document storage on object store (S3-compatible)

---

## Next Steps

Detailed documentation for each module:
1. [RBAC System Design](RBAC.md)
2. [Database Schema](DATABASE_SCHEMA.md)
3. [Inventory Management](INVENTORY.md)
4. [Purchase Order System](PURCHASE_ORDERS.md)
5. [Sales Order System](SALES_ORDERS.md)
6. [POS System](POS_SYSTEM.md)
7. [Payments Module](PAYMENTS.md)
8. [Audit Trail System](AUDIT_TRAIL.md)
9. [Accounting Readiness](ACCOUNTING.md)
10. [UI Design System](UI_DESIGN_SYSTEM.md)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-31
**Status**: Architecture Design Phase
**Next Phase**: Database Schema Implementation
