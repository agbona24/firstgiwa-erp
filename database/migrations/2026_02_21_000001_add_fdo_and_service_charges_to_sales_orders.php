<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add FDO (Field Dispatch Officer) to sales_orders
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->string('fdo_officer')->nullable()->after('notes');
        });

        // Add service item support to sales_order_items
        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->enum('item_type', ['product', 'service'])->default('product')->after('sales_order_id');
            $table->string('service_name')->nullable()->after('item_type');
        });

        // Make product_id nullable so service items (CRUSHING, PELLETING) don't need a product
        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->unsignedBigInteger('product_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropColumn('fdo_officer');
        });

        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->dropColumn(['item_type', 'service_name']);
            $table->unsignedBigInteger('product_id')->nullable(false)->change();
        });
    }
};
