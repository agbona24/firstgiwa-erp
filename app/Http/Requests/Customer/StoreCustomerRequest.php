<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:customers,email',
            'phone' => 'required|string|max:20',
            'customer_type' => 'required|in:cash,credit,both',
            'customer_category' => 'required|in:retail,wholesale,distributor,walk_in,other',
            'address' => 'nullable|string',
            'contact_person' => 'nullable|string|max:255',
            'credit_facility_type_id' => 'nullable|exists:credit_facility_types,id',
            'credit_limit' => 'nullable|numeric|min:0',
            'payment_terms_days' => 'nullable|integer|min:0',
            'tax_id' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Customer name is required',
            'phone.required' => 'Phone number is required',
            'customer_type.required' => 'Payment type is required',
            'customer_type.in' => 'Payment type must be cash, credit, or both',
            'customer_category.required' => 'Customer category is required',
            'customer_category.in' => 'Category must be retail, wholesale, distributor, walk_in, or other',
            'credit_limit.min' => 'Credit limit cannot be negative',
            'payment_terms_days.min' => 'Payment terms cannot be negative',
        ];
    }
}
