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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->foreignId('batch_id')->nullable()->constrained('inventory_batches')->onDelete('set null');
            $table->enum('movement_type', [
                'purchase_in',      // Stock received from purchase order
                'production_in',    // Finished goods from production
                'production_out',   // Raw materials consumed in production
                'sale_out',         // Stock sold to customer
                'adjustment_in',    // Stock adjustment (increase)
                'adjustment_out',   // Stock adjustment (decrease)
                'transfer_in',      // Stock received from another warehouse
                'transfer_out',     // Stock sent to another warehouse
                'loss',             // Loss due to damage, theft, etc.
                'drying',           // Loss due to drying/moisture loss
                'return_in',        // Customer return
                'return_out',       // Return to supplier
            ]);
            $table->decimal('quantity', 15, 3);
            $table->decimal('unit_cost', 15, 2)->nullable();
            $table->decimal('total_value', 15, 2)->nullable();
            $table->decimal('quantity_before', 15, 3);
            $table->decimal('quantity_after', 15, 3);
            
            // Polymorphic reference to source document
            $table->nullableMorphs('reference'); // e.g., SalesOrder, PurchaseOrder, ProductionRun
            
            // For transfers
            $table->foreignId('from_warehouse_id')->nullable()->constrained('warehouses')->onDelete('set null');
            $table->foreignId('to_warehouse_id')->nullable()->constrained('warehouses')->onDelete('set null');
            
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['product_id', 'created_at']);
            $table->index(['warehouse_id', 'created_at']);
            $table->index('movement_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
