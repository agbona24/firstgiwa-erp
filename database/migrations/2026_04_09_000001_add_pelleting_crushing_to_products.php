<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('has_pelleting_crushing')->default(false)->after('track_inventory');
            $table->decimal('pelleting_price_per_unit', 15, 2)->default(0)->after('has_pelleting_crushing');
            $table->decimal('crushing_price_per_unit', 15, 2)->default(0)->after('pelleting_price_per_unit');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['has_pelleting_crushing', 'pelleting_price_per_unit', 'crushing_price_per_unit']);
        });
    }
};
