<?php

namespace App\Http\Requests\SalesOrder;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateSalesOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()->hasPermission('sales.update');
    }

    public function rules(): array
    {
        return [
            'delivery_date' => 'nullable|date',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'delivery_address' => 'nullable|string',
        ];
    }
}
