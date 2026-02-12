<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->enum('inventory_type', ['raw_material', 'finished_good', 'consumable', 'packaging'])
                ->default('finished_good')
                ->after('category_id');
            $table->string('secondary_unit', 20)->nullable()->after('unit_of_measure');
            $table->decimal('conversion_factor', 10, 4)->nullable()->after('secondary_unit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['inventory_type', 'secondary_unit', 'conversion_factor']);
        });
    }
};
