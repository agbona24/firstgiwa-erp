<?php

namespace App\Http\Controllers\API\Settings;

use App\Http\Controllers\Controller;
use App\Models\Printer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PrinterController extends Controller
{
    private function tenantId(): int
    {
        return Auth::user()->tenant_id;
    }

    public function index(): JsonResponse
    {
        $printers = Printer::where('tenant_id', $this->tenantId())
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'data' => $printers]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:100',
            'type'            => 'required|in:thermal,inkjet,laser,pdf',
            'connection_type' => 'required|in:usb,network,browser',
            'network_ip'      => 'nullable|ip',
            'network_port'    => 'nullable|integer|min:1|max:65535',
            'usb_path'        => 'nullable|string|max:255',
            'is_default'      => 'boolean',
        ]);

        $tenantId = $this->tenantId();

        if (!empty($validated['is_default'])) {
            Printer::where('tenant_id', $tenantId)->update(['is_default' => false]);
        }

        $printer = Printer::create(array_merge($validated, ['tenant_id' => $tenantId]));

        return response()->json(['success' => true, 'data' => $printer, 'message' => 'Printer added successfully'], 201);
    }

    public function update(Request $request, Printer $printer): JsonResponse
    {
        if ($printer->tenant_id !== $this->tenantId()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name'            => 'sometimes|string|max:100',
            'type'            => 'sometimes|in:thermal,inkjet,laser,pdf',
            'connection_type' => 'sometimes|in:usb,network,browser',
            'network_ip'      => 'nullable|ip',
            'network_port'    => 'nullable|integer|min:1|max:65535',
            'usb_path'        => 'nullable|string|max:255',
            'is_default'      => 'boolean',
            'is_active'       => 'boolean',
        ]);

        if (!empty($validated['is_default'])) {
            Printer::where('tenant_id', $this->tenantId())
                ->where('id', '!=', $printer->id)
                ->update(['is_default' => false]);
        }

        $printer->update($validated);

        return response()->json(['success' => true, 'data' => $printer, 'message' => 'Printer updated']);
    }

    public function destroy(Printer $printer): JsonResponse
    {
        if ($printer->tenant_id !== $this->tenantId()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $printer->delete();

        return response()->json(['success' => true, 'message' => 'Printer deleted']);
    }

    /**
     * Test print — returns a test receipt payload the frontend can render/print
     */
    public function test(Printer $printer): JsonResponse
    {
        if ($printer->tenant_id !== $this->tenantId()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Test print data generated. Use the browser print dialog to send to your printer.',
            'printer' => $printer,
        ]);
    }
}
