<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ApiDocsController extends Controller
{
    public function index()
    {
        return view('api-docs');
    }

    public function spec(): JsonResponse
    {
        $baseUrl = url('/api/v1');

        $schemas = [
            'User' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'name' => ['type' => 'string'],
                    'email' => ['type' => 'string'],
                    'role' => ['type' => 'string'],
                ],
            ],
            'LoginRequest' => [
                'type' => 'object',
                'properties' => [
                    'login_method' => ['type' => 'string', 'enum' => ['password', 'pin']],
                    'email' => ['type' => 'string'],
                    'password' => ['type' => 'string'],
                    'pin' => ['type' => 'string'],
                ],
            ],
            'LoginResponse' => [
                'type' => 'object',
                'properties' => [
                    'message' => ['type' => 'string'],
                    'token' => ['type' => 'string'],
                    'user' => ['$ref' => '#/components/schemas/User'],
                ],
            ],
            'MessageResponse' => [
                'type' => 'object',
                'properties' => [
                    'message' => ['type' => 'string'],
                ],
            ],
            'ValidationErrorResponse' => [
                'type' => 'object',
                'properties' => [
                    'message' => ['type' => 'string'],
                    'errors' => ['type' => 'object', 'additionalProperties' => ['type' => 'array', 'items' => ['type' => 'string']]],
                ],
            ],
            'PaginationLink' => [
                'type' => 'object',
                'properties' => [
                    'url' => ['type' => 'string', 'nullable' => true],
                    'label' => ['type' => 'string'],
                    'active' => ['type' => 'boolean'],
                ],
            ],
            'PaginatedResponseBase' => [
                'type' => 'object',
                'properties' => [
                    'current_page' => ['type' => 'integer'],
                    'data' => ['type' => 'array', 'items' => ['type' => 'object']],
                    'first_page_url' => ['type' => 'string'],
                    'from' => ['type' => 'integer', 'nullable' => true],
                    'last_page' => ['type' => 'integer'],
                    'last_page_url' => ['type' => 'string'],
                    'links' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/PaginationLink']],
                    'next_page_url' => ['type' => 'string', 'nullable' => true],
                    'path' => ['type' => 'string'],
                    'per_page' => ['type' => 'integer'],
                    'prev_page_url' => ['type' => 'string', 'nullable' => true],
                    'to' => ['type' => 'integer', 'nullable' => true],
                    'total' => ['type' => 'integer'],
                ],
            ],
            'Product' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'name' => ['type' => 'string'],
                    'sku' => ['type' => 'string'],
                    'price' => ['type' => 'number'],
                ],
            ],
            'Category' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'name' => ['type' => 'string'],
                ],
            ],
            'Warehouse' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'name' => ['type' => 'string'],
                    'code' => ['type' => 'string'],
                    'location' => ['type' => 'string'],
                ],
            ],
            'Customer' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'name' => ['type' => 'string'],
                    'email' => ['type' => 'string'],
                    'phone' => ['type' => 'string'],
                ],
            ],
            'Supplier' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'name' => ['type' => 'string'],
                    'email' => ['type' => 'string'],
                    'phone' => ['type' => 'string'],
                ],
            ],
            'SalesOrder' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'so_number' => ['type' => 'string'],
                    'status' => ['type' => 'string'],
                    'total' => ['type' => 'number'],
                ],
            ],
            'PurchaseOrder' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'po_number' => ['type' => 'string'],
                    'status' => ['type' => 'string'],
                    'total' => ['type' => 'number'],
                ],
            ],
            'Payment' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'amount' => ['type' => 'number'],
                    'status' => ['type' => 'string'],
                ],
            ],
            'Expense' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'amount' => ['type' => 'number'],
                    'status' => ['type' => 'string'],
                ],
            ],
            'Production' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'code' => ['type' => 'string'],
                    'status' => ['type' => 'string'],
                ],
            ],
            'AuditLog' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'action' => ['type' => 'string'],
                    'user_id' => ['type' => 'integer'],
                    'created_at' => ['type' => 'string'],
                ],
            ],
            'Staff' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'name' => ['type' => 'string'],
                    'email' => ['type' => 'string'],
                ],
            ],
            'Payroll' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'period' => ['type' => 'string'],
                    'status' => ['type' => 'string'],
                ],
            ],
            'Tax' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'name' => ['type' => 'string'],
                    'code' => ['type' => 'string'],
                    'rate' => ['type' => 'number'],
                    'type' => ['type' => 'string'],
                    'applies_to' => ['type' => 'string'],
                    'is_compound' => ['type' => 'boolean'],
                    'is_active' => ['type' => 'boolean'],
                ],
            ],
            'PaymentMethod' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'name' => ['type' => 'string'],
                    'code' => ['type' => 'string'],
                    'bank_account' => ['type' => 'string'],
                    'requires_reference' => ['type' => 'boolean'],
                    'is_active' => ['type' => 'boolean'],
                ],
            ],
            'BankAccount' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'bank_name' => ['type' => 'string'],
                    'account_number' => ['type' => 'string'],
                    'account_name' => ['type' => 'string'],
                    'is_default' => ['type' => 'boolean'],
                    'is_active' => ['type' => 'boolean'],
                ],
            ],
            'NumberSequence' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'document' => ['type' => 'string'],
                    'prefix' => ['type' => 'string'],
                    'next_number' => ['type' => 'integer'],
                    'padding' => ['type' => 'integer'],
                    'is_active' => ['type' => 'boolean'],
                ],
            ],
            'InventorySettings' => [
                'type' => 'object',
                'properties' => [
                    'default_warehouse' => ['type' => 'string'],
                    'sku_prefix_raw' => ['type' => 'string'],
                    'sku_prefix_finished' => ['type' => 'string'],
                    'auto_generate_sku' => ['type' => 'boolean'],
                    'enable_batch_tracking' => ['type' => 'boolean'],
                    'enable_expiry_tracking' => ['type' => 'boolean'],
                    'drying_loss_tolerance' => ['type' => 'number'],
                    'low_stock_threshold' => ['type' => 'integer'],
                    'critical_stock_threshold' => ['type' => 'integer'],
                ],
            ],
            'SalesSettings' => [
                'type' => 'object',
                'properties' => [
                    'invoice_prefix' => ['type' => 'string'],
                    'invoice_next_number' => ['type' => 'integer'],
                    'receipt_prefix' => ['type' => 'string'],
                    'default_payment_terms' => ['type' => 'integer'],
                    'credit_enforcement' => ['type' => 'boolean'],
                    'global_credit_limit' => ['type' => 'number'],
                    'allow_partial_payments' => ['type' => 'boolean'],
                    'invoice_footer' => ['type' => 'string'],
                    'currency' => ['type' => 'string'],
                    'currency_symbol' => ['type' => 'string'],
                ],
            ],
            'BackupSettings' => [
                'type' => 'object',
                'properties' => [
                    'auto_backup_enabled' => ['type' => 'boolean'],
                    'backup_frequency' => ['type' => 'string'],
                    'backup_time' => ['type' => 'string'],
                    'backup_retention_days' => ['type' => 'integer'],
                    'backup_to_cloud' => ['type' => 'boolean'],
                    'cloud_provider' => ['type' => 'string'],
                    'last_backup_at' => ['type' => 'string', 'nullable' => true],
                    'last_backup_size' => ['type' => 'integer', 'nullable' => true],
                ],
            ],
            'ApiSettings' => [
                'type' => 'object',
                'properties' => [
                    'api_enabled' => ['type' => 'boolean'],
                    'api_key' => ['type' => 'string'],
                    'allowed_ips' => ['type' => 'array', 'items' => ['type' => 'string']],
                    'webhook_url' => ['type' => 'string'],
                    'webhook_secret' => ['type' => 'string'],
                    'rate_limit_per_min' => ['type' => 'integer'],
                ],
            ],
            'InventoryItem' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'product_id' => ['type' => 'integer'],
                    'warehouse_id' => ['type' => 'integer'],
                    'quantity' => ['type' => 'number'],
                    'reserved_quantity' => ['type' => 'number'],
                    'available_quantity' => ['type' => 'number'],
                ],
            ],
            'Branch' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'name' => ['type' => 'string'],
                    'code' => ['type' => 'string'],
                    'address' => ['type' => 'string'],
                    'phone' => ['type' => 'string'],
                    'is_active' => ['type' => 'boolean'],
                ],
            ],
            'CompanyProfile' => [
                'type' => 'object',
                'properties' => [
                    'name' => ['type' => 'string'],
                    'address' => ['type' => 'string'],
                    'phone' => ['type' => 'string'],
                    'email' => ['type' => 'string'],
                    'rc_number' => ['type' => 'string'],
                    'tin' => ['type' => 'string'],
                    'logo_url' => ['type' => 'string'],
                    'website' => ['type' => 'string'],
                ],
            ],
            'ApprovalWorkflowSettings' => [
                'type' => 'object',
                'properties' => [
                    'sales_order_require_approval' => ['type' => 'boolean'],
                    'sales_order_threshold' => ['type' => 'number'],
                    'purchase_order_require_approval' => ['type' => 'boolean'],
                    'purchase_order_threshold' => ['type' => 'number'],
                    'expense_require_approval' => ['type' => 'boolean'],
                    'expense_threshold' => ['type' => 'number'],
                    'payroll_require_approval' => ['type' => 'boolean'],
                    'inventory_adjustment_approval' => ['type' => 'boolean'],
                    'credit_over_limit_approval' => ['type' => 'boolean'],
                    'production_require_approval' => ['type' => 'boolean'],
                    'production_threshold' => ['type' => 'number'],
                    'sales_discount_threshold' => ['type' => 'number'],
                    'require_dual_approval_above' => ['type' => 'number'],
                    'auto_escalate_after_hours' => ['type' => 'integer'],
                    'max_approval_levels' => ['type' => 'integer'],
                    'creator_cannot_approve' => ['type' => 'boolean'],
                    'booking_cannot_cashier' => ['type' => 'boolean'],
                    'cashier_cannot_accountant' => ['type' => 'boolean'],
                    'same_user_cannot_receive_po' => ['type' => 'boolean'],
                    'notify_on_pending_approval' => ['type' => 'boolean'],
                    'notify_on_approval_complete' => ['type' => 'boolean'],
                    'notify_on_rejection' => ['type' => 'boolean'],
                    'reminder_hours' => ['type' => 'integer'],
                    'workflow' => ['type' => 'object', 'additionalProperties' => ['type' => 'array', 'items' => ['type' => 'object']]],
                ],
            ],
            'DocumentTemplate' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'name' => ['type' => 'string'],
                    'description' => ['type' => 'string'],
                    'fields' => ['type' => 'array', 'items' => ['type' => 'string']],
                    'last_modified' => ['type' => 'string'],
                ],
            ],
            'BackupHistoryItem' => [
                'type' => 'object',
                'properties' => [
                    'filename' => ['type' => 'string'],
                    'size' => ['type' => 'integer'],
                    'created_at' => ['type' => 'string'],
                ],
            ],
            'PaginatedProductResponse' => [
                'allOf' => [
                    ['$ref' => '#/components/schemas/PaginatedResponseBase'],
                    ['properties' => ['data' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Product']]]],
                ],
            ],
            'PaginatedCustomerResponse' => [
                'allOf' => [
                    ['$ref' => '#/components/schemas/PaginatedResponseBase'],
                    ['properties' => ['data' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Customer']]]],
                ],
            ],
            'PaginatedSupplierResponse' => [
                'allOf' => [
                    ['$ref' => '#/components/schemas/PaginatedResponseBase'],
                    ['properties' => ['data' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Supplier']]]],
                ],
            ],
            'PaginatedSalesOrderResponse' => [
                'allOf' => [
                    ['$ref' => '#/components/schemas/PaginatedResponseBase'],
                    ['properties' => ['data' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/SalesOrder']]]],
                ],
            ],
            'PaginatedPurchaseOrderResponse' => [
                'allOf' => [
                    ['$ref' => '#/components/schemas/PaginatedResponseBase'],
                    ['properties' => ['data' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/PurchaseOrder']]]],
                ],
            ],
            'PaginatedPaymentResponse' => [
                'allOf' => [
                    ['$ref' => '#/components/schemas/PaginatedResponseBase'],
                    ['properties' => ['data' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Payment']]]],
                ],
            ],
            'PaginatedExpenseResponse' => [
                'allOf' => [
                    ['$ref' => '#/components/schemas/PaginatedResponseBase'],
                    ['properties' => ['data' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Expense']]]],
                ],
            ],
            'PaginatedProductionResponse' => [
                'allOf' => [
                    ['$ref' => '#/components/schemas/PaginatedResponseBase'],
                    ['properties' => ['data' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Production']]]],
                ],
            ],
            'PaginatedAuditLogResponse' => [
                'allOf' => [
                    ['$ref' => '#/components/schemas/PaginatedResponseBase'],
                    ['properties' => ['data' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/AuditLog']]]],
                ],
            ],
            'PaginatedStaffResponse' => [
                'allOf' => [
                    ['$ref' => '#/components/schemas/PaginatedResponseBase'],
                    ['properties' => ['data' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Staff']]]],
                ],
            ],
            'PaginatedPayrollResponse' => [
                'allOf' => [
                    ['$ref' => '#/components/schemas/PaginatedResponseBase'],
                    ['properties' => ['data' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Payroll']]]],
                ],
            ],
            'PaginatedInventoryResponse' => [
                'allOf' => [
                    ['$ref' => '#/components/schemas/PaginatedResponseBase'],
                    ['properties' => ['data' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/InventoryItem']]]],
                ],
            ],
        ];

        $spec = [
            'openapi' => '3.0.3',
            'info' => [
                'title' => 'FirstGiwa ERP API',
                'version' => '1.0.0',
                'description' => 'API documentation for FirstGiwa ERP',
            ],
            'servers' => [
                ['url' => $baseUrl],
            ],
            'tags' => [
                ['name' => 'Auth'],
                ['name' => 'Products'],
                ['name' => 'Categories'],
                ['name' => 'Warehouses'],
                ['name' => 'Inventory'],
                ['name' => 'Customers'],
                ['name' => 'Suppliers'],
                ['name' => 'SalesOrders'],
                ['name' => 'PurchaseOrders'],
                ['name' => 'Payments'],
                ['name' => 'Expenses'],
                ['name' => 'Production'],
                ['name' => 'Audit'],
                ['name' => 'Staff'],
                ['name' => 'Payroll'],
                ['name' => 'CreditAnalytics'],
                ['name' => 'Settings'],
            ],
            'components' => [
                'securitySchemes' => [
                    'bearerAuth' => [
                        'type' => 'http',
                        'scheme' => 'bearer',
                        'bearerFormat' => 'JWT',
                    ],
                    'apiKeyAuth' => [
                        'type' => 'apiKey',
                        'in' => 'header',
                        'name' => 'X-API-KEY',
                    ],
                ],
                'schemas' => $schemas,
            ],
            'security' => [
                ['bearerAuth' => []],
                ['apiKeyAuth' => []],
            ],
            'paths' => [
                '/login' => [
                    'post' => [
                        'summary' => 'Login',
                        'tags' => ['Auth'],
                        'operationId' => 'login',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/LoginRequest'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Login successful',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/LoginResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/logout' => [
                    'post' => [
                        'summary' => 'Logout',
                        'tags' => ['Auth'],
                        'operationId' => 'logout',
                        'responses' => [
                            '200' => [
                                'description' => 'Logged out',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/MessageResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/me' => [
                    'get' => [
                        'summary' => 'Current user',
                        'tags' => ['Auth'],
                        'operationId' => 'me',
                        'responses' => [
                            '200' => [
                                'description' => 'User data',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'user' => ['$ref' => '#/components/schemas/User'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/branches' => [
                    'get' => [
                        'summary' => 'List branches',
                        'tags' => ['Settings'],
                        'operationId' => 'listBranches',
                        'responses' => [
                            '200' => [
                                'description' => 'Branches',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'array',
                                            'items' => ['$ref' => '#/components/schemas/Branch'],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/products' => [
                    'get' => [
                        'summary' => 'List products',
                        'tags' => ['Products'],
                        'operationId' => 'listProducts',
                        'responses' => [
                            '200' => [
                                'description' => 'Products',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedProductResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create product',
                        'tags' => ['Products'],
                        'operationId' => 'createProduct',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Product'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Product created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'product' => ['$ref' => '#/components/schemas/Product'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/products/{id}' => [
                    'get' => [
                        'summary' => 'Get product',
                        'tags' => ['Products'],
                        'operationId' => 'getProduct',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Product',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/Product'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update product',
                        'tags' => ['Products'],
                        'operationId' => 'updateProduct',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Product'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Product updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'product' => ['$ref' => '#/components/schemas/Product'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete product',
                        'tags' => ['Products'],
                        'operationId' => 'deleteProduct',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Product deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/MessageResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/categories' => [
                    'get' => [
                        'summary' => 'List categories',
                        'tags' => ['Categories'],
                        'operationId' => 'listCategories',
                        'responses' => [
                            '200' => [
                                'description' => 'Categories',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'array',
                                            'items' => ['$ref' => '#/components/schemas/Category'],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create category',
                        'tags' => ['Categories'],
                        'operationId' => 'createCategory',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Category'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Category created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'category' => ['$ref' => '#/components/schemas/Category'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/categories/{id}' => [
                    'get' => [
                        'summary' => 'Get category',
                        'tags' => ['Categories'],
                        'operationId' => 'getCategory',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Category',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/Category'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update category',
                        'tags' => ['Categories'],
                        'operationId' => 'updateCategory',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Category'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Category updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'category' => ['$ref' => '#/components/schemas/Category'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete category',
                        'tags' => ['Categories'],
                        'operationId' => 'deleteCategory',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Category deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/MessageResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/warehouses' => [
                    'get' => [
                        'summary' => 'List warehouses',
                        'tags' => ['Warehouses'],
                        'operationId' => 'listWarehouses',
                        'responses' => [
                            '200' => [
                                'description' => 'Warehouses',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'array',
                                            'items' => ['$ref' => '#/components/schemas/Warehouse'],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create warehouse',
                        'tags' => ['Warehouses'],
                        'operationId' => 'createWarehouse',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Warehouse'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Warehouse created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'warehouse' => ['$ref' => '#/components/schemas/Warehouse'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/warehouses/{id}' => [
                    'get' => [
                        'summary' => 'Get warehouse',
                        'tags' => ['Warehouses'],
                        'operationId' => 'getWarehouse',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Warehouse',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/Warehouse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update warehouse',
                        'tags' => ['Warehouses'],
                        'operationId' => 'updateWarehouse',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Warehouse'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Warehouse updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'warehouse' => ['$ref' => '#/components/schemas/Warehouse'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete warehouse',
                        'tags' => ['Warehouses'],
                        'operationId' => 'deleteWarehouse',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Warehouse deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/MessageResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/inventory' => [
                    'get' => [
                        'summary' => 'Inventory summary',
                        'tags' => ['Inventory'],
                        'operationId' => 'inventorySummary',
                        'responses' => [
                            '200' => [
                                'description' => 'Inventory',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedInventoryResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/customers' => [
                    'get' => [
                        'summary' => 'List customers',
                        'tags' => ['Customers'],
                        'operationId' => 'listCustomers',
                        'responses' => [
                            '200' => [
                                'description' => 'Customers',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedCustomerResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create customer',
                        'tags' => ['Customers'],
                        'operationId' => 'createCustomer',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Customer'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Customer created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Customer'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/customers/{id}' => [
                    'get' => [
                        'summary' => 'Get customer',
                        'tags' => ['Customers'],
                        'operationId' => 'getCustomer',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Customer',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'data' => ['$ref' => '#/components/schemas/Customer'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update customer',
                        'tags' => ['Customers'],
                        'operationId' => 'updateCustomer',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Customer'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Customer updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Customer'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete customer',
                        'tags' => ['Customers'],
                        'operationId' => 'deleteCustomer',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Customer deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/MessageResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/suppliers' => [
                    'get' => [
                        'summary' => 'List suppliers',
                        'tags' => ['Suppliers'],
                        'operationId' => 'listSuppliers',
                        'responses' => [
                            '200' => [
                                'description' => 'Suppliers',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedSupplierResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create supplier',
                        'tags' => ['Suppliers'],
                        'operationId' => 'createSupplier',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Supplier'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Supplier created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Supplier'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/suppliers/{id}' => [
                    'get' => [
                        'summary' => 'Get supplier',
                        'tags' => ['Suppliers'],
                        'operationId' => 'getSupplier',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Supplier',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'data' => ['$ref' => '#/components/schemas/Supplier'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update supplier',
                        'tags' => ['Suppliers'],
                        'operationId' => 'updateSupplier',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Supplier'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Supplier updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Supplier'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete supplier',
                        'tags' => ['Suppliers'],
                        'operationId' => 'deleteSupplier',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Supplier deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/MessageResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/sales-orders' => [
                    'get' => [
                        'summary' => 'List sales orders',
                        'tags' => ['SalesOrders'],
                        'operationId' => 'listSalesOrders',
                        'responses' => [
                            '200' => [
                                'description' => 'Sales orders',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedSalesOrderResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create sales order',
                        'tags' => ['SalesOrders'],
                        'operationId' => 'createSalesOrder',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/SalesOrder'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Sales order created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/SalesOrder'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/sales-orders/{id}' => [
                    'get' => [
                        'summary' => 'Get sales order',
                        'tags' => ['SalesOrders'],
                        'operationId' => 'getSalesOrder',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Sales order',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'data' => ['$ref' => '#/components/schemas/SalesOrder'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update sales order',
                        'tags' => ['SalesOrders'],
                        'operationId' => 'updateSalesOrder',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/SalesOrder'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Sales order updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/SalesOrder'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete sales order',
                        'tags' => ['SalesOrders'],
                        'operationId' => 'deleteSalesOrder',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Sales order deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/MessageResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/purchase-orders' => [
                    'get' => [
                        'summary' => 'List purchase orders',
                        'tags' => ['PurchaseOrders'],
                        'operationId' => 'listPurchaseOrders',
                        'responses' => [
                            '200' => [
                                'description' => 'Purchase orders',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedPurchaseOrderResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create purchase order',
                        'tags' => ['PurchaseOrders'],
                        'operationId' => 'createPurchaseOrder',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/PurchaseOrder'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Purchase order created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/PurchaseOrder'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/purchase-orders/{id}' => [
                    'get' => [
                        'summary' => 'Get purchase order',
                        'tags' => ['PurchaseOrders'],
                        'operationId' => 'getPurchaseOrder',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Purchase order',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'data' => ['$ref' => '#/components/schemas/PurchaseOrder'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update purchase order',
                        'tags' => ['PurchaseOrders'],
                        'operationId' => 'updatePurchaseOrder',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/PurchaseOrder'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Purchase order updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/PurchaseOrder'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete purchase order',
                        'tags' => ['PurchaseOrders'],
                        'operationId' => 'deletePurchaseOrder',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Purchase order deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/MessageResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/payments' => [
                    'get' => [
                        'summary' => 'List payments',
                        'tags' => ['Payments'],
                        'operationId' => 'listPayments',
                        'responses' => [
                            '200' => [
                                'description' => 'Payments',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedPaymentResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create payment',
                        'tags' => ['Payments'],
                        'operationId' => 'createPayment',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Payment'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Payment created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Payment'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/payments/{id}' => [
                    'get' => [
                        'summary' => 'Get payment',
                        'tags' => ['Payments'],
                        'operationId' => 'getPayment',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Payment',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'data' => ['$ref' => '#/components/schemas/Payment'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete payment',
                        'tags' => ['Payments'],
                        'operationId' => 'deletePayment',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Payment deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/MessageResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/expenses' => [
                    'get' => [
                        'summary' => 'List expenses',
                        'tags' => ['Expenses'],
                        'operationId' => 'listExpenses',
                        'responses' => [
                            '200' => [
                                'description' => 'Expenses',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedExpenseResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create expense',
                        'tags' => ['Expenses'],
                        'operationId' => 'createExpense',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Expense'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Expense created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Expense'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/expenses/{id}' => [
                    'get' => [
                        'summary' => 'Get expense',
                        'tags' => ['Expenses'],
                        'operationId' => 'getExpense',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Expense',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'data' => ['$ref' => '#/components/schemas/Expense'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update expense',
                        'tags' => ['Expenses'],
                        'operationId' => 'updateExpense',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Expense'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Expense updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Expense'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete expense',
                        'tags' => ['Expenses'],
                        'operationId' => 'deleteExpense',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Expense deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/MessageResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/production' => [
                    'get' => [
                        'summary' => 'List production runs',
                        'tags' => ['Production'],
                        'operationId' => 'listProduction',
                        'responses' => [
                            '200' => [
                                'description' => 'Production',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedProductionResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create production run',
                        'tags' => ['Production'],
                        'operationId' => 'createProduction',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Production'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Production created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Production'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/production/{id}' => [
                    'get' => [
                        'summary' => 'Get production run',
                        'tags' => ['Production'],
                        'operationId' => 'getProduction',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Production run',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/Production'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete production run',
                        'tags' => ['Production'],
                        'operationId' => 'deleteProduction',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Production deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/MessageResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/audit-logs' => [
                    'get' => [
                        'summary' => 'Audit trail',
                        'tags' => ['Audit'],
                        'operationId' => 'listAuditLogs',
                        'responses' => [
                            '200' => [
                                'description' => 'Audit logs',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedAuditLogResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/staff' => [
                    'get' => [
                        'summary' => 'List staff',
                        'tags' => ['Staff'],
                        'operationId' => 'listStaff',
                        'responses' => [
                            '200' => [
                                'description' => 'Staff',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedStaffResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create staff',
                        'tags' => ['Staff'],
                        'operationId' => 'createStaff',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Staff'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Staff created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Staff'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/staff/{id}' => [
                    'get' => [
                        'summary' => 'Get staff',
                        'tags' => ['Staff'],
                        'operationId' => 'getStaff',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Staff',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/Staff'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update staff',
                        'tags' => ['Staff'],
                        'operationId' => 'updateStaff',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Staff'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Staff updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Staff'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete staff',
                        'tags' => ['Staff'],
                        'operationId' => 'deleteStaff',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Staff deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/MessageResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/payroll' => [
                    'get' => [
                        'summary' => 'List payroll runs',
                        'tags' => ['Payroll'],
                        'operationId' => 'listPayroll',
                        'responses' => [
                            '200' => [
                                'description' => 'Payroll',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedPayrollResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create payroll run',
                        'tags' => ['Payroll'],
                        'operationId' => 'createPayroll',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Payroll'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Payroll created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Payroll'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/payroll/{id}' => [
                    'get' => [
                        'summary' => 'Get payroll run',
                        'tags' => ['Payroll'],
                        'operationId' => 'getPayroll',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Payroll',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/Payroll'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete payroll run',
                        'tags' => ['Payroll'],
                        'operationId' => 'deletePayroll',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Payroll deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/MessageResponse'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/credit-analytics/summary' => [
                    'get' => [
                        'summary' => 'Credit analytics summary',
                        'tags' => ['CreditAnalytics'],
                        'operationId' => 'creditAnalyticsSummary',
                        'responses' => [
                            '200' => [
                                'description' => 'Credit analytics',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['type' => 'object', 'additionalProperties' => true],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/backup' => [
                    'get' => [
                        'summary' => 'Get backup settings',
                        'tags' => ['Settings'],
                        'operationId' => 'getBackupSettings',
                        'responses' => [
                            '200' => [
                                'description' => 'Backup settings',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'data' => ['$ref' => '#/components/schemas/BackupSettings'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update backup settings',
                        'tags' => ['Settings'],
                        'operationId' => 'updateBackupSettings',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/BackupSettings'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/api' => [
                    'get' => [
                        'summary' => 'Get API settings',
                        'tags' => ['Settings'],
                        'operationId' => 'getApiSettings',
                        'responses' => [
                            '200' => [
                                'description' => 'API settings',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'data' => ['$ref' => '#/components/schemas/ApiSettings'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update API settings',
                        'tags' => ['Settings'],
                        'operationId' => 'updateApiSettings',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/ApiSettings'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/taxes' => [
                    'get' => [
                        'summary' => 'List taxes',
                        'tags' => ['Settings'],
                        'operationId' => 'listTaxes',
                        'responses' => [
                            '200' => [
                                'description' => 'Taxes',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'data' => [
                                                    'type' => 'object',
                                                    'properties' => [
                                                        'taxes' => [
                                                            'type' => 'array',
                                                            'items' => ['$ref' => '#/components/schemas/Tax'],
                                                        ],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create tax',
                        'tags' => ['Settings'],
                        'operationId' => 'createTax',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Tax'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Tax created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                                'data' => [
                                                    'type' => 'object',
                                                    'properties' => [
                                                        'tax' => ['$ref' => '#/components/schemas/Tax'],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/taxes/{id}' => [
                    'put' => [
                        'summary' => 'Update tax',
                        'tags' => ['Settings'],
                        'operationId' => 'updateTax',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Tax'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Tax updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Tax'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete tax',
                        'tags' => ['Settings'],
                        'operationId' => 'deleteTax',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Tax deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/payment-methods' => [
                    'get' => [
                        'summary' => 'List payment methods',
                        'tags' => ['Settings'],
                        'operationId' => 'listPaymentMethods',
                        'responses' => [
                            '200' => [
                                'description' => 'Payment methods',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'data' => [
                                                    'type' => 'object',
                                                    'properties' => [
                                                        'payment_methods' => [
                                                            'type' => 'array',
                                                            'items' => ['$ref' => '#/components/schemas/PaymentMethod'],
                                                        ],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create payment method',
                        'tags' => ['Settings'],
                        'operationId' => 'createPaymentMethod',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/PaymentMethod'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Payment method created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                                'data' => [
                                                    'type' => 'object',
                                                    'properties' => [
                                                        'payment_method' => ['$ref' => '#/components/schemas/PaymentMethod'],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/payment-methods/{id}' => [
                    'put' => [
                        'summary' => 'Update payment method',
                        'tags' => ['Settings'],
                        'operationId' => 'updatePaymentMethod',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/PaymentMethod'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Payment method updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/PaymentMethod'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete payment method',
                        'tags' => ['Settings'],
                        'operationId' => 'deletePaymentMethod',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Payment method deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/bank-accounts' => [
                    'get' => [
                        'summary' => 'List bank accounts',
                        'tags' => ['Settings'],
                        'operationId' => 'listBankAccounts',
                        'responses' => [
                            '200' => [
                                'description' => 'Bank accounts',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'data' => [
                                                    'type' => 'object',
                                                    'properties' => [
                                                        'bank_accounts' => [
                                                            'type' => 'array',
                                                            'items' => ['$ref' => '#/components/schemas/BankAccount'],
                                                        ],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create bank account',
                        'tags' => ['Settings'],
                        'operationId' => 'createBankAccount',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/BankAccount'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Bank account created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                                'data' => [
                                                    'type' => 'object',
                                                    'properties' => [
                                                        'bank_account' => ['$ref' => '#/components/schemas/BankAccount'],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/bank-accounts/{id}' => [
                    'put' => [
                        'summary' => 'Update bank account',
                        'tags' => ['Settings'],
                        'operationId' => 'updateBankAccount',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/BankAccount'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Bank account updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/BankAccount'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete bank account',
                        'tags' => ['Settings'],
                        'operationId' => 'deleteBankAccount',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Bank account deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/sequences' => [
                    'get' => [
                        'summary' => 'List number sequences',
                        'tags' => ['Settings'],
                        'operationId' => 'listNumberSequences',
                        'responses' => [
                            '200' => [
                                'description' => 'Number sequences',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'array',
                                            'items' => ['$ref' => '#/components/schemas/NumberSequence'],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/sequences/{id}' => [
                    'put' => [
                        'summary' => 'Update number sequence',
                        'tags' => ['Settings'],
                        'operationId' => 'updateNumberSequence',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/NumberSequence'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Number sequence updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/NumberSequence'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/inventory' => [
                    'get' => [
                        'summary' => 'Inventory settings',
                        'tags' => ['Settings'],
                        'operationId' => 'getInventorySettings',
                        'responses' => [
                            '200' => [
                                'description' => 'Inventory settings',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'data' => ['$ref' => '#/components/schemas/InventorySettings'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update inventory settings',
                        'tags' => ['Settings'],
                        'operationId' => 'updateInventorySettings',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/InventorySettings'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Inventory settings updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/sales' => [
                    'get' => [
                        'summary' => 'Sales settings',
                        'tags' => ['Settings'],
                        'operationId' => 'getSalesSettings',
                        'responses' => [
                            '200' => [
                                'description' => 'Sales settings',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'data' => ['$ref' => '#/components/schemas/SalesSettings'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update sales settings',
                        'tags' => ['Settings'],
                        'operationId' => 'updateSalesSettings',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/SalesSettings'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Sales settings updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/company' => [
                    'get' => [
                        'summary' => 'Get company profile',
                        'tags' => ['Settings'],
                        'operationId' => 'getCompanyProfile',
                        'responses' => [
                            '200' => [
                                'description' => 'Company profile',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'data' => ['$ref' => '#/components/schemas/CompanyProfile'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update company profile',
                        'tags' => ['Settings'],
                        'operationId' => 'updateCompanyProfile',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/CompanyProfile'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/CompanyProfile'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/company/logo' => [
                    'post' => [
                        'summary' => 'Upload company logo',
                        'tags' => ['Settings'],
                        'operationId' => 'uploadCompanyLogo',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'multipart/form-data' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'logo' => ['type' => 'string', 'format' => 'binary'],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Logo uploaded',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                                'data' => [
                                                    'type' => 'object',
                                                    'properties' => [
                                                        'logo_url' => ['type' => 'string'],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/branches' => [
                    'get' => [
                        'summary' => 'List branches',
                        'tags' => ['Settings'],
                        'operationId' => 'listSettingBranches',
                        'responses' => [
                            '200' => [
                                'description' => 'Branches',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'data' => [
                                                    'type' => 'object',
                                                    'properties' => [
                                                        'branches' => [
                                                            'type' => 'array',
                                                            'items' => ['$ref' => '#/components/schemas/Branch'],
                                                        ],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'post' => [
                        'summary' => 'Create branch',
                        'tags' => ['Settings'],
                        'operationId' => 'createBranch',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Branch'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => [
                                'description' => 'Branch created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                                'data' => [
                                                    'type' => 'object',
                                                    'properties' => [
                                                        'branch' => ['$ref' => '#/components/schemas/Branch'],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/branches/{id}' => [
                    'put' => [
                        'summary' => 'Update branch',
                        'tags' => ['Settings'],
                        'operationId' => 'updateBranch',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/Branch'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Branch updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Branch'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'delete' => [
                        'summary' => 'Delete branch',
                        'tags' => ['Settings'],
                        'operationId' => 'deleteBranch',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Branch deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/branches/{id}/toggle-active' => [
                    'post' => [
                        'summary' => 'Toggle branch active status',
                        'tags' => ['Settings'],
                        'operationId' => 'toggleBranchActive',
                        'parameters' => [
                            ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Branch toggled',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                                'data' => ['$ref' => '#/components/schemas/Branch'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/approvals' => [
                    'get' => [
                        'summary' => 'Get approval workflows',
                        'tags' => ['Settings'],
                        'operationId' => 'getApprovalWorkflows',
                        'responses' => [
                            '200' => [
                                'description' => 'Approval workflows',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'data' => ['$ref' => '#/components/schemas/ApprovalWorkflowSettings'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update approval workflows',
                        'tags' => ['Settings'],
                        'operationId' => 'updateApprovalWorkflows',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/ApprovalWorkflowSettings'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Approval workflows updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/templates' => [
                    'get' => [
                        'summary' => 'List document templates',
                        'tags' => ['Settings'],
                        'operationId' => 'listDocumentTemplates',
                        'responses' => [
                            '200' => [
                                'description' => 'Templates',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'data' => [
                                                    'type' => 'array',
                                                    'items' => ['$ref' => '#/components/schemas/DocumentTemplate'],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'put' => [
                        'summary' => 'Update document templates',
                        'tags' => ['Settings'],
                        'operationId' => 'updateDocumentTemplates',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'templates' => [
                                                'type' => 'array',
                                                'items' => ['$ref' => '#/components/schemas/DocumentTemplate'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Templates updated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/backup/history' => [
                    'get' => [
                        'summary' => 'Backup history',
                        'tags' => ['Settings'],
                        'operationId' => 'backupHistory',
                        'responses' => [
                            '200' => [
                                'description' => 'Backup history',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'data' => [
                                                    'type' => 'array',
                                                    'items' => ['$ref' => '#/components/schemas/BackupHistoryItem'],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/backup/create' => [
                    'post' => [
                        'summary' => 'Create backup',
                        'tags' => ['Settings'],
                        'operationId' => 'createBackup',
                        'responses' => [
                            '200' => [
                                'description' => 'Backup created',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/backup/download/{filename}' => [
                    'get' => [
                        'summary' => 'Download backup',
                        'tags' => ['Settings'],
                        'operationId' => 'downloadBackup',
                        'parameters' => [
                            ['name' => 'filename', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Backup file',
                                'content' => [
                                    'application/octet-stream' => [
                                        'schema' => ['type' => 'string', 'format' => 'binary'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/backup/{filename}' => [
                    'delete' => [
                        'summary' => 'Delete backup',
                        'tags' => ['Settings'],
                        'operationId' => 'deleteBackup',
                        'parameters' => [
                            ['name' => 'filename', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Backup deleted',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'message' => ['type' => 'string'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                '/settings/api/rotate-key' => [
                    'post' => [
                        'summary' => 'Rotate API key',
                        'tags' => ['Settings'],
                        'operationId' => 'rotateApiKey',
                        'responses' => [
                            '200' => [
                                'description' => 'API key rotated',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'success' => ['type' => 'boolean'],
                                                'data' => [
                                                    'type' => 'object',
                                                    'properties' => [
                                                        'api_key' => ['type' => 'string'],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        return response()->json($spec);
    }
}
