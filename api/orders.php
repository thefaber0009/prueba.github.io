<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Mock orders data - in production this would come from database
$ordersFile = 'data/orders.json';

// Ensure data directory exists
if (!file_exists('data')) {
    mkdir('data', 0755, true);
}

// Initialize orders file if it doesn't exist
if (!file_exists($ordersFile)) {
    file_put_contents($ordersFile, json_encode([]));
}

// Function definitions
function loadOrders() {
    global $ordersFile;
    $data = file_get_contents($ordersFile);
    return json_decode($data, true) ?? [];
}

function saveOrders($orders) {
    global $ordersFile;
    file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT));
}

function generateOrderCode() {
    return 'PED' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
}

function generateTurnNumber() {
    return 'T' . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
}

function getMenuItems() {
    // Load menu data (same as menu.php) - in production this would come from database
    return [
        [
            'id' => 'bunuelo-clasico',
            'name' => 'Buñuelo Clásico',
            'description' => 'Buñuelo tradicional con miel, receta original de la abuela',
            'price' => 1500,
            'category' => 'traditional'
        ],
        [
            'id' => 'bunuelo-azucar',
            'name' => 'Buñuelo con Azúcar',
            'description' => 'Buñuelo espolvoreado con azúcar refinada',
            'price' => 2000,
            'category' => 'traditional'
        ],
        [
            'id' => 'bunuelo-queso',
            'name' => 'Buñuelo de Queso Mozarella',
            'description' => 'Buñuelo relleno de queso mozarella derretido',
            'price' => 2500,
            'category' => 'traditional'
        ],
        [
            'id' => 'bunuelo-hawaiano',
            'name' => 'Buñuelo Hawaiano',
            'description' => 'Buñuelo relleno de piña y queso, una combinación tropical',
            'price' => 3000,
            'category' => 'special'
        ],
        [
            'id' => 'bunuelo-ranchero',
            'name' => 'Buñuelo Ranchero',
            'description' => 'Buñuelo relleno de salchicha y queso, sabor tradicional',
            'price' => 3000,
            'category' => 'special'
        ],
        [
            'id' => 'bunuelo-mermelada',
            'name' => 'Buñuelo de Mermelada',
            'description' => 'Buñuelo relleno de mermelada de frutas',
            'price' => 2000,
            'category' => 'special'
        ],
        [
            'id' => 'bunuelo-bocadillo',
            'name' => 'Buñuelo de Bocadillo',
            'description' => 'Buñuelo relleno de bocadillo de guayaba',
            'price' => 2000,
            'category' => 'special'
        ],
        [
            'id' => 'bunuelo-arequipe',
            'name' => 'Buñuelo de Arequipe',
            'description' => 'Buñuelo relleno de arequipe casero',
            'price' => 2000,
            'category' => 'special'
        ]
    ];
}

function validateAndCalculateOrder($items) {
    $menuItems = getMenuItems();
    $menuLookup = [];
    
    // Create lookup array for fast item validation
    foreach ($menuItems as $menuItem) {
        $menuLookup[$menuItem['id']] = $menuItem;
    }
    
    $validatedItems = [];
    $total = 0;
    
    foreach ($items as $item) {
        // Validate item exists in menu
        if (!isset($menuLookup[$item['id']])) {
            throw new Exception("Invalid menu item: " . $item['id']);
        }
        
        $menuItem = $menuLookup[$item['id']];
        
        // Validate quantity
        if (!isset($item['quantity']) || $item['quantity'] < 1) {
            throw new Exception("Invalid quantity for item: " . $item['id']);
        }
        
        // Use server-side price (NEVER trust client prices)
        $validatedItem = [
            'id' => $menuItem['id'],
            'name' => $menuItem['name'],
            'price' => $menuItem['price'], // Always use server price
            'quantity' => (int)$item['quantity'],
            'category' => $menuItem['category']
        ];
        
        $validatedItems[] = $validatedItem;
        $total += $menuItem['price'] * $item['quantity'];
    }
    
    return ['items' => $validatedItems, 'total' => $total];
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $orders = loadOrders();
        echo json_encode([
            'success' => true,
            'data' => $orders
        ]);
        break;
    
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid JSON input'
            ]);
            break;
        }
        
        // Validate required fields
        $requiredFields = ['customerName', 'orderType', 'items'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => "Field '$field' is required"
                ]);
                exit;
            }
        }
        
        // Validate items and calculate total securely using server-side prices
        try {
            $validation = validateAndCalculateOrder($input['items']);
            $validatedItems = $validation['items'];
            $total = $validation['total'];
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Order validation failed: ' . $e->getMessage()
            ]);
            exit;
        }
        
        // Create new order with validated data
        $order = [
            'id' => uniqid(),
            'orderCode' => generateOrderCode(),
            'customerName' => $input['customerName'],
            'turnNumber' => generateTurnNumber(),
            'orderType' => $input['orderType'], // 'physical' or 'delivery'
            'status' => 'pending', // pending, preparing, ready, delivered
            'items' => $validatedItems, // Use validated items with server-side prices
            'total' => $total, // Use calculated total from server-side prices
            'orderDate' => date('c'),
            'deliveryData' => $input['deliveryData'] ?? null
        ];
        
        // Determine queue type based on validated items
        $hasTraditional = false;
        $hasSpecial = false;
        foreach ($validatedItems as $item) {
            if ($item['category'] === 'traditional') $hasTraditional = true;
            if ($item['category'] === 'special') $hasSpecial = true;
        }
        
        if ($hasTraditional && $hasSpecial) {
            $order['queueType'] = 'mixtos';
        } elseif ($hasSpecial) {
            $order['queueType'] = 'especiales';
        } else {
            $order['queueType'] = 'tradicionales';
        }
        
        // Save order
        $orders = loadOrders();
        $orders[] = $order;
        saveOrders($orders);
        
        echo json_encode([
            'success' => true,
            'data' => $order
        ]);
        break;
    
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id']) || !isset($input['status'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Order ID and status are required'
            ]);
            break;
        }
        
        $orders = loadOrders();
        $orderFound = false;
        
        for ($i = 0; $i < count($orders); $i++) {
            if ($orders[$i]['id'] === $input['id']) {
                $orders[$i]['status'] = $input['status'];
                $orderFound = true;
                break;
            }
        }
        
        if (!$orderFound) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Order not found'
            ]);
            break;
        }
        
        saveOrders($orders);
        
        echo json_encode([
            'success' => true,
            'message' => 'Order status updated'
        ]);
        break;
    
    default:
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
        break;
}
?>