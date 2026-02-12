# Audit Trail System

## Overview
Enterprise-grade immutable audit logging system for:
- Complete user activity tracking
- Data change history (before/after)
- Compliance and regulatory requirements
- Forensic analysis capability
- Non-repudiation (users cannot deny actions)
- 7-year retention for compliance

**Critical Principle**: Audit logs are APPEND-ONLY. No updates or deletes allowed.

---

## What Gets Audited

### Critical Actions (MUST Audit)

1. **User & Security**
   - Login/Logout
   - Failed login attempts
   - Password changes
   - Role assignments
   - Permission changes
   - Session terminations

2. **Financial Transactions**
   - Payment creation/confirmation
   - Refund requests/approvals
   - Invoice generation
   - Price changes
   - Discount applications

3. **Inventory**
   - Stock adjustments
   - Inventory transfers
   - GRN approvals
   - Stock movements (all)
   - Batch creation

4. **Orders**
   - PO creation/approval/cancellation
   - Sales order creation/completion
   - Order modifications
   - POS sales

5. **Master Data**
   - Product creation/modification
   - Supplier creation/modification
   - Customer creation/modification
   - Warehouse creation
   - Category changes

6. **Approvals**
   - All approval actions
   - Rejection with reasons
   - Approval delegation
   - Emergency overrides

7. **System Configuration**
   - Settings changes
   - System configuration updates
   - User permission changes

### Non-Critical Actions (Optional Audit)

- Read operations (view lists, reports)
- Dashboard access
- Search queries
- Report generation

---

## Audit Log Structure

### Complete Audit Record

```typescript
interface AuditLog {
  id: number                      // Sequential ID
  audit_uuid: string              // UUID for uniqueness

  // WHO
  user_id: number                 // User who performed action
  username: string                // Username (denormalized)
  user_role: string               // Primary role at time of action
  user_email: string              // Email (denormalized)

  // WHAT
  action: AuditAction             // CREATE, UPDATE, DELETE, etc.
  entity_type: string             // Table/model name
  entity_id: number | null        // Record ID
  entity_display: string          // Human-readable entity (e.g., "PO-2026-001")

  // WHEN
  timestamp: timestamp            // UTC timestamp
  timezone: string                // User's timezone

  // WHERE
  ip_address: string              // Client IP
  user_agent: string              // Browser/device info
  device_fingerprint: string      // Unique device ID

  // WHY
  reason: string | null           // User-provided reason (mandatory for critical actions)
  business_context: string | null // Additional context

  // CHANGES
  old_values: JSONB               // Before state
  new_values: JSONB               // After state
  changed_fields: string[]        // Array of changed field names

  // CONTEXT
  request_id: string              // For tracing related actions
  session_id: string              // User session
  parent_audit_id: number | null  // For related actions
  transaction_id: string | null   // Database transaction ID

  // METADATA
  additional_data: JSONB          // Extra context
  severity: 'low' | 'medium' | 'high' | 'critical'

  // INTEGRITY
  checksum: string                // SHA-256 hash for tamper detection
}

type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'APPROVE'
  | 'REJECT'
  | 'SUBMIT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PERMISSION_DENIED'
  | 'EXPORT'
  | 'IMPORT'
  | 'OVERRIDE'
  | 'RECONCILE'
```

---

## Audit Logging Implementation

### Laravel Middleware Approach

```php
// app/Http/Middleware/AuditLogger.php
class AuditLogger
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);

        // Only audit state-changing operations
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $this->logAudit($request, $response);
        }

        return $response;
    }

    private function logAudit($request, $response)
    {
        $user = $request->user();

        AuditLog::create([
            'audit_uuid' => Str::uuid(),
            'user_id' => $user->id,
            'username' => $user->username,
            'user_role' => $user->getPrimaryRole(),
            'user_email' => $user->email,

            'action' => $this->mapMethodToAction($request->method()),
            'entity_type' => $this->extractEntityType($request),
            'entity_id' => $this->extractEntityId($request),

            'timestamp' => now(),
            'timezone' => $user->timezone ?? 'UTC',

            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_fingerprint' => $request->header('X-Device-Fingerprint'),

            'request_id' => $request->header('X-Request-ID') ?? Str::uuid(),
            'session_id' => $request->session()->getId(),

            'additional_data' => [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'status_code' => $response->status()
            ],

            'severity' => $this->determineSeverity($request),
        ]);
    }
}
```

### Model Observer Approach (More Granular)

```php
// app/Observers/SalesOrderObserver.php
class SalesOrderObserver
{
    public function created(SalesOrder $order)
    {
        AuditService::log([
            'action' => 'CREATE',
            'entity_type' => 'sales_order',
            'entity_id' => $order->id,
            'entity_display' => $order->order_number,
            'new_values' => $order->toArray(),
            'severity' => 'medium'
        ]);
    }

    public function updating(SalesOrder $order)
    {
        // Capture old values before update
        $this->oldValues = $order->getOriginal();
    }

    public function updated(SalesOrder $order)
    {
        $changedFields = array_keys($order->getChanges());

        AuditService::log([
            'action' => 'UPDATE',
            'entity_type' => 'sales_order',
            'entity_id' => $order->id,
            'entity_display' => $order->order_number,
            'old_values' => array_intersect_key($this->oldValues, array_flip($changedFields)),
            'new_values' => $order->only($changedFields),
            'changed_fields' => $changedFields,
            'severity' => $this->isFinancialChange($changedFields) ? 'high' : 'medium'
        ]);
    }

    public function deleted(SalesOrder $order)
    {
        AuditService::log([
            'action' => 'DELETE',
            'entity_type' => 'sales_order',
            'entity_id' => $order->id,
            'entity_display' => $order->order_number,
            'old_values' => $order->toArray(),
            'severity' => 'critical',
            'reason' => request()->input('deletion_reason') // Mandatory for deletes
        ]);
    }

    private function isFinancialChange(array $fields): bool
    {
        $financialFields = ['total_amount', 'amount_paid', 'discount_amount', 'payment_status'];
        return count(array_intersect($fields, $financialFields)) > 0;
    }
}
```

### Audit Service

```typescript
// TypeScript/JavaScript version for frontend audit logging
class AuditService {
  static async log(data: AuditData): Promise<void> {
    const auditRecord = {
      audit_uuid: uuidv4(),
      user_id: getCurrentUser().id,
      username: getCurrentUser().username,
      user_role: getCurrentUser().primary_role,
      user_email: getCurrentUser().email,

      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      entity_display: data.entity_display,

      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

      ip_address: await getClientIP(),
      user_agent: navigator.userAgent,
      device_fingerprint: getDeviceFingerprint(),

      reason: data.reason,
      old_values: data.old_values,
      new_values: data.new_values,
      changed_fields: data.changed_fields,

      request_id: getRequestId(),
      session_id: getSessionId(),

      additional_data: data.additional_data,
      severity: data.severity || 'medium',

      checksum: await this.generateChecksum(data)
    }

    // Send to backend
    await api.post('/api/audit-logs', auditRecord)

    // Also store in IndexedDB for offline resilience
    await localDB.auditLogs.add(auditRecord)
  }

  private static async generateChecksum(data: any): Promise<string> {
    const payload = JSON.stringify(data)
    const msgBuffer = new TextEncoder().encode(payload)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}
```

---

## Mandatory Reason Fields

### Actions Requiring Reason

```typescript
const ACTIONS_REQUIRING_REASON = [
  'DELETE',
  'OVERRIDE',
  'EMERGENCY_ACCESS',
  'VOID_TRANSACTION',
  'PRICE_OVERRIDE',
  'DISCOUNT_OVERRIDE',
  'STOCK_ADJUSTMENT',
  'REJECT_APPROVAL'
]

// Validation middleware
async function validateAuditReason(action: string, reason: string | null) {
  if (ACTIONS_REQUIRING_REASON.includes(action) && !reason) {
    throw new ValidationError('Reason is mandatory for this action')
  }

  if (reason && reason.length < 10) {
    throw new ValidationError('Reason must be at least 10 characters')
  }
}

// UI enforcement
function showReasonPrompt(action: string): Promise<string> {
  return new Promise((resolve, reject) => {
    Modal.show({
      title: `Reason for ${action}`,
      message: 'Please provide a detailed reason for this action:',
      input: {
        type: 'textarea',
        placeholder: 'Enter reason (minimum 10 characters)...',
        required: true,
        minLength: 10
      },
      buttons: [
        {
          label: 'Cancel',
          onClick: () => reject(new Error('Action cancelled'))
        },
        {
          label: 'Proceed',
          onClick: (reason) => resolve(reason)
        }
      ]
    })
  })
}
```

---

## Audit Search & Reporting

### Search Capabilities

```sql
-- Find all actions by a user
SELECT * FROM audit_logs
WHERE user_id = :user_id
ORDER BY timestamp DESC
LIMIT 100;

-- Find all changes to a specific entity
SELECT * FROM audit_logs
WHERE entity_type = 'purchase_order'
  AND entity_id = :po_id
ORDER BY timestamp ASC;

-- Find all failed login attempts
SELECT * FROM audit_logs
WHERE action = 'LOGIN_FAILED'
  AND timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Find all approvals in date range
SELECT
  al.timestamp,
  al.username,
  al.entity_type,
  al.entity_display,
  al.old_values->'status' as old_status,
  al.new_values->'status' as new_status
FROM audit_logs al
WHERE al.action = 'APPROVE'
  AND al.timestamp BETWEEN :start_date AND :end_date
ORDER BY al.timestamp DESC;

-- Find all price changes
SELECT * FROM audit_logs
WHERE entity_type = 'product'
  AND 'selling_price' = ANY(changed_fields)
ORDER BY timestamp DESC;

-- Detect SOD violations (creator approving own transaction)
SELECT
  al_create.entity_id,
  al_create.username as creator,
  al_approve.username as approver,
  al_approve.timestamp as approval_time
FROM audit_logs al_create
JOIN audit_logs al_approve
  ON al_create.entity_type = al_approve.entity_type
  AND al_create.entity_id = al_approve.entity_id
WHERE al_create.action = 'CREATE'
  AND al_approve.action = 'APPROVE'
  AND al_create.user_id = al_approve.user_id;  -- SOD violation!

-- Find suspicious activity (multiple failed logins)
SELECT
  user_id,
  username,
  ip_address,
  COUNT(*) as failed_attempts
FROM audit_logs
WHERE action = 'LOGIN_FAILED'
  AND timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY user_id, username, ip_address
HAVING COUNT(*) >= 5;
```

---

## Audit Reports

### 1. User Activity Report
```typescript
interface UserActivityReport {
  user_id: number
  username: string
  period: DateRange
  total_actions: number
  actions_by_type: Map<AuditAction, number>
  high_severity_actions: number
  most_active_hours: number[]
  ip_addresses: string[]
  devices: string[]
}
```

### 2. Entity Change History
```typescript
interface EntityHistory {
  entity_type: string
  entity_id: number
  entity_display: string
  timeline: ChangeEvent[]
}

interface ChangeEvent {
  timestamp: Date
  action: AuditAction
  user: string
  changes: FieldChange[]
  reason: string | null
}

interface FieldChange {
  field: string
  old_value: any
  new_value: any
}
```

### 3. Compliance Report
```typescript
interface ComplianceReport {
  period: DateRange
  total_audited_actions: number
  critical_actions: number
  sod_violations: number
  unauthorized_access_attempts: number
  price_overrides: number
  emergency_access_uses: number
  missing_reasons: number
  tampered_logs: number  // Based on checksum validation
}
```

### 4. Access Report
```typescript
interface AccessReport {
  user: string
  role: string
  modules_accessed: string[]
  sensitive_data_viewed: number
  permissions_used: string[]
  anomalies: Anomaly[]
}

interface Anomaly {
  type: 'unusual_hours' | 'unusual_location' | 'unusual_action' | 'high_volume'
  description: string
  timestamp: Date
  severity: string
}
```

---

## Tamper Detection

### Checksum Validation

```typescript
async function validateAuditIntegrity(auditLog: AuditLog): Promise<boolean> {
  // Recreate checksum from stored data
  const payload = {
    user_id: auditLog.user_id,
    action: auditLog.action,
    entity_type: auditLog.entity_type,
    entity_id: auditLog.entity_id,
    timestamp: auditLog.timestamp,
    old_values: auditLog.old_values,
    new_values: auditLog.new_values
  }

  const computedChecksum = await generateChecksum(payload)

  if (computedChecksum !== auditLog.checksum) {
    await createAlert({
      type: 'AUDIT_TAMPERING',
      severity: 'CRITICAL',
      message: `Audit log ${auditLog.id} checksum mismatch - possible tampering`,
      entity_type: 'audit_log',
      entity_id: auditLog.id
    })

    return false
  }

  return true
}

// Periodic integrity check (cron job)
async function auditIntegrityCheck(): Promise<IntegrityReport> {
  const recentLogs = await getAuditLogs({
    since: subDays(new Date(), 1)
  })

  const results = await Promise.all(
    recentLogs.map(log => validateAuditIntegrity(log))
  )

  const tamperedCount = results.filter(r => !r).length

  if (tamperedCount > 0) {
    await notifySecurity({
      title: 'Audit Integrity Breach Detected',
      message: `${tamperedCount} audit logs failed integrity check`,
      severity: 'CRITICAL'
    })
  }

  return {
    total_checked: recentLogs.length,
    valid: results.filter(r => r).length,
    tampered: tamperedCount,
    integrity_percentage: (results.filter(r => r).length / recentLogs.length) * 100
  }
}
```

---

## Retention & Archival

### Retention Policy

```
Hot Storage (PostgreSQL):
- Last 90 days
- Full search capability
- Fast queries

Warm Storage (Compressed):
- 90 days to 2 years
- Searchable but slower
- Compressed JSONB

Cold Storage (Archive):
- 2 to 7 years
- Compliance retention
- S3/Glacier equivalent
- Restore on demand
```

### Archive Process

```typescript
// Daily cron job
async function archiveOldAuditLogs(): Promise<void> {
  const archiveDate = subDays(new Date(), 90)

  // 1. Get logs older than 90 days
  const logsToArchive = await auditLogs.find({
    timestamp: { $lt: archiveDate }
  })

  // 2. Compress and save to archive storage
  const compressed = await compressLogs(logsToArchive)
  await archiveStorage.upload(`audit_logs_${format(archiveDate, 'yyyy-MM')}.gz`, compressed)

  // 3. Move to warm storage table
  await warmStorageAuditLogs.insertMany(logsToArchive)

  // 4. Delete from hot storage
  await auditLogs.deleteMany({
    timestamp: { $lt: archiveDate }
  })

  console.log(`Archived ${logsToArchive.length} audit logs`)
}

// Restore from archive
async function restoreAuditLogs(dateRange: DateRange): Promise<void> {
  const archiveFile = `audit_logs_${format(dateRange.start, 'yyyy-MM')}.gz`
  const compressed = await archiveStorage.download(archiveFile)
  const logs = await decompressLogs(compressed)

  // Temporarily load into search index
  await temporaryAuditIndex.insertMany(logs)

  return logs
}
```

---

## Privacy & Data Protection

### PII Masking

```typescript
function maskSensitiveData(data: any): any {
  const sensitiveFields = [
    'password',
    'card_number',
    'cvv',
    'pin',
    'account_number',
    'tax_id'
  ]

  const masked = { ...data }

  for (const field of sensitiveFields) {
    if (masked[field]) {
      if (field === 'card_number') {
        // Keep last 4 digits
        masked[field] = '****' + masked[field].slice(-4)
      } else {
        masked[field] = '********'
      }
    }
  }

  return masked
}

// Apply before logging
await AuditService.log({
  action: 'UPDATE',
  entity_type: 'user',
  entity_id: user.id,
  old_values: maskSensitiveData(oldValues),
  new_values: maskSensitiveData(newValues)
})
```

---

## API Endpoints

```
# Audit Logs (Admin/Auditor only)
GET    /api/audit-logs
GET    /api/audit-logs/{id}
GET    /api/audit-logs/user/{user_id}
GET    /api/audit-logs/entity/{entity_type}/{entity_id}
GET    /api/audit-logs/search

# Reports
GET    /api/reports/user-activity
GET    /api/reports/compliance
GET    /api/reports/entity-history/{entity_type}/{entity_id}

# Integrity
POST   /api/audit-logs/validate-integrity
GET    /api/audit-logs/integrity-report
```

---

**Document Version**: 1.0
**Compliance Level**: Audit-Ready for Regulated Industries
**Last Updated**: 2026-01-31
**Next**: [UI Design System](UI_DESIGN_SYSTEM.md)
