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
        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            $table->string('refund_number')->unique();
            $table->foreignId('sales_order_id')->nullable()->constrained()->onDelete('restrict');
            $table->foreignId('original_payment_id')->nullable()->constrained('payments')->onDelete('restrict');
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('restrict');
            $table->decimal('refund_amount', 15, 2);
            $table->string('refund_method'); // cash, bank_transfer, store_credit
            $table->date('refund_date');
            $table->string('reason');
            $table->text('description')->nullable();
            $table->string('status')->default('pending'); // pending, approved, processed, rejected
            
            // Bank refund details
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_name')->nullable();
            $table->string('transaction_reference')->nullable();
            
            $table->foreignId('requested_by')->constrained('users')->onDelete('restrict');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('processed_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('tenant_id');
            $table->index('branch_id');
            $table->index('refund_number');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refunds');
    }
};
