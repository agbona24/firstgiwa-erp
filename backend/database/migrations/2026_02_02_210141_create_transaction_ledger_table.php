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
        Schema::create('transaction_ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            $table->string('transaction_number')->unique();
            $table->date('transaction_date');
            $table->string('transaction_type'); // sale, purchase, payment, expense, refund, adjustment, transfer
            $table->string('reference_type'); // sales_order, purchase_order, payment, expense, etc.
            $table->bigInteger('reference_id')->nullable();
            
            // Account details
            $table->string('account_code');
            $table->string('account_name');
            $table->string('account_type'); // asset, liability, equity, revenue, expense
            
            // Double entry
            $table->string('entry_type'); // debit, credit
            $table->decimal('amount', 15, 2);
            
            // Metadata
            $table->string('description')->nullable();
            $table->string('currency', 3)->default('NGN');
            $table->decimal('exchange_rate', 10, 4)->default(1);
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            
            $table->timestamps();
            
            $table->index('tenant_id');
            $table->index('branch_id');
            $table->index('transaction_number');
            $table->index('transaction_date');
            $table->index(['reference_type', 'reference_id']);
            $table->index('account_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction_ledger');
    }
};
