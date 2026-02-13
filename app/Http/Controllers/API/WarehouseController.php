<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    /**
     * Get all warehouses.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Warehouse::with('manager');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $warehouses = $query->orderBy('name')->get();

        return response()->json($warehouses);
    }

    /**
     * Create a new warehouse.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:20|unique:warehouses,code',
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'manager_id' => 'nullable|exists:users,id',
            'is_active' => 'boolean',
        ]);

        if (!$request->user()->hasPermission('warehouses.create')) {
            return response()->json(['message' => 'Permission denied.'], 403);
        }

        $warehouse = Warehouse::create($request->all());

        return response()->json([
            'message' => 'Warehouse created successfully',
            'warehouse' => $warehouse->load('manager'),
        ], 201);
    }

    /**
     * Get a specific warehouse.
     */
    public function show(int $id): JsonResponse
    {
        $warehouse = Warehouse::with(['manager', 'inventory.product'])->find($id);

        if (!$warehouse) {
            return response()->json(['message' => 'Warehouse not found'], 404);
        }

        return response()->json($warehouse);
    }

    /**
     * Update a warehouse.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $warehouse = Warehouse::find($id);

        if (!$warehouse) {
            return response()->json(['message' => 'Warehouse not found'], 404);
        }

        $request->validate([
            'code' => 'sometimes|required|string|max:20|unique:warehouses,code,' . $id,
            'name' => 'sometimes|required|string|max:255',
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'manager_id' => 'nullable|exists:users,id',
            'is_active' => 'boolean',
        ]);

        if (!$request->user()->hasPermission('warehouses.edit')) {
            return response()->json(['message' => 'Permission denied.'], 403);
        }

        $warehouse->update($request->all());

        return response()->json([
            'message' => 'Warehouse updated successfully',
            'warehouse' => $warehouse->load('manager'),
        ]);
    }

    /**
     * Delete a warehouse.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $warehouse = Warehouse::find($id);

        if (!$warehouse) {
            return response()->json(['message' => 'Warehouse not found'], 404);
        }

        if (!$request->user()->hasPermission('warehouses.delete')) {
            return response()->json(['message' => 'Permission denied.'], 403);
        }

        // Check if warehouse has inventory
        $hasInventory = $warehouse->inventory()->where('quantity', '>', 0)->exists();
        if ($hasInventory) {
            return response()->json([
                'message' => 'Cannot delete warehouse with existing inventory. Transfer stock first.',
            ], 422);
        }

        $warehouse->delete();

        return response()->json(['message' => 'Warehouse deleted successfully']);
    }

    /**
     * Get inventory summary for a warehouse.
     */
    public function inventory(int $id, Request $request): JsonResponse
    {
        $warehouse = Warehouse::find($id);

        if (!$warehouse) {
            return response()->json(['message' => 'Warehouse not found'], 404);
        }

        $inventory = $warehouse->inventory()
            ->with(['product.category'])
            ->paginate($request->get('per_page', 15));

        return response()->json($inventory);
    }
}
