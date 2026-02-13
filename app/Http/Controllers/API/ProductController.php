<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        protected ProductService $productService
    ) {}

    /**
     * Display a listing of products with filtering, sorting, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $products = $this->productService->list($request->all());

        return response()->json($products);
    }

    /**
     * Store a newly created product.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->productService->create($request->validated());

        return response()->json([
            'message' => 'Product created successfully',
            'product' => $product,
        ], 201);
    }

    /**
     * Display the specified product.
     */
    public function show(int $id): JsonResponse
    {
        $product = $this->productService->find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Product not found',
            ], 404);
        }

        return response()->json($product);
    }

    /**
     * Update the specified product.
     */
    public function update(UpdateProductRequest $request, int $product): JsonResponse
    {
        $productModel = $this->productService->find($product);

        if (!$productModel) {
            return response()->json([
                'message' => 'Product not found',
            ], 404);
        }

        $reason = $request->input('reason');
        $updated = $this->productService->update($productModel, $request->validated(), $reason);

        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $updated,
        ]);
    }

    /**
     * Remove the specified product (soft delete).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $product = $this->productService->find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Product not found',
            ], 404);
        }

        // Check permission
        if (!$request->user()->hasPermission('products.delete')) {
            return response()->json([
                'message' => 'You do not have permission to delete products.',
            ], 403);
        }

        try {
            $reason = $request->input('reason', 'Product deleted');
            $this->productService->delete($product, $reason);

            return response()->json([
                'message' => 'Product deleted successfully',
            ]);
        } catch (\App\Exceptions\BusinessRuleException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get products with low stock.
     */
    public function lowStock(): JsonResponse
    {
        $products = $this->productService->getLowStockProducts();

        return response()->json($products);
    }

    /**
     * Get products with critical stock.
     */
    public function criticalStock(): JsonResponse
    {
        $products = $this->productService->getCriticalStockProducts();

        return response()->json($products);
    }

    /**
     * Get raw materials only.
     */
    public function rawMaterials(): JsonResponse
    {
        $products = $this->productService->getRawMaterials();

        return response()->json($products);
    }

    /**
     * Get finished goods only.
     */
    public function finishedGoods(): JsonResponse
    {
        $products = $this->productService->getFinishedGoods();

        return response()->json($products);
    }

    /**
     * Activate a product.
     */
    public function activate(Request $request, int $id): JsonResponse
    {
        $product = $this->productService->find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Product not found',
            ], 404);
        }

        if (!$request->user()->hasPermission('products.edit')) {
            return response()->json([
                'message' => 'You do not have permission to modify products.',
            ], 403);
        }

        $updated = $this->productService->activate($product);

        return response()->json([
            'message' => 'Product activated successfully',
            'product' => $updated,
        ]);
    }

    /**
     * Deactivate a product.
     */
    public function deactivate(Request $request, int $id): JsonResponse
    {
        $product = $this->productService->find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Product not found',
            ], 404);
        }

        if (!$request->user()->hasPermission('products.edit')) {
            return response()->json([
                'message' => 'You do not have permission to modify products.',
            ], 403);
        }

        $updated = $this->productService->deactivate($product);

        return response()->json([
            'message' => 'Product deactivated successfully',
            'product' => $updated,
        ]);
    }

    /**
     * Delete all products (bulk delete).
     */
    public function deleteAll(Request $request): JsonResponse
    {
        // Check permission
        if (!$request->user()->hasPermission('products.delete')) {
            return response()->json([
                'message' => 'You do not have permission to delete products.',
            ], 403);
        }

        try {
            $reason = $request->input('reason', 'Bulk delete all products');
            $count = $this->productService->deleteAll($reason);

            return response()->json([
                'message' => "Successfully deleted {$count} products",
                'deleted_count' => $count,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Bulk delete selected products.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        // Check permission
        if (!$request->user()->hasPermission('products.delete')) {
            return response()->json([
                'message' => 'You do not have permission to delete products.',
            ], 403);
        }

        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return response()->json([
                'message' => 'No products selected for deletion.',
            ], 422);
        }

        try {
            $reason = $request->input('reason', 'Bulk delete selected products');
            $result = $this->productService->bulkDelete($ids, $reason);

            return response()->json([
                'message' => "Successfully deleted {$result['deleted']} products",
                'deleted_count' => $result['deleted'],
                'failed_count' => $result['failed'],
                'errors' => $result['errors'] ?? [],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
