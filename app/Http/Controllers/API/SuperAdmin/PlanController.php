<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index(Request $request)
    {
        $query = Plan::query();

        if ($search = $request->get('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $query->orderBy('sort_order');

        return response()->json($query->paginate($request->get('per_page', 20)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|alpha_dash|max:50|unique:plans,slug',
            'price' => 'required|numeric|min:0',
            'billing_period' => 'required|in:month,year',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'features.*.text' => 'required_with:features|string',
            'features.*.included' => 'required_with:features|boolean',
            'max_users' => 'nullable|integer|min:1',
            'max_branches' => 'nullable|integer|min:1',
            'max_products' => 'nullable|integer|min:1',
            'max_monthly_transactions' => 'nullable|integer|min:1',
            'is_highlighted' => 'boolean',
            'badge' => 'nullable|string|max:50',
            'button_text' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer',
        ]);

        $plan = Plan::create($validated);

        AdminActivityLog::log('plan.created', $plan, [
            'name' => $plan->name,
            'price' => $plan->price,
        ]);

        return response()->json([
            'message' => 'Plan created successfully',
            'plan' => $plan,
        ], 201);
    }

    public function show(Plan $plan)
    {
        return response()->json(['plan' => $plan]);
    }

    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'slug' => 'sometimes|alpha_dash|max:50|unique:plans,slug,' . $plan->id,
            'price' => 'sometimes|numeric|min:0',
            'billing_period' => 'sometimes|in:month,year',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'features.*.text' => 'required_with:features|string',
            'features.*.included' => 'required_with:features|boolean',
            'max_users' => 'nullable|integer|min:1',
            'max_branches' => 'nullable|integer|min:1',
            'max_products' => 'nullable|integer|min:1',
            'max_monthly_transactions' => 'nullable|integer|min:1',
            'is_highlighted' => 'boolean',
            'badge' => 'nullable|string|max:50',
            'button_text' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer',
        ]);

        $plan->update($validated);

        AdminActivityLog::log('plan.updated', $plan, ['changes' => $validated]);

        return response()->json([
            'message' => 'Plan updated successfully',
            'plan' => $plan->fresh(),
        ]);
    }

    public function destroy(Plan $plan)
    {
        $plan->update(['is_active' => false]);

        AdminActivityLog::log('plan.deactivated', $plan);

        return response()->json(['message' => 'Plan deactivated']);
    }

    public function toggleActive($id)
    {
        $plan = Plan::findOrFail($id);
        $plan->update(['is_active' => !$plan->is_active]);

        AdminActivityLog::log($plan->is_active ? 'plan.activated' : 'plan.deactivated', $plan);

        return response()->json([
            'message' => $plan->is_active ? 'Plan activated' : 'Plan deactivated',
            'plan' => $plan->fresh(),
        ]);
    }
}
