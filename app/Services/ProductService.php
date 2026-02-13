<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ProductService extends BaseService
{
    /**
     * Get paginated list of products with filtering and sorting.
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Product::with(['category', 'inventory']);

        // Search across multiple fields
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // Filter by inventory type
        if (!empty($filters['inventory_type'])) {
            $query->where('inventory_type', $filters['inventory_type']);
        }

        // Filter by status/stock level
        if (!empty($filters['status'])) {
            match ($filters['status']) {
                'low_stock' => $query->lowStock(),
                'critical' => $query->criticalStock(),
                'active' => $query->active(),
                'inactive' => $query->where('is_active', false),
                default => null,
            };
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        
        // Validate sort columns to prevent SQL injection
        $allowedSortColumns = ['name', 'sku', 'cost_price', 'selling_price', 'created_at', 'updated_at'];
        if (in_array($sortBy, $allowedSortColumns)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        // Pagination
        $perPage = min($filters['per_page'] ?? config('erp.pagination.default'), config('erp.pagination.max'));

        return $query->paginate($perPage);
    }

    /**
     * Get a single product by ID with relationships.
     */
    public function find(int $id): ?Product
    {
        return Product::with(['category', 'inventory.warehouse'])->find($id);
    }

    /**
     * Get a product by SKU.
     */
    public function findBySku(string $sku): ?Product
    {
        return Product::where('sku', $sku)->first();
    }

    /**
     * Create a new product.
     */
    public function create(array $data): Product
    {
        return $this->transaction(function () use ($data) {
            // Extract warehouse_id if provided (it's not a product field)
            $warehouseId = $data['warehouse_id'] ?? null;
            unset($data['warehouse_id']);
            
            $product = Product::create($data);
            
            // If warehouse specified and track_inventory is true, create initial inventory record
            if ($warehouseId && ($data['track_inventory'] ?? true)) {
                \App\Models\Inventory::create([
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouseId,
                    'quantity' => 0,
                    'reserved_quantity' => 0,
                    'available_quantity' => 0,
                    'tenant_id' => $product->tenant_id,
                    'branch_id' => $product->branch_id,
                ]);
            }
            
            $product->load(['category', 'inventory']);
            return $product;
        });
    }

    /**
     * Update an existing product.
     */
    public function update(Product $product, array $data, ?string $reason = null): Product
    {
        return $this->transaction(function () use ($product, $data, $reason) {
            if ($reason) {
                $product->setAuditReason($reason);
            }

            $product->update($data);
            $product->load(['category', 'inventory']);
            return $product;
        });
    }

    /**
     * Delete a product (soft delete).
     */
    public function delete(Product $product, ?string $reason = null): bool
    {
        return $this->transaction(function () use ($product, $reason) {
            if ($reason) {
                $product->setAuditReason($reason);
            }

            // Check if product has any inventory before deleting
            $totalStock = $product->inventory()->sum('quantity');
            if ($totalStock > 0) {
                throw new \App\Exceptions\BusinessRuleException(
                    "Cannot delete product with existing inventory. Current stock: {$totalStock} {$product->unit_of_measure}"
                );
            }

            return $product->delete();
        });
    }

    /**
     * Get products with low stock.
     */
    public function getLowStockProducts(): Collection
    {
        return Product::with(['category', 'inventory'])
            ->lowStock()
            ->get();
    }

    /**
     * Get products with critical stock.
     */
    public function getCriticalStockProducts(): Collection
    {
        return Product::with(['category', 'inventory'])
            ->criticalStock()
            ->get();
    }

    /**
     * Get raw materials only.
     */
    public function getRawMaterials(): Collection
    {
        return Product::with(['category', 'inventory'])
            ->where('inventory_type', 'raw_material')
            ->active()
            ->get();
    }

    /**
     * Get finished goods only.
     */
    public function getFinishedGoods(): Collection
    {
        return Product::with(['category', 'inventory'])
            ->where('inventory_type', 'finished_good')
            ->active()
            ->get();
    }

    /**
     * Update product cost price (used when receiving goods).
     */
    public function updateCostPrice(Product $product, float $newCost, string $reason): Product
    {
        $this->assertPositive($newCost, 'Cost price');

        return $this->update($product, ['cost_price' => $this->roundCurrency($newCost)], $reason);
    }

    /**
     * Activate a product.
     */
    public function activate(Product $product): Product
    {
        return $this->update($product, ['is_active' => true], 'Product activated');
    }

    /**
     * Deactivate a product.
     */
    public function deactivate(Product $product): Product
    {
        return $this->update($product, ['is_active' => false], 'Product deactivated');
    }

    /**
     * Delete all products (bulk delete).
     * Only deletes products with zero inventory.
     */
    public function deleteAll(?string $reason = null): int
    {
        return $this->transaction(function () use ($reason) {
            $deleted = 0;
            
            // Get all products that have zero or no inventory
            $products = Product::whereDoesntHave('inventory', function ($q) {
                $q->where('quantity', '>', 0);
            })->get();
            
            foreach ($products as $product) {
                try {
                    if ($reason) {
                        $product->setAuditReason($reason);
                    }
                    $product->delete();
                    $deleted++;
                } catch (\Exception $e) {
                    // Skip products that can't be deleted (e.g., in use by formulas)
                    continue;
                }
            }
            
            return $deleted;
        });
    }

    /**
     * Bulk delete selected products.
     */
    public function bulkDelete(array $ids, ?string $reason = null): array
    {
        return $this->transaction(function () use ($ids, $reason) {
            $deleted = 0;
            $failed = 0;
            $errors = [];
            
            foreach ($ids as $id) {
                $product = $this->find($id);
                if (!$product) {
                    $failed++;
                    $errors[] = "Product ID {$id} not found";
                    continue;
                }
                
                try {
                    $this->delete($product, $reason);
                    $deleted++;
                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = "Product '{$product->name}': " . $e->getMessage();
                }
            }
            
            return [
                'deleted' => $deleted,
                'failed' => $failed,
                'errors' => $errors,
            ];
        });
    }
}
