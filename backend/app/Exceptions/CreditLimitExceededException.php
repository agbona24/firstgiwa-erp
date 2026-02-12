<?php

namespace App\Exceptions;

/**
 * Credit Limit Exceeded Exception
 * 
 * Thrown when a credit sale would exceed the customer's credit limit.
 */
class CreditLimitExceededException extends BusinessRuleException
{
    public function __construct(
        string $customerName,
        float $creditLimit,
        float $currentUsage,
        float $orderAmount
    ) {
        $available = $creditLimit - $currentUsage;
        $message = "Credit limit exceeded for {$customerName}. " .
            "Credit Limit: ₦" . number_format($creditLimit, 2) . ", " .
            "Current Usage: ₦" . number_format($currentUsage, 2) . ", " .
            "Available: ₦" . number_format($available, 2) . ", " .
            "Order Amount: ₦" . number_format($orderAmount, 2);

        parent::__construct($message, [
            'customer' => $customerName,
            'credit_limit' => $creditLimit,
            'current_usage' => $currentUsage,
            'available_credit' => $available,
            'order_amount' => $orderAmount,
            'excess_amount' => $orderAmount - $available,
        ], 422);
    }
}
