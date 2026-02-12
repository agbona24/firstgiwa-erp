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
        Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('code', 20)->unique();
            $table->decimal('rate', 10, 4);
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->enum('applies_to', ['sales', 'purchases', 'both'])->default('sales');
            $table->boolean('is_compound')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
        });

        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('code', 20);
            $table->string('bank_account')->nullable();
            $table->boolean('requires_reference')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'code']);
            $table->index(['tenant_id', 'is_active']);
        });

        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('bank_name');
            $table->string('account_name');
            $table->string('account_number', 50);
            $table->enum('account_type', ['current', 'savings', 'domiciliary'])->default('current');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
        });

        Schema::create('number_sequences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('document'); // Sales Order, Purchase Order, Invoice, etc.
            $table->string('prefix', 20);
            $table->integer('next_number')->default(1);
            $table->integer('padding')->default(4);
            $table->string('separator', 5)->default('-');
            $table->timestamps();

            $table->unique(['tenant_id', 'document']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('number_sequences');
        Schema::dropIfExists('bank_accounts');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('taxes');
    }
};
