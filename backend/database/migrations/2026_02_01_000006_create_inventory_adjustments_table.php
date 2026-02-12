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
        Schema::create('inventory_adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('adjustment_number')->unique();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->foreignId('batch_id')->nullable()->constrained('inventory_batches')->onDelete('set null');
            $table->enum('adjustment_type', [
                'loss',             // General loss
                'drying',           // Drying/moisture loss (agro-specific)
                'damage',           // Damaged goods
                'expiry',           // Expired goods
                'count_correction', // Physical count difference
                'theft',            // Theft/missing
                'found',            // Found/recovered stock
                'other',            // Other adjustments
            ]);
            $table->decimal('quantity_change', 15, 3); // Negative for decrease, positive for increase
            $table->decimal('quantity_before', 15, 3);
            $table->decimal('quantity_after', 15, 3);
            $table->decimal('unit_cost', 15, 2)->nullable();
            $table->decimal('total_value_impact', 15, 2)->nullable();
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            
            // Approval workflow
            $table->enum('status', ['draft', 'pending_approval', 'approved', 'rejected'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_notes')->nullable();
            
            $table->timestamps();

            $table->index(['product_id', 'created_at']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_adjustments');
    }
};
