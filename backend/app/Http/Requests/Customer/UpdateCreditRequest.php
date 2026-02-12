<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateCreditRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()->hasPermission('customers.manage_credit');
    }

    public function rules(): array
    {
        return [
            'credit_limit' => 'required|numeric|min:0',
            'payment_terms_days' => 'required|integer|min:0',
            'reason' => 'nullable|string|min:10',
        ];
    }

    public function messages(): array
    {
        return [
            'credit_limit.required' => 'Credit limit is required',
            'credit_limit.min' => 'Credit limit cannot be negative',
            'payment_terms_days.required' => 'Payment terms are required',
            'payment_terms_days.min' => 'Payment terms cannot be negative',
            'reason.min' => 'Reason must be at least 10 characters',
        ];
    }
}
