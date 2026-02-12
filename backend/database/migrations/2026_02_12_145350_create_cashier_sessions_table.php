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
        Schema::create('cashier_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->comment('Cashier user');
            $table->foreignId('branch_id')->constrained()->comment('Branch/location');
            
            // Session identification
            $table->string('session_number')->unique();
            $table->string('terminal_id')->nullable()->comment('POS terminal identifier');
            
            // Timing
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            
            // Cash management
            $table->decimal('opening_cash', 15, 2)->default(0);
            $table->decimal('closing_cash', 15, 2)->nullable();
            $table->decimal('expected_cash', 15, 2)->nullable();
            $table->decimal('cash_variance', 15, 2)->nullable();
            
            // Sales summary (calculated on close)
            $table->integer('total_transactions')->default(0);
            $table->decimal('total_sales', 15, 2)->default(0);
            $table->decimal('cash_sales', 15, 2)->default(0);
            $table->decimal('card_sales', 15, 2)->default(0);
            $table->decimal('transfer_sales', 15, 2)->default(0);
            $table->decimal('total_refunds', 15, 2)->default(0);
            
            // Status
            $table->enum('status', ['active', 'closed', 'reconciled'])->default('active');
            $table->text('notes')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('users');
            
            $table->timestamps();
            
            // Indexes
            $table->index(['tenant_id', 'user_id', 'status']);
            $table->index(['tenant_id', 'branch_id', 'opened_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cashier_sessions');
    }
};
