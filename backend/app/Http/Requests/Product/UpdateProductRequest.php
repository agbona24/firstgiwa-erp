<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Super Admin can do anything, otherwise check permission
        return $this->user()->hasRole('Super Admin') || $this->user()->hasPermission('products.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $productId = $this->route('product');

        return [
            'sku' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('products', 'sku')->ignore($productId)],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'inventory_type' => ['sometimes', Rule::in(['raw_material', 'finished_good', 'consumable', 'packaging'])],
            'unit_of_measure' => ['sometimes', 'required', 'string', 'max:20'],
            'secondary_unit' => ['nullable', 'string', 'max:20'],
            'conversion_factor' => ['nullable', 'numeric', 'min:0.001'],
            'cost_price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'selling_price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'minimum_price' => ['nullable', 'numeric', 'min:0'],
            'reorder_level' => ['sometimes', 'required', 'integer', 'min:0'],
            'critical_level' => ['sometimes', 'required', 'integer', 'min:0'],
            'barcode' => ['nullable', 'string', Rule::unique('products', 'barcode')->ignore($productId)],
            'image_url' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'track_inventory' => ['boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'sku.unique' => 'This SKU is already in use by another product.',
            'barcode.unique' => 'This barcode is already assigned to another product.',
            'category_id.exists' => 'The selected category does not exist.',
            'inventory_type.in' => 'Invalid inventory type. Must be: raw_material, finished_good, consumable, or packaging.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'sku' => 'SKU',
            'category_id' => 'category',
            'unit_of_measure' => 'unit of measure',
            'cost_price' => 'cost price',
            'selling_price' => 'selling price',
            'minimum_price' => 'minimum price',
            'reorder_level' => 'reorder level',
            'critical_level' => 'critical level',
        ];
    }
}
