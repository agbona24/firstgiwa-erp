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
        Schema::create('product_unit_conversions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('from_unit_id')->constrained('units')->onDelete('cascade');
            $table->foreignId('to_unit_id')->constrained('units')->onDelete('cascade');
            $table->decimal('conversion_factor', 15, 4); // 1 from_unit = X to_unit
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique(['product_id', 'from_unit_id', 'to_unit_id']);
            $table->index('tenant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_unit_conversions');
    }
};
