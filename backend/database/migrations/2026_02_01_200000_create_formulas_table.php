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
        Schema::create('formulas', function (Blueprint $table) {
            $table->id();
            $table->string('formula_code')->unique();
            $table->string('name');
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('cascade'); // null = general formula
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('usage_count')->default(0);
            $table->timestamp('last_used_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('formula_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('formula_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('restrict');
            $table->decimal('percentage', 5, 2); // e.g. 55.50 for 55.5%
            $table->integer('sequence')->default(0);
            $table->timestamps();

            $table->unique(['formula_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('formula_items');
        Schema::dropIfExists('formulas');
    }
};
