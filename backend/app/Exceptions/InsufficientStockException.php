<?php

namespace App\Exceptions;

/**
 * Insufficient Stock Exception
 * 
 * Thrown when there is not enough stock to complete an operation.
 * Examples:
 * - Sales order exceeds available quantity
 * - Production requires more raw materials than available
 * - Transfer exceeds source warehouse stock
 */
class InsufficientStockException extends BusinessRuleException
{
    public function __construct(
        string $productName,
        float $requested,
        float $available,
        ?string $warehouseName = null
    ) {
        $location = $warehouseName ? " in {$warehouseName}" : '';
        $message = "Insufficient stock for {$productName}{$location}. Requested: {$requested}, Available: {$available}";

        parent::__construct($message, [
            'product' => $productName,
            'requested' => $requested,
            'available' => $available,
            'warehouse' => $warehouseName,
            'shortage' => $requested - $available,
        ], 422);
    }
}
