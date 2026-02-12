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
        Schema::create('production_run_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_run_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('restrict'); // Raw material
            $table->decimal('planned_quantity', 15, 2); // From formula
            $table->decimal('actual_quantity', 15, 2); // Actually used
            $table->decimal('variance', 15, 2)->default(0); // actual - planned
            $table->string('unit_of_measure');
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0); // actual_quantity * unit_cost
            $table->string('batch_number')->nullable();
            $table->timestamps();
            
            $table->index('production_run_id');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_run_items');
    }
};
