<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('printers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('type', ['thermal', 'inkjet', 'laser', 'pdf'])->default('thermal');
            $table->enum('connection_type', ['usb', 'network', 'browser'])->default('browser');
            $table->string('network_ip', 45)->nullable();
            $table->unsignedSmallInteger('network_port')->nullable()->default(9100);
            $table->string('usb_path')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('printers');
    }
};
