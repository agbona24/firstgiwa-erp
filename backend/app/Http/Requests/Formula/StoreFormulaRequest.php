<?php

namespace App\Http\Requests\Formula;

use Illuminate\Foundation\Http\FormRequest;

class StoreFormulaRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Allow all authenticated users (route already requires auth:sanctum)
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'customer_id' => 'nullable|exists:customers,id',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.percentage' => 'required|numeric|min:0|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Formula name is required',
            'items.required' => 'Formula must have at least one item',
            'items.min' => 'Formula must have at least one item',
            'items.*.product_id.required' => 'Product is required for each formula item',
            'items.*.product_id.exists' => 'Selected product does not exist',
            'items.*.percentage.required' => 'Percentage is required for each formula item',
            'items.*.percentage.min' => 'Percentage cannot be negative',
            'items.*.percentage.max' => 'Percentage cannot exceed 100%',
        ];
    }
}
