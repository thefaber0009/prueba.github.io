<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/Database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error de conexión a la base de datos",
        "error" => $e->getMessage()
    ]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetOrders($db);
        break;
    case 'POST':
        handleCreateOrder($db);
        break;
    case 'PUT':
        handleUpdateOrder($db);
        break;
    case 'DELETE':
        handleDeleteOrder($db);
        break;
    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no permitido"]);
        break;
}

function handleGetOrders($db) {
    try {
        $date_filter = $_GET['date'] ?? date('Y-m-d');
        $status_filter = $_GET['status'] ?? 'all';
        $queue_filter = $_GET['queue'] ?? 'all';
        
        $query = "SELECT o.*, 
                         GROUP_CONCAT(
                             CONCAT(oi.quantity, 'x ', mi.name, ' ($', oi.unit_price, ')')
                             SEPARATOR ', '
                         ) as items_detail
                  FROM orders o
                  LEFT JOIN order_items oi ON o.id = oi.order_id
                  LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
                  WHERE DATE(o.order_date) = ?";
        
        $params = [$date_filter];
        
        if ($status_filter !== 'all') {
            $query .= " AND o.status = ?";
            $params[] = $status_filter;
        }
        
        if ($queue_filter !== 'all') {
            $query .= " AND o.queue_type = ?";
            $params[] = $queue_filter;
        }
        
        $query .= " GROUP BY o.id ORDER BY o.order_date DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "success" => true,
            "data" => $orders,
            "count" => count($orders)
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error obteniendo pedidos",
            "error" => $e->getMessage()
        ]);
    }
}

function handleCreateOrder($db) {
    try {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Datos JSON inválidos"]);
            return;
        }
        
        // Validar datos requeridos
        $required_fields = ['customer_name', 'turn_number', 'queue_type', 'total_amount', 'items'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Campo requerido: $field"]);
                return;
            }
        }
        
        // Generar código único del pedido
        $order_code = generateUniqueOrderCode($db);
        
        // Iniciar transacción
        $db->beginTransaction();
        
        // Insertar pedido principal
        $order_query = "INSERT INTO orders (order_code, customer_name, turn_number, queue_type, total_amount, status) 
                       VALUES (?, ?, ?, ?, ?, 'pending')";
        
        $order_stmt = $db->prepare($order_query);
        $order_stmt->execute([
            $order_code,
            trim($input['customer_name']),
            $input['turn_number'],
            $input['queue_type'],
            $input['total_amount']
        ]);
        
        $order_id = $db->lastInsertId();
        
        // Insertar items del pedido
        $item_query = "INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price) 
                      VALUES (?, ?, ?, ?, ?)";
        $item_stmt = $db->prepare($item_query);
        
        foreach ($input['items'] as $item) {
            // Buscar el menu_item_id por nombre
            $menu_query = "SELECT id FROM menu_items WHERE name = ? LIMIT 1";
            $menu_stmt = $db->prepare($menu_query);
            $menu_stmt->execute([$item['name']]);
            $menu_item = $menu_stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$menu_item) {
                // Si no existe, crear el item en el menú
                $create_menu_query = "INSERT INTO menu_items (name, price, category) VALUES (?, ?, 'general')";
                $create_menu_stmt = $db->prepare($create_menu_query);
                $create_menu_stmt->execute([$item['name'], $item['price']]);
                $menu_item_id = $db->lastInsertId();
            } else {
                $menu_item_id = $menu_item['id'];
            }
            
            $item_stmt->execute([
                $order_id,
                $menu_item_id,
                $item['quantity'],
                $item['price'],
                $item['total']
            ]);
        }
        
        // Actualizar contador de turnos
        updateQueueCounter($db, $input['queue_type'], $input['turn_number']);
        
        $db->commit();
        
        // Registrar log
        logAction($db, null, 'order_created', "Nuevo pedido creado: $order_code por {$input['customer_name']}");
        
        echo json_encode([
            "success" => true,
            "message" => "Pedido creado exitosamente",
            "data" => [
                "order_id" => $order_id,
                "order_code" => $order_code
            ]
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error creando pedido",
            "error" => $e->getMessage()
        ]);
    }
}

function handleUpdateOrder($db) {
    try {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($input['order_id']) || !isset($input['status'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "order_id y status son requeridos"]);
            return;
        }
        
        $valid_statuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
        if (!in_array($input['status'], $valid_statuses)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Estado inválido"]);
            return;
        }
        
        $query = "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP";
        $params = [$input['status']];
        
        if ($input['status'] === 'delivered') {
            $query .= ", delivered_at = CURRENT_TIMESTAMP";
        }
        
        $query .= " WHERE id = ?";
        $params[] = $input['order_id'];
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        if ($stmt->rowCount() > 0) {
            logAction($db, null, 'order_status_update', "Pedido {$input['order_id']} actualizado a {$input['status']}");
            
            echo json_encode([
                "success" => true,
                "message" => "Estado del pedido actualizado"
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Pedido no encontrado"]);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error actualizando pedido",
            "error" => $e->getMessage()
        ]);
    }
}

function handleDeleteOrder($db) {
    try {
        $order_id = $_GET['id'] ?? null;
        
        if (!$order_id) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "ID del pedido requerido"]);
            return;
        }
        
        $stmt = $db->prepare("DELETE FROM orders WHERE id = ?");
        $stmt->execute([$order_id]);
        
        if ($stmt->rowCount() > 0) {
            logAction($db, null, 'order_deleted', "Pedido $order_id eliminado");
            
            echo json_encode([
                "success" => true,
                "message" => "Pedido eliminado exitosamente"
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Pedido no encontrado"]);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error eliminando pedido",
            "error" => $e->getMessage()
        ]);
    }
}

function generateUniqueOrderCode($db) {
    $attempts = 0;
    do {
        $code = 'REY' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
        $stmt = $db->prepare("SELECT COUNT(*) FROM orders WHERE order_code = ?");
        $stmt->execute([$code]);
        $exists = $stmt->fetchColumn() > 0;
        $attempts++;
    } while ($exists && $attempts < 100);
    
    if ($attempts >= 100) {
        throw new Exception("No se pudo generar un código único");
    }
    
    return $code;
}

function updateQueueCounter($db, $queue_type, $turn_number) {
    try {
        // Extraer el número del turno (ej: "T5" -> 5, "E3" -> 3)
        $number = (int) preg_replace('/[^0-9]/', '', $turn_number);
        
        $stmt = $db->prepare("UPDATE queue_types SET current_counter = ? WHERE name = ?");
        $stmt->execute([$number, $queue_type]);
    } catch (Exception $e) {
        error_log("Error actualizando contador de cola: " . $e->getMessage());
    }
}

function logAction($db, $user_id, $action, $description) {
    try {
        $stmt = $db->prepare("INSERT INTO system_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $user_id,
            $action,
            $description,
            $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
    } catch (Exception $e) {
        error_log("Error registrando log: " . $e->getMessage());
    }
}
?>