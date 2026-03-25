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
        // Charge definitions – managed in Settings
        Schema::create('sale_charges', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('name');                               // e.g. "Transport", "Loading"
            $table->text('description')->nullable();
            $table->enum('amount_type', ['fixed', 'percentage'])->default('fixed');
            $table->decimal('default_amount', 15, 2)->default(0); // fixed amount or % value
            $table->enum('applies_to', ['pos', 'sales_order', 'both'])->default('both');
            $table->boolean('add_to_credit')->default(false);     // auto-add to customer credit on delivery
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // Applied charges per order (POS sale or Sales Order)
        Schema::create('order_charges', function (Blueprint $table) {
            $table->id();
            $table->nullableMorphs('chargeable');                 // sales_order or pos_transaction
            $table->unsignedBigInteger('sale_charge_id')->nullable();
            $table->string('charge_name');
            $table->decimal('charge_amount', 15, 2);
            $table->boolean('add_to_credit')->default(false);
            $table->boolean('credited')->default(false);          // whether it has been added to customer credit
            $table->timestamps();

            $table->foreign('sale_charge_id')->references('id')->on('sale_charges')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_charges');
        Schema::dropIfExists('sale_charges');
    }
};
