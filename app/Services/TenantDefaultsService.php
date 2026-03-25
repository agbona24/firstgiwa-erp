<?php

namespace App\Services;

use App\Models\CreditFacilityType;
use App\Models\SaleCategory;
use Illuminate\Support\Facades\DB;

class TenantDefaultsService
{
    /**
     * Seed all default settings for a newly created tenant.
     */
    public static function seedForTenant(int $tenantId): void
    {
        static::seedCreditFacilityTypes($tenantId);
        static::seedSaleCategories($tenantId);
    }

    // -------------------------------------------------------------------------
    // Credit Facility Types
    // -------------------------------------------------------------------------

    public static function seedCreditFacilityTypes(int $tenantId): void
    {
        $defaults = [
            [
                'name'               => 'Standard Trade Credit',
                'code'               => 'STC-30',
                'default_limit'      => 2000000,
                'max_limit'          => 5000000,
                'payment_terms'      => 30,
                'payment_terms_unit' => 'days',
                'interest_rate'      => 0,
                'grace_period'       => 0,
                'grace_period_unit'  => 'days',
                'description'        => 'Standard credit for regular trade customers with 30-day payment terms.',
                'is_active'          => true,
            ],
            [
                'name'               => 'Premium Credit',
                'code'               => 'PRM-60',
                'default_limit'      => 5000000,
                'max_limit'          => 20000000,
                'payment_terms'      => 60,
                'payment_terms_unit' => 'days',
                'interest_rate'      => 2.5,
                'grace_period'       => 7,
                'grace_period_unit'  => 'days',
                'description'        => 'Premium credit facility for established customers with higher limits and extended terms.',
                'is_active'          => true,
            ],
            [
                'name'               => 'Distributor Credit',
                'code'               => 'DST-45',
                'default_limit'      => 10000000,
                'max_limit'          => 50000000,
                'payment_terms'      => 45,
                'payment_terms_unit' => 'days',
                'interest_rate'      => 1.5,
                'grace_period'       => 5,
                'grace_period_unit'  => 'days',
                'description'        => 'High-volume credit facility for distributors and major retail partners.',
                'is_active'          => true,
            ],
            [
                'name'               => 'Short-Term Facility',
                'code'               => 'STF-14',
                'default_limit'      => 1000000,
                'max_limit'          => 3000000,
                'payment_terms'      => 2,
                'payment_terms_unit' => 'weeks',
                'interest_rate'      => 0,
                'grace_period'       => 0,
                'grace_period_unit'  => 'days',
                'description'        => 'Quick turnaround credit for urgent orders with 2-week payment terms.',
                'is_active'          => true,
            ],
            [
                'name'               => 'Monthly Credit',
                'code'               => 'MTC-30',
                'default_limit'      => 3000000,
                'max_limit'          => 10000000,
                'payment_terms'      => 1,
                'payment_terms_unit' => 'months',
                'interest_rate'      => 1.0,
                'grace_period'       => 3,
                'grace_period_unit'  => 'days',
                'description'        => 'Monthly billing cycle credit facility for consistent ordering customers.',
                'is_active'          => true,
            ],
            [
                'name'               => 'Quarterly Credit',
                'code'               => 'QTC-90',
                'default_limit'      => 15000000,
                'max_limit'          => 100000000,
                'payment_terms'      => 3,
                'payment_terms_unit' => 'months',
                'interest_rate'      => 3.0,
                'grace_period'       => 2,
                'grace_period_unit'  => 'weeks',
                'description'        => 'Extended quarterly credit for large enterprise customers.',
                'is_active'          => true,
            ],
        ];

        foreach ($defaults as $type) {
            // Use a tenant-scoped unique code so multiple tenants can each have 'STC-30'
            $tenantCode = $type['code'] . '-T' . $tenantId;
            CreditFacilityType::firstOrCreate(
                ['tenant_id' => $tenantId, 'code' => $tenantCode],
                array_merge($type, ['tenant_id' => $tenantId, 'code' => $tenantCode])
            );
        }
    }

    // -------------------------------------------------------------------------
    // Sale Categories
    // -------------------------------------------------------------------------

    public static function seedSaleCategories(int $tenantId): void
    {
        $defaults = ['2mm', '3mm', '4mm', '5mm', '6mm'];

        foreach ($defaults as $name) {
            SaleCategory::firstOrCreate(
                ['tenant_id' => $tenantId, 'name' => $name],
                ['tenant_id' => $tenantId, 'name' => $name, 'is_active' => true]
            );
        }
    }
}
