<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add wallet balance to customers
        Schema::table('customers', function (Blueprint $table) {
            $table->decimal('wallet_balance', 15, 2)->default(0)->after('outstanding_balance');
        });

        // Wallet transaction log
        Schema::create('customer_wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->string('reference')->unique();
            $table->enum('type', ['deposit', 'purchase', 'refund', 'adjustment']);
            $table->decimal('amount', 15, 2);          // always positive
            $table->decimal('balance_before', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->string('payment_method')->nullable();
            $table->foreignId('bank_account_id')->nullable()->constrained()->onDelete('set null');
            $table->string('payment_reference')->nullable();
            $table->foreignId('sales_order_id')->nullable()->constrained()->onDelete('set null');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index('customer_id');
            $table->index('tenant_id');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_wallet_transactions');
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('wallet_balance');
        });
    }
};
