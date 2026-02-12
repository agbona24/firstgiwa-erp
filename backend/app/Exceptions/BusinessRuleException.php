<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

/**
 * Business Rule Exception
 * 
 * Thrown when a business rule is violated.
 * Examples:
 * - Credit limit exceeded
 * - Insufficient stock
 * - Invalid state transition
 * - Missing required approval
 */
class BusinessRuleException extends Exception
{
    protected array $context;

    public function __construct(
        string $message,
        array $context = [],
        int $code = 422
    ) {
        parent::__construct($message, $code);
        $this->context = $context;
    }

    /**
     * Get additional context for the exception.
     */
    public function getContext(): array
    {
        return $this->context;
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'error_type' => 'business_rule_violation',
            'context' => $this->context,
        ], $this->getCode());
    }

    /**
     * Report the exception.
     */
    public function report(): bool
    {
        // Don't report business rule exceptions to error tracking
        // They are expected application behavior
        return false;
    }
}
