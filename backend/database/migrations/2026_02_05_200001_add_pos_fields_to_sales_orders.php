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
        Schema::table('sales_orders', function (Blueprint $table) {
            // Add tenant_id and branch_id for multi-tenancy if not exists
            if (!Schema::hasColumn('sales_orders', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            }
            if (!Schema::hasColumn('sales_orders', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained()->onDelete('cascade');
            }
            
            // Add order_type for POS vs regular orders
            if (!Schema::hasColumn('sales_orders', 'order_type')) {
                $table->enum('order_type', ['regular', 'pos', 'online'])->default('regular')->after('order_number');
            }
            
            // Add payment_status
            if (!Schema::hasColumn('sales_orders', 'payment_status')) {
                $table->enum('payment_status', ['pending', 'partial', 'paid', 'refunded'])->default('pending')->after('status');
            }
            
            // Add discount_type and discount_value
            if (!Schema::hasColumn('sales_orders', 'discount_type')) {
                $table->enum('discount_type', ['percentage', 'fixed'])->default('fixed')->after('subtotal');
            }
            if (!Schema::hasColumn('sales_orders', 'discount_value')) {
                $table->decimal('discount_value', 15, 2)->default(0)->after('discount_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
            $table->dropColumn(['order_type', 'payment_status', 'discount_type', 'discount_value']);
        });
    }
};
