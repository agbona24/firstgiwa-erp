<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerCreditTransaction;
use App\Models\CustomerCreditPayment;
use App\Models\CustomerCreditScore;
use App\Models\SalesOrder;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class CreditAnalysisService
{
    /**
     * Calculate and update credit score for a customer
     */
    public function calculateCreditScore(Customer $customer): CustomerCreditScore
    {
        // Get data from credit tracking tables
        $creditTransactions = $customer->creditTransactions;
        $creditPayments = $customer->creditPayments;

        // Get IDs of sales orders that already have credit transactions (to avoid duplicates)
        $salesOrderIdsWithTracking = $creditTransactions->pluck('sales_order_id')->filter()->toArray();

        // Also get credit sales from sales_orders for legacy data (exclude those with tracking)
        $creditSalesOrders = SalesOrder::where('customer_id', $customer->id)
            ->where('payment_type', 'credit')
            ->whereNotIn('id', $salesOrderIdsWithTracking)
            ->get();

        // Get payments made against credit sales (only for those without tracking)
        $salesPayments = Payment::where('customer_id', $customer->id)
            ->whereNotNull('sales_order_id')
            ->whereIn('sales_order_id', $creditSalesOrders->pluck('id'))
            ->get();

        // Combined transaction counts
        $totalFromTracking = $creditTransactions->count();
        $totalFromSalesOrders = $creditSalesOrders->count();
        $totalTransactions = $totalFromTracking + $totalFromSalesOrders;

        // On-time payments from tracking
        $onTimePayments = $creditPayments->where('is_on_time', true)->count();
        $latePayments = $creditPayments->where('is_on_time', false)->count();

        // For sales orders, check if paid within terms
        foreach ($creditSalesOrders as $order) {
            $orderPayments = $salesPayments->where('sales_order_id', $order->id);
            if ($orderPayments->count() > 0) {
                $firstPayment = $orderPayments->sortBy('payment_date')->first();
                $paymentTermsDays = $customer->payment_terms_days ?: 30;
                $dueDate = $order->created_at->addDays($paymentTermsDays);
                
                if ($firstPayment->payment_date <= $dueDate) {
                    $onTimePayments++;
                } else {
                    $latePayments++;
                }
            }
        }

        // Calculate average days to pay
        $paidTransactions = $creditTransactions->where('status', 'paid');
        $avgDaysToPay = 0;
        $paidCount = 0;
        $totalDays = 0;
        
        // From tracking tables
        foreach ($paidTransactions as $tx) {
            if ($tx->paid_date) {
                $totalDays += $tx->transaction_date->diffInDays($tx->paid_date);
                $paidCount++;
            }
        }
        
        // From sales orders
        foreach ($creditSalesOrders->where('payment_status', 'paid') as $order) {
            $orderPayments = $salesPayments->where('sales_order_id', $order->id);
            if ($orderPayments->count() > 0) {
                $lastPayment = $orderPayments->sortByDesc('payment_date')->first();
                $totalDays += $order->created_at->diffInDays($lastPayment->payment_date);
                $paidCount++;
            }
        }
        
        if ($paidCount > 0) {
            $avgDaysToPay = $totalDays / $paidCount;
        }

        // Current overdue stats - from tracking tables
        $overdueTransactions = $creditTransactions->whereIn('status', ['overdue', 'partial'])
            ->filter(fn($tx) => $tx->due_date < now());
        $currentOverdueCount = $overdueTransactions->count();
        $currentOverdueAmount = $overdueTransactions->sum('balance_remaining');
        $longestOverdueDays = $overdueTransactions->max('days_overdue') ?? 0;

        // Also check sales orders for overdue
        $paymentTermsDays = $customer->payment_terms_days ?: 30;
        foreach ($creditSalesOrders->whereIn('payment_status', ['pending', 'partial']) as $order) {
            $dueDate = $order->created_at->addDays($paymentTermsDays);
            if (now() > $dueDate) {
                $currentOverdueCount++;
                $paidAmount = $salesPayments->where('sales_order_id', $order->id)->sum('amount');
                $currentOverdueAmount += ($order->total_amount - $paidAmount);
                $daysOverdue = now()->diffInDays($dueDate);
                if ($daysOverdue > $longestOverdueDays) {
                    $longestOverdueDays = $daysOverdue;
                }
            }
        }

        // If no transactions at all but has outstanding balance, consider it as overdue
        if ($totalTransactions === 0 && $customer->outstanding_balance > 0) {
            $currentOverdueCount = 1;
            $currentOverdueAmount = $customer->outstanding_balance;
        }

        // Calculate on-time rate
        $totalPaymentEvents = $onTimePayments + $latePayments;
        $onTimeRate = $totalPaymentEvents > 0 ? ($onTimePayments / $totalPaymentEvents) * 100 : 0;
        
        // If no payment history yet, use neutral score based on utilization
        if ($totalTransactions === 0 && $totalPaymentEvents === 0) {
            // New customer with no credit history - base score on utilization
            $utilizationRate = $customer->credit_limit > 0 
                ? ($customer->outstanding_balance / $customer->credit_limit) * 100 
                : 0;
            
            // Start with 50 for new customer, adjust based on utilization
            if ($utilizationRate > 90) {
                $score = 30; // High utilization is concerning for new customer
            } elseif ($utilizationRate > 70) {
                $score = 40;
            } elseif ($utilizationRate > 50) {
                $score = 50;
            } elseif ($utilizationRate > 0) {
                $score = 60; // Some usage, neutral
            } else {
                $score = 70; // No usage yet, slight positive
            }
        } else {
            // Calculate credit score (0-100) using full metrics
            $score = $this->computeScore([
                'on_time_rate' => $onTimeRate,
                'on_time_payments' => $onTimePayments,
                'late_payments' => $latePayments,
                'avg_days_to_pay' => $avgDaysToPay,
                'payment_terms' => $customer->payment_terms_days ?: 30,
                'overdue_count' => $currentOverdueCount,
                'overdue_amount' => $currentOverdueAmount,
                'credit_limit' => $customer->credit_limit,
                'total_transactions' => $totalTransactions,
            ]);
        }

        // Determine risk level
        $riskLevel = $this->determineRiskLevel($score, $currentOverdueCount, $currentOverdueAmount, $customer->credit_limit);

        // Generate recommendations
        $recommendations = $this->generateRecommendations($customer, $score, $riskLevel, [
            'on_time_rate' => $onTimeRate,
            'avg_days_to_pay' => $avgDaysToPay,
            'overdue_count' => $currentOverdueCount,
        ]);

        // Create or update credit score
        $creditScore = CustomerCreditScore::updateOrCreate(
            ['customer_id' => $customer->id],
            [
                'tenant_id' => $customer->tenant_id ?? 1,
                'credit_score' => $score,
                'risk_level' => $riskLevel,
                'total_transactions' => $totalTransactions,
                'on_time_payments' => $onTimePayments,
                'late_payments' => $latePayments,
                'on_time_payment_rate' => $onTimeRate,
                'average_days_to_pay' => $avgDaysToPay,
                'total_credit_used' => $creditTransactions->sum('amount') + $creditSalesOrders->sum('total_amount'),
                'total_credit_paid' => $creditPayments->sum('amount') + $salesPayments->sum('amount'),
                'current_overdue_count' => $currentOverdueCount,
                'current_overdue_amount' => $currentOverdueAmount,
                'longest_overdue_days' => $longestOverdueDays,
                'recommended_limit' => $recommendations['limit'],
                'recommended_terms_days' => $recommendations['terms'],
                'recommendations' => $recommendations['notes'],
                'last_calculated_at' => now(),
            ]
        );

        return $creditScore;
    }

    /**
     * Compute credit score
     * 
     * Scoring breakdown:
     * - Base score: 50 points (neutral starting point)
     * - On-time payment bonus: up to +30 points for 100% on-time rate
     * - Late payment penalty: up to -20 points based on late count
     * - Overdue penalty: up to -20 points for current overdue items
     * - Transaction history bonus: up to +10 points for established history
     * - Payment speed bonus: up to +10 points for paying faster than terms
     * 
     * Range: 0-100 (but typically 50-100 for good customers)
     */
    protected function computeScore(array $metrics): int
    {
        // Start with a neutral base score
        $score = 50;

        // If there are payment events, score on-time rate (max +30 for 100%, 0 for 0%)
        // Only count this if there are actual payment events
        $hasPaymentHistory = ($metrics['on_time_payments'] ?? 0) + ($metrics['late_payments'] ?? 0) > 0;
        if ($hasPaymentHistory) {
            $onTimeBonus = ($metrics['on_time_rate'] / 100) * 30;
            $score += $onTimeBonus;
        } else {
            // No payment history yet - give benefit of the doubt (+15 neutral)
            $score += 15;
        }

        // Late payment penalty (max -20 points)
        $latePayments = $metrics['late_payments'] ?? 0;
        if ($latePayments > 0) {
            $latePenalty = min(20, $latePayments * 5);
            $score -= $latePenalty;
        }

        // Current overdue penalty (max -20 points based on count and amount)
        if ($metrics['overdue_count'] > 0) {
            $overduePenalty = min(10, $metrics['overdue_count'] * 3);
            $score -= $overduePenalty;
        }
        if ($metrics['credit_limit'] > 0 && $metrics['overdue_amount'] > 0) {
            $overdueRatio = $metrics['overdue_amount'] / $metrics['credit_limit'];
            $overdueAmountPenalty = min(10, $overdueRatio * 20);
            $score -= $overdueAmountPenalty;
        }

        // Transaction history bonus (max +10 points - established customers)
        $historyBonus = min(10, $metrics['total_transactions'] * 1);
        $score += $historyBonus;

        // Payment speed bonus (max +10 points for paying faster than terms)
        if ($hasPaymentHistory && $metrics['avg_days_to_pay'] > 0) {
            $paymentTerms = $metrics['payment_terms'] > 0 ? $metrics['payment_terms'] : 30;
            $speedRatio = $metrics['avg_days_to_pay'] / $paymentTerms;
            
            if ($speedRatio <= 0.5) {
                // Paying in half the time or less - full bonus
                $score += 10;
            } elseif ($speedRatio <= 1.0) {
                // Paying within terms - partial bonus
                $score += 10 * (1 - ($speedRatio - 0.5) * 2);
            }
            // No bonus if paying after terms (but no additional penalty - that's in late payments)
        }

        return max(0, min(100, round($score)));
    }

    /**
     * Determine risk level based on score and metrics
     */
    protected function determineRiskLevel(int $score, int $overdueCount, float $overdueAmount, float $creditLimit): string
    {
        if ($score >= 80 && $overdueCount === 0) {
            return 'low';
        }
        
        if ($score >= 60 && $overdueCount <= 1) {
            return 'medium';
        }
        
        if ($score >= 40 || ($overdueCount <= 3 && ($overdueAmount / max(1, $creditLimit)) < 0.5)) {
            return 'high';
        }
        
        return 'critical';
    }

    /**
     * Generate recommendations based on analysis
     */
    protected function generateRecommendations(Customer $customer, int $score, string $riskLevel, array $metrics): array
    {
        $currentLimit = $customer->credit_limit;
        $currentTerms = $customer->payment_terms_days ?: 30;
        $notes = [];

        // Default recommendations
        $recommendedLimit = $currentLimit;
        $recommendedTerms = $currentTerms;

        if ($score >= 90 && $metrics['on_time_rate'] >= 95) {
            // Excellent - consider increase
            $recommendedLimit = $currentLimit * 1.25;
            $recommendedTerms = min(90, $currentTerms + 15);
            $notes[] = 'Excellent payment history. Consider increasing credit limit by 25%.';
        } elseif ($score >= 80) {
            // Very good
            $recommendedLimit = $currentLimit * 1.1;
            $notes[] = 'Very good payment record. May qualify for 10% limit increase.';
        } elseif ($score >= 60) {
            // Fair - maintain
            $notes[] = 'Maintain current terms. Monitor payment patterns.';
        } elseif ($score >= 40) {
            // Poor - reduce
            $recommendedLimit = $currentLimit * 0.75;
            $recommendedTerms = max(7, $currentTerms - 15);
            $notes[] = 'Payment issues detected. Consider reducing credit limit.';
        } else {
            // Critical - restrict
            $recommendedLimit = $currentLimit * 0.5;
            $recommendedTerms = max(7, 14);
            $notes[] = 'Significant credit risk. Strongly recommend reducing limits or requiring cash.';
        }

        // Add specific recommendations
        if ($metrics['overdue_count'] > 0) {
            $notes[] = "Customer has {$metrics['overdue_count']} overdue transaction(s). Follow up on collections.";
        }

        if ($metrics['avg_days_to_pay'] > $currentTerms * 1.5) {
            $notes[] = 'Customer consistently pays beyond terms. Consider shorter payment periods.';
        }

        return [
            'limit' => round($recommendedLimit, 2),
            'terms' => $recommendedTerms,
            'notes' => implode(' ', $notes),
        ];
    }

    /**
     * Get credit analytics for a customer
     */
    public function getCustomerAnalytics(Customer $customer): array
    {
        // Get data from credit tracking tables (eager load salesOrder for payment info)
        $creditTransactions = $customer->creditTransactions()
            ->with('salesOrder')
            ->orderBy('transaction_date', 'desc')
            ->get();
        
        $creditPayments = $customer->creditPayments()
            ->orderBy('payment_date', 'desc')
            ->get();

        // Get IDs of sales orders that already have credit transactions (to avoid duplicates)
        $salesOrderIdsWithTracking = $creditTransactions->pluck('sales_order_id')->filter()->toArray();

        // Also get credit sales from sales_orders for legacy data (exclude those with tracking)
        $creditSalesOrders = SalesOrder::where('customer_id', $customer->id)
            ->where('payment_type', 'credit')
            ->whereNotIn('id', $salesOrderIdsWithTracking) // Exclude duplicates
            ->with('customer')
            ->orderBy('created_at', 'desc')
            ->get();

        // Get ALL credit sales order IDs (including those with tracking) for payment lookup
        $allCreditSalesOrderIds = SalesOrder::where('customer_id', $customer->id)
            ->where('payment_type', 'credit')
            ->pluck('id');

        // Get ALL payments made by this customer for credit sales (using polymorphic or direct customer link)
        $salesPayments = Payment::where('customer_id', $customer->id)
            ->where(function($q) use ($allCreditSalesOrderIds) {
                // Polymorphic payments linked to sales orders
                $q->where(function($q2) use ($allCreditSalesOrderIds) {
                    $q2->where('payable_type', 'App\\Models\\SalesOrder')
                       ->whereIn('payable_id', $allCreditSalesOrderIds);
                })
                // Or credit payment type
                ->orWhere('payment_type', 'customer_credit_payment');
            })
            ->orderBy('payment_date', 'desc')
            ->get();

        // Calculate score if not exists or stale
        $creditScore = $customer->creditScore;
        if (!$creditScore || $creditScore->last_calculated_at?->lt(now()->subHours(24))) {
            $creditScore = $this->calculateCreditScore($customer);
        }

        // Combined stats
        $totalTransactions = $creditTransactions->count() + $creditSalesOrders->count();
        $totalPayments = $creditPayments->count() + $salesPayments->count();

        // Payment terms for overdue calculation
        $paymentTermsDays = $customer->payment_terms_days ?: 30;

        // Calculate actual status for credit transactions based on payments
        $trackingStatusCounts = ['pending' => 0, 'partial' => 0, 'paid' => 0, 'overdue' => 0];
        foreach ($creditTransactions as $tx) {
            $salesOrder = $tx->salesOrder;
            if ($salesOrder) {
                // Sum payments from Payment table for this sales order
                $paymentsSum = $salesPayments->filter(function($payment) use ($salesOrder) {
                    return $payment->payable_type === 'App\\Models\\SalesOrder' && $payment->payable_id == $salesOrder->id;
                })->sum('amount');
                $paidAmount = max($paymentsSum, floatval($salesOrder->paid_amount ?? 0));
                $balance = floatval($tx->amount) - $paidAmount;
                $dueDate = $tx->due_date ?? $tx->transaction_date->addDays($paymentTermsDays);
                
                if ($balance <= 0) {
                    $trackingStatusCounts['paid']++;
                } elseif ($paidAmount > 0) {
                    $trackingStatusCounts['partial']++;
                } elseif (now() > $dueDate) {
                    $trackingStatusCounts['overdue']++;
                } else {
                    $trackingStatusCounts['pending']++;
                }
            } else {
                // Fall back to stored status
                $status = $tx->status ?? 'pending';
                if (isset($trackingStatusCounts[$status])) {
                    $trackingStatusCounts[$status]++;
                } else {
                    $trackingStatusCounts['pending']++;
                }
            }
        }

        $pendingFromTracking = $trackingStatusCounts['pending'];
        $partialFromTracking = $trackingStatusCounts['partial'];
        $overdueFromTracking = $trackingStatusCounts['overdue'];
        $paidFromTracking = $trackingStatusCounts['paid'];

        // Count from sales orders (these are already excluded if they have tracking entries)
        $pendingFromSales = $creditSalesOrders->where('payment_status', 'pending')->count();
        $partialFromSales = $creditSalesOrders->where('payment_status', 'partial')->count();
        $paidFromSales = $creditSalesOrders->where('payment_status', 'paid')->count();
        
        // Check which sales orders are overdue
        $overdueFromSales = $creditSalesOrders->filter(function($order) use ($paymentTermsDays) {
            if (!in_array($order->payment_status, ['pending', 'partial'])) return false;
            $dueDate = $order->created_at->addDays($paymentTermsDays);
            return now() > $dueDate;
        })->count();

        // Transform sales orders to look like transactions for UI
        $salesOrdersAsTransactions = $creditSalesOrders->map(function($order) use ($salesPayments, $paymentTermsDays) {
            // Find payments for this order using polymorphic relation (payable_id matches order id)
            $orderPayments = $salesPayments->filter(function($payment) use ($order) {
                return $payment->payable_type === 'App\\Models\\SalesOrder' && $payment->payable_id == $order->id;
            });
            $paidAmount = $orderPayments->sum('amount');
            
            // Also check the paid_amount on the sales order directly
            $directPaidAmount = floatval($order->paid_amount ?? 0);
            $actualPaidAmount = max($paidAmount, $directPaidAmount);
            
            $dueDate = $order->created_at->addDays($paymentTermsDays);
            $balanceRemaining = floatval($order->total_amount) - floatval($actualPaidAmount);
            
            // Determine status
            $status = $order->payment_status;
            if ($balanceRemaining <= 0) {
                $status = 'paid';
            } elseif ($status !== 'paid' && now() > $dueDate) {
                $status = 'overdue';
            } elseif ($actualPaidAmount > 0 && $balanceRemaining > 0) {
                $status = 'partial';
            }
            
            return [
                'id' => 'so-' . $order->id,
                'reference_number' => $order->order_number ?? ('SO-' . $order->id),
                'transaction_date' => $order->created_at->format('Y-m-d'),
                'amount' => floatval($order->total_amount),
                'paid_amount' => $actualPaidAmount,
                'balance_remaining' => max(0, $balanceRemaining),
                'due_date' => $dueDate->format('Y-m-d'),
                'status' => $status,
                'source' => 'sales_order',
            ];
        });

        // Combine transactions
        $allTransactions = $creditTransactions->map(function($tx) use ($customer, $salesPayments) {
            // Get the related sales order reference if available
            $reference = $tx->reference;
            $salesOrder = $tx->salesOrder;
            if (!$reference && $salesOrder) {
                $reference = $salesOrder->order_number;
            }
            
            // Format dates properly
            $transactionDate = $tx->transaction_date instanceof \Carbon\Carbon 
                ? $tx->transaction_date->format('Y-m-d') 
                : $tx->transaction_date;
            $dueDate = $tx->due_date instanceof \Carbon\Carbon 
                ? $tx->due_date->format('Y-m-d') 
                : ($tx->due_date ?? now()->addDays($customer->payment_terms_days ?? 30)->format('Y-m-d'));
            
            // Calculate actual balance from linked sales order if available
            $amount = floatval($tx->amount);
            $paidAmount = 0;
            $status = $tx->status ?? 'pending';
            
            if ($salesOrder) {
                // Sum payments from Payment table for this sales order
                $paymentsSum = $salesPayments->filter(function($payment) use ($salesOrder) {
                    return $payment->payable_type === 'App\\Models\\SalesOrder' && $payment->payable_id == $salesOrder->id;
                })->sum('amount');
                
                // Also check the paid_amount on the sales order directly
                $directPaidAmount = floatval($salesOrder->paid_amount ?? 0);
                $paidAmount = max($paymentsSum, $directPaidAmount);
                
                $balanceRemaining = max(0, $amount - $paidAmount);
                
                // Determine status based on payment
                if ($balanceRemaining <= 0) {
                    $status = 'paid';
                } elseif ($paidAmount > 0) {
                    $status = 'partial';
                } elseif ($salesOrder->payment_status === 'overdue' || (isset($dueDate) && now() > \Carbon\Carbon::parse($dueDate))) {
                    $status = 'overdue';
                } else {
                    $status = 'pending';
                }
            } else {
                // Fall back to stored balance
                $balanceRemaining = floatval($tx->balance ?? $tx->amount);
            }
            
            return [
                'id' => $tx->id,
                'reference_number' => $reference ?? ('CT-' . $tx->id),
                'transaction_date' => $transactionDate,
                'amount' => $amount,
                'paid_amount' => $paidAmount,
                'balance_remaining' => $balanceRemaining,
                'due_date' => $dueDate,
                'status' => $status,
                'source' => 'credit_tracking',
            ];
        })->concat($salesOrdersAsTransactions)->sortByDesc('transaction_date')->values();

        // Monthly trend (last 6 months)
        $monthlyTrend = $this->getMonthlyTrend($customer->id);

        // Payment method breakdown
        $paymentMethods = $creditPayments->groupBy('payment_method')
            ->map(fn($group) => [
                'count' => $group->count(),
                'total' => $group->sum('amount'),
            ]);

        return [
            'credit_score' => $creditScore,
            'summary' => [
                'total_transactions' => $totalTransactions,
                'paid_transactions' => $paidFromTracking + $paidFromSales,
                'partial_transactions' => $partialFromTracking + $partialFromSales,
                'pending_transactions' => $pendingFromTracking + $pendingFromSales - $overdueFromSales,
                'overdue_transactions' => $overdueFromTracking + $overdueFromSales,
                'total_credit_used' => $creditTransactions->sum('amount') + $creditSalesOrders->sum('total_amount'),
                'total_paid' => $creditPayments->sum('amount') + $salesPayments->sum('amount'),
                'current_balance' => $customer->outstanding_balance,
                'available_credit' => $customer->getAvailableCredit(),
                'utilization_rate' => $customer->getCreditUsagePercentage(),
            ],
            'transactions' => [
                'total' => $totalTransactions,
                'pending' => $pendingFromTracking + $pendingFromSales,
                'partial' => $partialFromTracking + $partialFromSales,
                'overdue' => $overdueFromTracking + $overdueFromSales,
                'paid' => $paidFromTracking + $paidFromSales,
            ],
            'payments' => [
                'total' => $totalPayments,
                'on_time' => $creditPayments->where('is_on_time', true)->count(),
                'late' => $creditPayments->where('is_on_time', false)->count(),
                'on_time_rate' => $creditPayments->count() > 0 
                    ? round(($creditPayments->where('is_on_time', true)->count() / $creditPayments->count()) * 100, 1) 
                    : 0,
            ],
            'payment_methods' => $paymentMethods,
            'monthly_trend' => $monthlyTrend,
            'recent_transactions' => $allTransactions->take(10)->values()->toArray(),
            'recent_payments' => $this->formatRecentPayments($creditPayments, $salesPayments),
        ];
    }

    /**
     * Get monthly trend for last 6 months
     */
    protected function getMonthlyTrend(int $customerId): array
    {
        $trend = [];
        
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $startOfMonth = $month->copy()->startOfMonth();
            $endOfMonth = $month->copy()->endOfMonth();

            $transactions = CustomerCreditTransaction::where('customer_id', $customerId)
                ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
                ->get();

            $payments = CustomerCreditPayment::where('customer_id', $customerId)
                ->whereBetween('payment_date', [$startOfMonth, $endOfMonth])
                ->get();

            $trend[] = [
                'month' => $month->format('M Y'),
                'credit_taken' => $transactions->sum('amount'),
                'payments_made' => $payments->sum('amount'),
                'transactions' => $transactions->count(),
                'on_time_payments' => $payments->where('is_on_time', true)->count(),
                'late_payments' => $payments->where('is_on_time', false)->count(),
            ];
        }

        return $trend;
    }

    /**
     * Create a credit transaction when a credit sale is made
     */
    public function createTransaction(Customer $customer, float $amount, array $data = []): CustomerCreditTransaction
    {
        $paymentTermsDays = $customer->payment_terms_days ?: 30;
        $dueDate = now()->addDays($paymentTermsDays);

        $transaction = CustomerCreditTransaction::create([
            'tenant_id' => $customer->tenant_id ?? 1,
            'customer_id' => $customer->id,
            'sales_order_id' => $data['sales_order_id'] ?? null,
            'reference' => CustomerCreditTransaction::generateReference(),
            'amount' => $amount,
            'paid_amount' => 0,
            'balance' => $amount,
            'transaction_date' => now(),
            'due_date' => $dueDate,
            'status' => 'pending',
            'notes' => $data['notes'] ?? null,
        ]);

        // Update customer outstanding balance
        $customer->increment('outstanding_balance', $amount);

        return $transaction;
    }

    /**
     * Record a payment against a transaction
     */
    public function recordPayment(CustomerCreditTransaction $transaction, float $amount, array $data = []): CustomerCreditPayment
    {
        return $transaction->recordPayment($amount, $data);
    }

    /**
     * Get all overdue transactions
     */
    public function getOverdueTransactions(?int $customerId = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = CustomerCreditTransaction::with('customer')
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', now()->startOfDay())
            ->orderBy('due_date', 'asc');

        if ($customerId) {
            $query->where('customer_id', $customerId);
        }

        return $query->get();
    }

    /**
     * Update overdue status for all transactions
     */
    public function updateOverdueStatus(): int
    {
        $updated = 0;
        
        $transactions = CustomerCreditTransaction::where('status', '!=', 'paid')
            ->where('due_date', '<', now()->startOfDay())
            ->get();

        foreach ($transactions as $transaction) {
            $transaction->status = 'overdue';
            $transaction->days_overdue = now()->startOfDay()->diffInDays($transaction->due_date);
            $transaction->save();
            $updated++;
        }

        return $updated;
    }

    /**
     * Get credit summary for dashboard
     */
    public function getCreditSummary(): array
    {
        $totalOutstanding = Customer::sum('outstanding_balance');
        $totalCreditLimit = Customer::sum('credit_limit');
        
        $overdueTransactions = CustomerCreditTransaction::where('status', 'overdue')->get();
        $overdueAmount = $overdueTransactions->sum('balance');
        $overdueCount = $overdueTransactions->count();

        $customersAtRisk = CustomerCreditScore::whereIn('risk_level', ['high', 'critical'])->count();

        return [
            'total_outstanding' => $totalOutstanding,
            'total_credit_extended' => $totalCreditLimit,
            'utilization_rate' => $totalCreditLimit > 0 ? round(($totalOutstanding / $totalCreditLimit) * 100, 1) : 0,
            'overdue_amount' => $overdueAmount,
            'overdue_count' => $overdueCount,
            'customers_at_risk' => $customersAtRisk,
        ];
    }

    /**
     * Format recent payments from both credit payments and sales payments
     */
    protected function formatRecentPayments($creditPayments, $salesPayments): array
    {
        $allPayments = collect();

        // Format credit payments (CustomerCreditPayment)
        foreach ($creditPayments as $payment) {
            $allPayments->push([
                'id' => $payment->id,
                'reference' => $payment->payment_reference ?? 'N/A',
                'amount' => $payment->amount,
                'payment_date' => $payment->payment_date,
                'payment_method' => $payment->payment_method ?? 'unknown',
                'notes' => $payment->notes ?? '',
                'source' => 'credit_payment',
            ]);
        }

        // Format sales payments (Payment model)
        foreach ($salesPayments as $payment) {
            $allPayments->push([
                'id' => $payment->id,
                'reference' => $payment->payment_reference ?? 'N/A',
                'amount' => $payment->amount,
                'payment_date' => $payment->payment_date ?? $payment->created_at,
                'payment_method' => $payment->payment_method ?? 'unknown',
                'notes' => $payment->notes ?? '',
                'source' => 'sales_payment',
            ]);
        }

        // Sort by date and take top 10
        return $allPayments->sortByDesc('payment_date')->take(10)->values()->toArray();
    }
}
