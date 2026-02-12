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
        Schema::create('inventory_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number')->unique();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->date('production_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->decimal('initial_quantity', 15, 3);
            $table->decimal('current_quantity', 15, 3);
            $table->decimal('unit_cost', 15, 2);
            $table->string('source_type')->nullable(); // purchase, production, transfer
            $table->unsignedBigInteger('source_id')->nullable(); // purchase_order_id, production_run_id, etc.
            $table->enum('status', ['active', 'depleted', 'expired', 'quarantine'])->default('active');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['product_id', 'warehouse_id', 'status']);
            $table->index('expiry_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_batches');
    }
};
