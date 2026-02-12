<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CustomerService;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Requests\Customer\UpdateCreditRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CustomerController extends Controller
{
    protected $customerService;

    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }

    /**
     * List customers
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'customer_type', 'is_active', 'credit_blocked', 'credit_only', 'sort_by', 'sort_dir']);
        $perPage = $request->get('per_page', 15);

        $customers = $this->customerService->list($filters, $perPage);

        return response()->json($customers);
    }

    /**
     * Store a new customer
     */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = $this->customerService->create($request->validated());

        return response()->json([
            'message' => 'Customer created successfully',
            'data' => $customer,
        ], 201);
    }

    /**
     * Show customer details
     */
    public function show(int $id): JsonResponse
    {
        $customer = $this->customerService->find($id);

        return response()->json(['data' => $customer]);
    }

    /**
     * Update customer
     */
    public function update(UpdateCustomerRequest $request, int $id): JsonResponse
    {
        $customer = $this->customerService->update($id, $request->validated());

        return response()->json([
            'message' => 'Customer updated successfully',
            'data' => $customer,
        ]);
    }

    /**
     * Delete customer
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $reason = $request->input('reason', 'Customer deleted');
        $this->customerService->delete($id, $reason);

        return response()->json([
            'message' => 'Customer deleted successfully',
        ]);
    }

    /**
     * Update credit facility
     */
    public function updateCredit(UpdateCreditRequest $request, int $id): JsonResponse
    {
        $customer = $this->customerService->updateCreditFacility(
            $id,
            $request->validated(),
            $request->input('reason', 'Credit facility updated')
        );

        return response()->json([
            'message' => 'Credit facility updated successfully',
            'data' => $customer,
        ]);
    }

    /**
     * Block or unblock credit
     */
    public function toggleCreditBlock(Request $request, int $id): JsonResponse
    {
        $block = $request->boolean('block');
        $reason = $request->input('reason', $block ? 'Credit blocked' : 'Credit unblocked');

        $customer = $this->customerService->toggleCreditBlock($id, $block, $reason);

        return response()->json([
            'message' => $block ? 'Credit blocked successfully' : 'Credit unblocked successfully',
            'data' => $customer,
        ]);
    }

    /**
     * Get credit summary
     */
    public function creditSummary(int $id): JsonResponse
    {
        $summary = $this->customerService->getCreditSummary($id);

        return response()->json(['data' => $summary]);
    }

    /**
     * Get credit alerts
     */
    public function creditAlerts(): JsonResponse
    {
        $alerts = $this->customerService->getCreditAlerts();

        return response()->json(['data' => $alerts]);
    }

    /**
     * Check if customer can make credit purchase
     */
    public function checkCredit(Request $request, int $id): JsonResponse
    {
        $amount = $request->input('amount');
        $result = $this->customerService->canMakeCreditPurchase($id, $amount);

        return response()->json(['data' => $result]);
    }
}
