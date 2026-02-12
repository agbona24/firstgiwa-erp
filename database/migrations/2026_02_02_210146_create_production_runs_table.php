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
        Schema::create('production_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            $table->string('production_number')->unique();
            $table->foreignId('formula_id')->constrained()->onDelete('restrict');
            $table->foreignId('finished_product_id')->constrained('products')->onDelete('restrict');
            $table->foreignId('warehouse_id')->constrained()->onDelete('restrict');
            $table->date('production_date');
            $table->decimal('target_quantity', 15, 2); // Target output
            $table->decimal('actual_output', 15, 2)->default(0); // Actual produced
            $table->decimal('wastage_quantity', 15, 2)->default(0);
            $table->decimal('wastage_percentage', 5, 2)->default(0); // Calculated
            $table->string('batch_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('status')->default('planned'); // planned, in_progress, completed, cancelled
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->foreignId('production_line')->nullable()->constrained('branches')->onDelete('set null'); // Could be a specific production line/branch
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->foreignId('completed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('tenant_id');
            $table->index('branch_id');
            $table->index('production_number');
            $table->index('status');
            $table->index('production_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_runs');
    }
};
