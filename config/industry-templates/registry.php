<?php

/**
 * Industry Template Registry
 *
 * Master index of all available industry categories and sub-categories.
 * Each subcategory has a 'template' key that maps to a config file
 * under config/industry-templates/{template}.php
 *
 * Set template to null for "Coming Soon" entries.
 */

return [
    'agro' => [
        'label' => 'Agro & Agriculture',
        'description' => 'Agricultural processing, farming & feed production',
        'icon' => 'leaf',
        'subcategories' => [
            'feed_mill' => [
                'label' => 'Feed Mill',
                'description' => 'Animal feed production, milling & pelleting',
                'template' => 'feed_mill',
            ],
            'poultry_farm' => [
                'label' => 'Poultry Farm',
                'description' => 'Poultry farming & egg production',
                'template' => null,
            ],
            'crop_processing' => [
                'label' => 'Crop Processing',
                'description' => 'Grain milling, rice processing & crop handling',
                'template' => null,
            ],
            'fish_farm' => [
                'label' => 'Fish Farm',
                'description' => 'Aquaculture & fish processing',
                'template' => null,
            ],
            'livestock' => [
                'label' => 'Livestock',
                'description' => 'Cattle, goat & pig farming',
                'template' => null,
            ],
        ],
    ],

    'manufacturing' => [
        'label' => 'Manufacturing',
        'description' => 'Production, assembly & industrial operations',
        'icon' => 'factory',
        'subcategories' => [
            'food_beverage' => [
                'label' => 'Food & Beverage',
                'description' => 'Food production & beverage manufacturing',
                'template' => null,
            ],
            'textiles' => [
                'label' => 'Textiles & Garments',
                'description' => 'Fabric production & clothing manufacturing',
                'template' => null,
            ],
            'plastics' => [
                'label' => 'Plastics & Packaging',
                'description' => 'Plastic products & packaging materials',
                'template' => null,
            ],
            'general' => [
                'label' => 'General Manufacturing',
                'description' => 'General production & assembly',
                'template' => null,
            ],
        ],
    ],

    'retail' => [
        'label' => 'Retail & Distribution',
        'description' => 'Stores, distribution & wholesale operations',
        'icon' => 'store',
        'subcategories' => [
            'general_store' => [
                'label' => 'General Store',
                'description' => 'General retail & supermarket',
                'template' => null,
            ],
            'pharmacy' => [
                'label' => 'Pharmacy',
                'description' => 'Pharmaceutical retail & wholesale',
                'template' => null,
            ],
            'fmcg' => [
                'label' => 'FMCG Distribution',
                'description' => 'Fast-moving consumer goods distribution',
                'template' => null,
            ],
            'building_materials' => [
                'label' => 'Building Materials',
                'description' => 'Construction materials & hardware',
                'template' => null,
            ],
        ],
    ],

    'services' => [
        'label' => 'Services',
        'description' => 'Logistics, hospitality & professional services',
        'icon' => 'briefcase',
        'subcategories' => [
            'logistics' => [
                'label' => 'Logistics & Transport',
                'description' => 'Haulage, warehousing & transport services',
                'template' => null,
            ],
            'hospitality' => [
                'label' => 'Hospitality',
                'description' => 'Hotels, restaurants & event management',
                'template' => null,
            ],
        ],
    ],
];
