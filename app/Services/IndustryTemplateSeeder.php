<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Seeds industry-specific data (categories, units, products, warehouses, departments)
 * for a tenant based on a template config file.
 *
 * Templates are stored in config/industry-templates/{key}.php
 */
class IndustryTemplateSeeder
{
    /**
     * Get the industry registry (categories and subcategories).
     */
    public static function getRegistry(): array
    {
        return config('industry-templates.registry', []);
    }

    /**
     * Get a specific industry template.
     */
    public static function getTemplate(string $key): ?array
    {
        return config("industry-templates.{$key}");
    }

    /**
     * Resolve the template key from industry category and subcategory.
     */
    public static function resolveTemplateKey(?string $category, ?string $subcategory): ?string
    {
        if (!$category || !$subcategory) {
            return null;
        }

        $registry = self::getRegistry();
        $cat = $registry[$category] ?? null;
        if (!$cat) {
            return null;
        }

        $sub = $cat['subcategories'][$subcategory] ?? null;
        return $sub['template'] ?? null;
    }

    /**
     * Seed all template data for a tenant.
     *
     * @return array{seeded: bool, stats: array}
     */
    public function seed(int $tenantId, int $branchId, string $templateKey): array
    {
        $template = self::getTemplate($templateKey);
        if (!$template) {
            return ['seeded' => false, 'reason' => 'Template not found'];
        }

        $stats = [
            'categories' => 0,
            'units' => 0,
            'products' => 0,
            'warehouses' => 0,
            'departments' => 0,
        ];

        // Order matters: units and categories before products, warehouses before inventory
        $stats['units'] = $this->seedUnits($tenantId, $template['units'] ?? []);
        $categoryMap = $this->seedCategories($tenantId, $template['categories'] ?? []);
        $stats['categories'] = count($categoryMap);

        $warehouseIds = $this->seedWarehouses($tenantId, $branchId, $template['warehouses'] ?? []);
        $stats['warehouses'] = count($warehouseIds);

        $stats['departments'] = $this->seedDepartments($tenantId, $template['departments'] ?? []);
        $stats['products'] = $this->seedProducts($tenantId, $template['products'] ?? [], $categoryMap, $warehouseIds);

        return ['seeded' => true, 'stats' => $stats];
    }

    /**
     * Seed product categories. Returns a code => id map.
     */
    private function seedCategories(int $tenantId, array $categories): array
    {
        $map = [];

        foreach ($categories as $idx => $cat) {
            $code = $cat['code'] . '-' . $tenantId;

            $id = DB::table('categories')->insertGetId([
                'tenant_id' => $tenantId,
                'name' => $cat['name'],
                'code' => $code,
                'parent_id' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $map[$cat['code']] = $id;
        }

        return $map;
    }

    /**
     * Seed units of measure.
     */
    private function seedUnits(int $tenantId, array $units): int
    {
        $count = 0;

        foreach ($units as $unit) {
            DB::table('units')->insert([
                'tenant_id' => $tenantId,
                'name' => $unit['name'],
                'abbreviation' => $unit['abbreviation'],
                'type' => $unit['type'] ?? 'weight',
                'is_base_unit' => $unit['is_base_unit'] ?? false,
                'base_conversion_factor' => $unit['base_conversion_factor'] ?? null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $count++;
        }

        return $count;
    }

    /**
     * Seed warehouses. Returns array of warehouse IDs.
     */
    private function seedWarehouses(int $tenantId, int $branchId, array $warehouses): array
    {
        $ids = [];

        if (empty($warehouses)) {
            $id = DB::table('warehouses')->insertGetId([
                'tenant_id' => $tenantId,
                'branch_id' => $branchId,
                'name' => 'Main Warehouse',
                'code' => 'WH-' . $tenantId . '-MAIN',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $ids[] = $id;
            return $ids;
        }

        foreach ($warehouses as $wh) {
            $id = DB::table('warehouses')->insertGetId([
                'tenant_id' => $tenantId,
                'branch_id' => $branchId,
                'name' => $wh['name'],
                'code' => 'WH-' . $tenantId . '-' . $wh['code_suffix'],
                'location' => $wh['type'] ?? null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $ids[] = $id;
        }

        return $ids;
    }

    /**
     * Seed departments.
     */
    private function seedDepartments(int $tenantId, array $departments): int
    {
        $count = 0;

        foreach ($departments as $dept) {
            DB::table('departments')->insert([
                'tenant_id' => $tenantId,
                'name' => $dept['name'],
                'code' => $dept['code'] ?? null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $count++;
        }

        return $count;
    }

    /**
     * Seed products with full data (prices, categories, inventory records).
     */
    private function seedProducts(int $tenantId, array $products, array $categoryMap, array $warehouseIds): int
    {
        $count = 0;
        $skuCounters = []; // Track SKU sequence per prefix

        foreach ($products as $product) {
            $prefix = $product['sku_prefix'] ?? 'RM';

            if (!isset($skuCounters[$prefix])) {
                $skuCounters[$prefix] = 0;
            }
            $skuCounters[$prefix]++;

            $sku = sprintf('%s-%d-%03d', $prefix, $tenantId, $skuCounters[$prefix]);
            $categoryId = $categoryMap[$product['category']] ?? null;
            $trackInventory = $product['track_inventory'] ?? true;

            $productId = DB::table('products')->insertGetId([
                'tenant_id' => $tenantId,
                'sku' => $sku,
                'name' => $product['name'],
                'category_id' => $categoryId,
                'inventory_type' => $product['inventory_type'] ?? 'raw_material',
                'unit_of_measure' => $product['unit'] ?? 'kg',
                'cost_price' => $product['cost_price'] ?? 0,
                'selling_price' => $product['selling_price'] ?? 0,
                'reorder_level' => $product['reorder_level'] ?? 0,
                'critical_level' => $product['critical_level'] ?? 0,
                'is_active' => true,
                'track_inventory' => $trackInventory,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create inventory records in each warehouse (only for tracked items)
            if ($trackInventory) {
                foreach ($warehouseIds as $warehouseId) {
                    DB::table('inventory')->insert([
                        'tenant_id' => $tenantId,
                        'product_id' => $productId,
                        'warehouse_id' => $warehouseId,
                        'quantity' => 0,
                        'reserved_quantity' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            $count++;
        }

        return $count;
    }

    /**
     * Get template data formatted for the frontend wizard preview.
     * Returns names/labels only (not full prices/SKUs).
     */
    public static function getTemplatePreview(string $key): ?array
    {
        $template = self::getTemplate($key);
        if (!$template) {
            return null;
        }

        return [
            'meta' => $template['meta'] ?? [],
            'categories' => array_map(fn($c) => $c['name'], $template['categories'] ?? []),
            'units' => array_map(fn($u) => ['name' => $u['name'], 'abbreviation' => $u['abbreviation']], $template['units'] ?? []),
            'products' => array_map(fn($p) => $p['name'], $template['products'] ?? []),
            'warehouses' => array_map(fn($w) => ['name' => $w['name'], 'type' => $w['type'] ?? 'general'], $template['warehouses'] ?? []),
            'departments' => array_map(fn($d) => ['name' => $d['name'], 'code' => $d['code'] ?? ''], $template['departments'] ?? []),
        ];
    }
}
