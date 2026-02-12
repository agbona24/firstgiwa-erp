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
            $table->enum('payment_type', ['cash', 'credit'])->default('cash')->after('customer_id');
            $table->foreignId('formula_id')->nullable()->constrained()->onDelete('set null')->after('payment_type');
            $table->decimal('credit_available', 15, 2)->nullable()->after('total_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('formula_id');
            $table->dropColumn(['payment_type', 'credit_available']);
        });
    }
};
