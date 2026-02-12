<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()->hasPermission('customers.update');
    }

    public function rules(): array
    {
        $customerId = $this->route('customer') ?? $this->route('id');

        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|unique:customers,email,' . $customerId,
            'phone' => 'sometimes|required|string|max:20',
            'customer_type' => 'sometimes|required|in:cash,credit,both',
            'address' => 'nullable|string',
            'contact_person' => 'nullable|string|max:255',
            'credit_limit' => 'nullable|numeric|min:0',
            'payment_terms_days' => 'nullable|integer|min:0',
            'tax_id' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
        ];
    }
}
