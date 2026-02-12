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
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('name'); // e.g., Kilograms, Litres, Bags
            $table->string('abbreviation'); // e.g., kg, L, bags
            $table->string('type')->default('weight'); // weight, volume, count, package
            $table->boolean('is_base_unit')->default(false); // Is this the base unit for conversions
            $table->decimal('base_conversion_factor', 15, 4)->nullable(); // Conversion to base unit
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('tenant_id');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
