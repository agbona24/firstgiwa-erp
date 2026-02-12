<?php

namespace App\Exceptions;

/**
 * Role Separation Exception
 * 
 * Thrown when role separation rules are violated.
 * Examples:
 * - Creator trying to approve their own document
 * - Booking officer trying to collect payment
 * - Cashier trying to modify invoice
 */
class RoleSeparationException extends BusinessRuleException
{
    public function __construct(string $message, ?string $violatedRule = null)
    {
        parent::__construct($message, [
            'violated_rule' => $violatedRule,
        ], 403);
    }

    /**
     * Create exception for self-approval attempt.
     */
    public static function cannotApproveSelf(string $documentType): self
    {
        return new self(
            "You cannot approve your own {$documentType}. Separation of duties requires a different user.",
            'creator_cannot_approve'
        );
    }

    /**
     * Create exception for booking officer trying to collect payment.
     */
    public static function bookingCannotCollectPayment(): self
    {
        return new self(
            "Booking officers cannot collect payments. This must be done by a cashier.",
            'booking_cannot_collect'
        );
    }

    /**
     * Create exception for cashier trying to modify invoice.
     */
    public static function cashierCannotModifyInvoice(): self
    {
        return new self(
            "Cashiers cannot modify invoices. Only booking officers can edit order details.",
            'cashier_cannot_modify'
        );
    }
}
