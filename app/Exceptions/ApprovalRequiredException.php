<?php

namespace App\Exceptions;

/**
 * Approval Required Exception
 * 
 * Thrown when an action requires approval before proceeding.
 */
class ApprovalRequiredException extends BusinessRuleException
{
    public function __construct(
        string $action,
        ?string $reason = null
    ) {
        $message = "Approval required for: {$action}";
        if ($reason) {
            $message .= ". Reason: {$reason}";
        }

        parent::__construct($message, [
            'action' => $action,
            'reason' => $reason,
            'requires_role' => 'approver',
        ], 403);
    }
}
