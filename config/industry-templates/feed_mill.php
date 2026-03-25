<?php

/**
 * Feed Mill Industry Template
 *
 * Based on First Giwa Feeds operations data.
 * Used by IndustryTemplateSeeder to seed complete product records
 * with real prices, categories, units, and inventory configuration.
 */

return [
    'meta' => [
        'name' => 'Feed Mill',
        'version' => '1.0',
        'description' => 'Animal feed production, milling & pelleting. Based on First Giwa Feeds.',
    ],

    'categories' => [
        ['name' => 'Protein Sources', 'code' => 'PRT'],
        ['name' => 'Energy Sources & Fillers', 'code' => 'ENG'],
        ['name' => 'Minerals & Supplements', 'code' => 'MIN'],
        ['name' => 'Additional Additives', 'code' => 'ADD'],
        ['name' => 'Finished Feeds', 'code' => 'FED'],
        ['name' => 'Packaging Materials', 'code' => 'PKG'],
    ],

    'units' => [
        ['name' => 'Kilogram', 'abbreviation' => 'kg', 'type' => 'weight', 'is_base_unit' => true, 'base_conversion_factor' => null],
        ['name' => 'Tonne', 'abbreviation' => 'tonnes', 'type' => 'weight', 'is_base_unit' => false, 'base_conversion_factor' => 1000],
        ['name' => 'Gram', 'abbreviation' => 'g', 'type' => 'weight', 'is_base_unit' => false, 'base_conversion_factor' => 0.001],
        ['name' => 'Bag (25kg)', 'abbreviation' => 'bag-25kg', 'type' => 'package', 'is_base_unit' => false, 'base_conversion_factor' => 25],
        ['name' => 'Bag (50kg)', 'abbreviation' => 'bag-50kg', 'type' => 'package', 'is_base_unit' => false, 'base_conversion_factor' => 50],
        ['name' => 'Litre', 'abbreviation' => 'litres', 'type' => 'volume', 'is_base_unit' => true, 'base_conversion_factor' => null],
        ['name' => 'Piece', 'abbreviation' => 'pcs', 'type' => 'count', 'is_base_unit' => true, 'base_conversion_factor' => null],
    ],

    'products' => [
        // ============================================================
        // PROTEIN SOURCES
        // ============================================================
        ['name' => 'Fish Meal 60%', 'category' => 'PRT', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 2500, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000],
        ['name' => 'Fishmeal 72%', 'category' => 'PRT', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 1500, 'selling_price' => 0, 'reorder_level' => 3000, 'critical_level' => 1000],
        ['name' => 'Poultry Meal 65%', 'category' => 'PRT', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 620, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000],
        ['name' => 'Feather Meal', 'category' => 'PRT', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 450, 'selling_price' => 0, 'reorder_level' => 3000, 'critical_level' => 1000],
        ['name' => 'Blood Meal', 'category' => 'PRT', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 1700, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800],
        ['name' => 'Meat Meal 55%', 'category' => 'PRT', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 1000, 'selling_price' => 0, 'reorder_level' => 4000, 'critical_level' => 1500],
        ['name' => 'GNC Kano', 'category' => 'PRT', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 480, 'selling_price' => 0, 'reorder_level' => 8000, 'critical_level' => 3000],
        ['name' => 'Roshele', 'category' => 'PRT', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 720, 'selling_price' => 0, 'reorder_level' => 10000, 'critical_level' => 4000],
        ['name' => 'Soya Meal', 'category' => 'PRT', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 800, 'selling_price' => 0, 'reorder_level' => 8000, 'critical_level' => 3000],
        ['name' => 'Local Blood', 'category' => 'PRT', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 600, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800],
        ['name' => 'Imported Bloodmeal', 'category' => 'PRT', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 1700, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800],
        ['name' => 'Ilamu', 'category' => 'PRT', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 1700, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800],

        // ============================================================
        // ENERGY SOURCES & FILLERS
        // ============================================================
        ['name' => 'Cassava Flour', 'category' => 'ENG', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 140, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000],
        ['name' => 'Wheat Flour', 'category' => 'ENG', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 400, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000],
        ['name' => 'Garri', 'category' => 'ENG', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 125, 'selling_price' => 0, 'reorder_level' => 3000, 'critical_level' => 1000],
        ['name' => 'Wheat Offal', 'category' => 'ENG', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 350, 'selling_price' => 0, 'reorder_level' => 8000, 'critical_level' => 3000],
        ['name' => 'PKC', 'category' => 'ENG', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 250, 'selling_price' => 0, 'reorder_level' => 10000, 'critical_level' => 4000],
        ['name' => 'Rice Bran', 'category' => 'ENG', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 80, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000],
        ['name' => 'Cassava Peel', 'category' => 'ENG', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 120, 'selling_price' => 0, 'reorder_level' => 8000, 'critical_level' => 3000],
        ['name' => 'Creeps', 'category' => 'ENG', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 450, 'selling_price' => 0, 'reorder_level' => 3000, 'critical_level' => 1000],
        ['name' => 'Palamu', 'category' => 'ENG', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 300, 'selling_price' => 0, 'reorder_level' => 5000, 'critical_level' => 2000],
        ['name' => 'Soya Oil', 'category' => 'ENG', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'litres', 'cost_price' => 1100, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800],

        // ============================================================
        // MINERALS & SUPPLEMENTS
        // ============================================================
        ['name' => 'Bone Meal', 'category' => 'MIN', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 220, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800],
        ['name' => 'Fish Premix', 'category' => 'MIN', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 600, 'selling_price' => 0, 'reorder_level' => 500, 'critical_level' => 200],
        ['name' => 'Lysine', 'category' => 'MIN', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 1300, 'selling_price' => 0, 'reorder_level' => 300, 'critical_level' => 100],
        ['name' => 'Vit C Powder', 'category' => 'MIN', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 1200, 'selling_price' => 0, 'reorder_level' => 200, 'critical_level' => 50],
        ['name' => 'Vit C Cups', 'category' => 'MIN', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 2400, 'selling_price' => 0, 'reorder_level' => 200, 'critical_level' => 50],
        ['name' => 'Biovit', 'category' => 'MIN', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 800, 'selling_price' => 0, 'reorder_level' => 200, 'critical_level' => 50],
        ['name' => 'Toxin Binder', 'category' => 'MIN', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 2100, 'selling_price' => 0, 'reorder_level' => 200, 'critical_level' => 50],
        ['name' => 'Enzymes', 'category' => 'MIN', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 180, 'selling_price' => 0, 'reorder_level' => 100, 'critical_level' => 30],
        ['name' => 'Salt', 'category' => 'MIN', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 180, 'selling_price' => 0, 'reorder_level' => 1000, 'critical_level' => 400],

        // ============================================================
        // ADDITIONAL ADDITIVES
        // ============================================================
        ['name' => 'Vitranor', 'category' => 'ADD', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 1000, 'selling_price' => 0, 'reorder_level' => 200, 'critical_level' => 50],
        ['name' => 'Cocopops', 'category' => 'ADD', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 450, 'selling_price' => 0, 'reorder_level' => 200, 'critical_level' => 50],
        ['name' => 'Champ Premix', 'category' => 'ADD', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 3700, 'selling_price' => 0, 'reorder_level' => 300, 'critical_level' => 100],
        ['name' => 'Vcnorliq', 'category' => 'ADD', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'kg', 'cost_price' => 1000, 'selling_price' => 0, 'reorder_level' => 200, 'critical_level' => 50],
        ['name' => 'Vcor 100g', 'category' => 'ADD', 'sku_prefix' => 'RM', 'inventory_type' => 'raw_material', 'unit' => 'pcs', 'cost_price' => 1400, 'selling_price' => 0, 'reorder_level' => 200, 'critical_level' => 50],

        // ============================================================
        // FINISHED FEEDS (Pelletized, sold per 25kg bag)
        // ============================================================
        ['name' => 'Giwa Pelletized Feed 2mm (25kg)', 'category' => 'FED', 'sku_prefix' => 'FG', 'inventory_type' => 'finished_good', 'unit' => 'bag-25kg', 'cost_price' => 0, 'selling_price' => 23600, 'reorder_level' => 200, 'critical_level' => 50],
        ['name' => 'Giwa Pelletized Feed 4mm (25kg)', 'category' => 'FED', 'sku_prefix' => 'FG', 'inventory_type' => 'finished_good', 'unit' => 'bag-25kg', 'cost_price' => 0, 'selling_price' => 21900, 'reorder_level' => 200, 'critical_level' => 50],
        ['name' => 'Hope Feed 5mm (25kg)', 'category' => 'FED', 'sku_prefix' => 'FG', 'inventory_type' => 'finished_good', 'unit' => 'bag-25kg', 'cost_price' => 0, 'selling_price' => 16850, 'reorder_level' => 200, 'critical_level' => 50],
        ['name' => 'Giwa Pelletized Feed 6mm (25kg)', 'category' => 'FED', 'sku_prefix' => 'FG', 'inventory_type' => 'finished_good', 'unit' => 'bag-25kg', 'cost_price' => 0, 'selling_price' => 21800, 'reorder_level' => 200, 'critical_level' => 50],

        // ============================================================
        // SERVICE ITEMS (Pelleting & Grinding charges)
        // ============================================================
        ['name' => 'Pelleting Service', 'category' => 'FED', 'sku_prefix' => 'SV', 'inventory_type' => 'consumable', 'unit' => 'kg', 'cost_price' => 0, 'selling_price' => 50, 'reorder_level' => 0, 'critical_level' => 0, 'track_inventory' => false],
        ['name' => 'Grinding Service', 'category' => 'FED', 'sku_prefix' => 'SV', 'inventory_type' => 'consumable', 'unit' => 'kg', 'cost_price' => 0, 'selling_price' => 40, 'reorder_level' => 0, 'critical_level' => 0, 'track_inventory' => false],

        // ============================================================
        // PACKAGING MATERIALS
        // ============================================================
        ['name' => 'Feed Bags (25kg)', 'category' => 'PKG', 'sku_prefix' => 'PK', 'inventory_type' => 'raw_material', 'unit' => 'pcs', 'cost_price' => 120, 'selling_price' => 0, 'reorder_level' => 3000, 'critical_level' => 1000],
        ['name' => 'Feed Bags (50kg)', 'category' => 'PKG', 'sku_prefix' => 'PK', 'inventory_type' => 'raw_material', 'unit' => 'pcs', 'cost_price' => 180, 'selling_price' => 0, 'reorder_level' => 2000, 'critical_level' => 800],
    ],

    'warehouses' => [
        ['name' => 'Raw Material Store', 'code_suffix' => 'RMS', 'type' => 'raw_material'],
        ['name' => 'Finished Goods Store', 'code_suffix' => 'FGS', 'type' => 'finished_good'],
    ],

    'departments' => [
        ['name' => 'Management', 'code' => 'MGT'],
        ['name' => 'Production', 'code' => 'PRD'],
        ['name' => 'Quality Control', 'code' => 'QC'],
        ['name' => 'Warehouse', 'code' => 'WHS'],
        ['name' => 'Sales', 'code' => 'SLS'],
        ['name' => 'Finance', 'code' => 'FIN'],
        ['name' => 'Procurement', 'code' => 'PRC'],
    ],
];
