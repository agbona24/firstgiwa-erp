<?php

namespace App\Http\Requests\SalesOrder;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreSalesOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Allow all authenticated users for now
        // TODO: Enable permission check when RBAC is fully set up
        // return Auth::user()->hasPermission('sales.create');
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'customer_id' => 'required|exists:customers,id',
            'payment_type' => 'required|in:cash,credit,bank_transfer',
            'bank_account_id' => 'required_if:payment_type,bank_transfer|nullable|exists:bank_accounts,id',
            'tax_id' => 'nullable|exists:taxes,id',
            'formula_id' => 'nullable|exists:formulas,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'order_date' => 'nullable|date',
            'delivery_date' => 'nullable|date|after_or_equal:order_date',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'delivery_address' => 'nullable|string',
        ];

        // If formula-based order
        if ($this->has('formula_id') && $this->formula_id) {
            $rules['total_quantity'] = 'required|numeric|min:0.01';
        } else {
            // Direct order
            $rules['items'] = 'required|array|min:1';
            $rules['items.*.product_id'] = 'required|exists:products,id';
            $rules['items.*.quantity'] = 'required|numeric|min:0.01';
            $rules['items.*.unit_price'] = 'required|numeric|min:0';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Customer is required',
            'customer_id.exists' => 'Selected customer does not exist',
            'payment_type.required' => 'Payment type is required',
            'payment_type.in' => 'Payment type must be cash, credit, or bank_transfer',
            'bank_account_id.required_if' => 'Bank account is required for bank transfer payments',
            'formula_id.exists' => 'Selected formula does not exist',
            'total_quantity.required' => 'Total quantity is required for formula-based orders',
            'items.required' => 'Order items are required for direct orders',
            'items.min' => 'Order must have at least one item',
            'items.*.product_id.required' => 'Product is required for each order item',
            'items.*.quantity.required' => 'Quantity is required for each order item',
            'items.*.unit_price.required' => 'Unit price is required for each order item',
        ];
    }
}
