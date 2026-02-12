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
        Schema::create('production_losses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_run_id')->constrained()->onDelete('cascade');
            $table->string('loss_type'); // wastage, spillage, quality_rejection, evaporation, contamination
            $table->decimal('quantity_lost', 15, 2);
            $table->string('unit_of_measure');
            $table->decimal('estimated_value', 15, 2)->default(0);
            $table->text('reason')->nullable();
            $table->text('corrective_action')->nullable();
            $table->foreignId('reported_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();
            
            $table->index('production_run_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_losses');
    }
};
