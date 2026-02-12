<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashierSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'branch_id',
        'session_number',
        'terminal_id',
        'opened_at',
        'closed_at',
        'opening_cash',
        'closing_cash',
        'expected_cash',
        'cash_variance',
        'total_transactions',
        'total_sales',
        'cash_sales',
        'card_sales',
        'transfer_sales',
        'total_refunds',
        'status',
        'notes',
        'closed_by',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'opening_cash' => 'decimal:2',
        'closing_cash' => 'decimal:2',
        'expected_cash' => 'decimal:2',
        'cash_variance' => 'decimal:2',
        'total_sales' => 'decimal:2',
        'cash_sales' => 'decimal:2',
        'card_sales' => 'decimal:2',
        'transfer_sales' => 'decimal:2',
        'total_refunds' => 'decimal:2',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($session) {
            if (empty($session->tenant_id) && auth()->check()) {
                $session->tenant_id = auth()->user()->tenant_id;
            }
            if (empty($session->session_number)) {
                $session->session_number = static::generateSessionNumber($session->tenant_id);
            }
        });
    }

    /**
     * Generate unique session number
     */
    public static function generateSessionNumber(?int $tenantId = null): string
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id ?? 1;
        $prefix = 'SHIFT';
        $date = now()->format('Ymd');
        
        $lastSession = static::where('tenant_id', $tenantId)
            ->whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastSession 
            ? (int)substr($lastSession->session_number, -4) + 1 
            : 1;

        return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
    }

    /**
     * Get the tenant that owns the session
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the cashier user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Alias for user - the cashier
     */
    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the branch
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the user who closed the session
     */
    public function closedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    /**
     * Scope: Active sessions only
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope: For current tenant
     */
    public function scopeForTenant($query, ?int $tenantId = null)
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope: For specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Check if session is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if session is closed
     */
    public function isClosed(): bool
    {
        return in_array($this->status, ['closed', 'reconciled']);
    }

    /**
     * Calculate session duration in hours
     */
    public function getDurationAttribute(): ?float
    {
        if (!$this->opened_at) {
            return null;
        }

        $endTime = $this->closed_at ?? now();
        return round($this->opened_at->diffInMinutes($endTime) / 60, 2);
    }

    /**
     * Get variance status (over, short, balanced)
     */
    public function getVarianceStatusAttribute(): string
    {
        if ($this->cash_variance === null) {
            return 'pending';
        }

        if ($this->cash_variance > 0) {
            return 'over';
        } elseif ($this->cash_variance < 0) {
            return 'short';
        }

        return 'balanced';
    }

    /**
     * Close the session
     */
    public function close(float $closingCash, ?string $notes = null, ?int $closedBy = null): self
    {
        // Calculate expected cash (opening + cash sales - cash refunds)
        $expectedCash = $this->opening_cash + $this->cash_sales;
        
        // Calculate variance
        $variance = $closingCash - $expectedCash;

        $this->update([
            'closed_at' => now(),
            'closing_cash' => $closingCash,
            'expected_cash' => $expectedCash,
            'cash_variance' => $variance,
            'status' => 'closed',
            'notes' => $notes,
            'closed_by' => $closedBy ?? auth()->id(),
        ]);

        return $this;
    }

    /**
     * Update sales totals from transactions
     */
    public function updateSalesTotals(array $totals): self
    {
        $this->update([
            'total_transactions' => $totals['total_transactions'] ?? $this->total_transactions,
            'total_sales' => $totals['total_sales'] ?? $this->total_sales,
            'cash_sales' => $totals['cash_sales'] ?? $this->cash_sales,
            'card_sales' => $totals['card_sales'] ?? $this->card_sales,
            'transfer_sales' => $totals['transfer_sales'] ?? $this->transfer_sales,
            'total_refunds' => $totals['total_refunds'] ?? $this->total_refunds,
        ]);

        return $this;
    }

    /**
     * Increment transaction count and sales
     */
    public function recordSale(float $amount, string $paymentMethod): self
    {
        $this->increment('total_transactions');
        $this->increment('total_sales', $amount);

        switch ($paymentMethod) {
            case 'cash':
                $this->increment('cash_sales', $amount);
                break;
            case 'card':
            case 'pos':
                $this->increment('card_sales', $amount);
                break;
            case 'transfer':
            case 'bank_transfer':
                $this->increment('transfer_sales', $amount);
                break;
        }

        return $this;
    }

    /**
     * Record a refund
     */
    public function recordRefund(float $amount): self
    {
        $this->increment('total_refunds', $amount);
        return $this;
    }
}
