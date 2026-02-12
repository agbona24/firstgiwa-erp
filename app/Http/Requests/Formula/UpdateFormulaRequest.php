<?php

namespace App\Http\Requests\Formula;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFormulaRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Allow all authenticated users (route already requires auth:sanctum)
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'customer_id' => 'nullable|exists:customers,id',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'items' => 'sometimes|required|array|min:1',
            'items.*.product_id' => 'required_with:items|exists:products,id',
            'items.*.percentage' => 'required_with:items|numeric|min:0|max:100',
        ];
    }
}
