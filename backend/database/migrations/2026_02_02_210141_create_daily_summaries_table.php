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
        Schema::create('daily_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            $table->date('summary_date');
            
            // Sales metrics
            $table->integer('sales_count')->default(0);
            $table->decimal('total_sales', 15, 2)->default(0);
            $table->decimal('cash_sales', 15, 2)->default(0);
            $table->decimal('credit_sales', 15, 2)->default(0);
            $table->decimal('sales_returns', 15, 2)->default(0);
            
            // Payments received
            $table->decimal('payments_received', 15, 2)->default(0);
            $table->decimal('cash_received', 15, 2)->default(0);
            $table->decimal('bank_transfers_received', 15, 2)->default(0);
            $table->decimal('card_payments_received', 15, 2)->default(0);
            
            // Purchases & expenses
            $table->integer('purchase_count')->default(0);
            $table->decimal('total_purchases', 15, 2)->default(0);
            $table->decimal('total_expenses', 15, 2)->default(0);
            $table->decimal('payments_made', 15, 2)->default(0);
            
            // Production
            $table->integer('production_runs')->default(0);
            $table->decimal('production_output', 15, 2)->default(0);
            $table->decimal('production_losses', 15, 2)->default(0);
            
            // Inventory
            $table->integer('stock_movements_count')->default(0);
            $table->integer('low_stock_items')->default(0);
            $table->integer('out_of_stock_items')->default(0);
            
            // Cash on hand
            $table->decimal('opening_cash', 15, 2)->default(0);
            $table->decimal('closing_cash', 15, 2)->default(0);
            $table->decimal('expected_cash', 15, 2)->default(0);
            $table->decimal('cash_variance', 15, 2)->default(0);
            
            // Metadata
            $table->boolean('is_reconciled')->default(false);
            $table->foreignId('reconciled_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reconciled_at')->nullable();
            
            $table->timestamps();
            
            $table->unique(['tenant_id', 'branch_id', 'summary_date']);
            $table->index('summary_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_summaries');
    }
};
