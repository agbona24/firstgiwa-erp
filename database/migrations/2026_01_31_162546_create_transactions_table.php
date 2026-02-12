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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->date('transaction_date');
            $table->string('description');
            $table->enum('category', [
                'sales_revenue',
                'cost_of_goods_sold',
                'operating_expenses',
                'payroll',
                'utilities',
                'rent',
                'other_income',
                'other_expenses'
            ]);
            $table->enum('type', ['revenue', 'expense']);
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->decimal('balance', 15, 2)->default(0);
            $table->nullableMorphs('transactionable'); // Can link to sales_orders, payments, etc
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
