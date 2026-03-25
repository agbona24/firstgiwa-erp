<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Split the single customer_type column into:
     *   - customer_category: who the customer is (retail, wholesale, distributor, walk_in, other)
     *   - customer_type:     how they pay (cash, credit, both)
     */
    public function up(): void
    {
        // Step 1: Add customer_category column alongside existing customer_type
        Schema::table('customers', function (Blueprint $table) {
            $table->enum('customer_category', ['retail', 'wholesale', 'distributor', 'walk_in', 'other'])
                ->default('retail')
                ->after('customer_type');
        });

        // Step 2: Populate customer_category from existing customer_type values
        DB::statement("
            UPDATE customers SET customer_category = CASE
                WHEN customer_type = 'wholesale'   THEN 'wholesale'
                WHEN customer_type = 'retail'      THEN 'retail'
                WHEN customer_type = 'distributor' THEN 'distributor'
                ELSE 'retail'
            END
        ");

        // Step 3: Set payment type for previously category-based rows
        //         wholesale / retail / distributor had no explicit payment type → default to cash
        DB::statement("
            UPDATE customers
            SET customer_type = 'cash'
            WHERE customer_type IN ('wholesale', 'retail', 'distributor')
        ");

        // Step 4: Narrow the customer_type enum to payment types only
        DB::statement("
            ALTER TABLE customers
            MODIFY COLUMN customer_type ENUM('cash', 'credit', 'both') NOT NULL DEFAULT 'cash'
        ");
    }

    public function down(): void
    {
        // Widen enum back to include old category values
        DB::statement("
            ALTER TABLE customers
            MODIFY COLUMN customer_type ENUM('cash', 'credit', 'both', 'wholesale', 'retail', 'distributor') NOT NULL DEFAULT 'cash'
        ");

        // Restore category-based customer_type values from customer_category
        DB::statement("
            UPDATE customers
            SET customer_type = customer_category
            WHERE customer_category IN ('wholesale', 'retail', 'distributor')
        ");

        // Drop the customer_category column
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('customer_category');
        });
    }
};
