<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
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
        handleGetQueues($db);
        break;
    case 'PUT':
        handleUpdateQueue($db);
        break;
    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no permitido"]);
        break;
}

function handleGetQueues($db) {
    try {
        // Obtener información de las colas con estadísticas
        $query = "SELECT 
                    q.*,
                    COALESCE(COUNT(CASE WHEN o.status = 'pending' THEN 1 END), 0) as pending_orders,
                    COALESCE(COUNT(CASE WHEN o.status = 'preparing' THEN 1 END), 0) as preparing_orders,
                    COALESCE(COUNT(CASE WHEN o.status = 'ready' THEN 1 END), 0) as ready_orders,
                    COALESCE(COUNT(CASE WHEN o.status IN ('pending', 'preparing', 'ready') THEN 1 END), 0) as active_orders
                  FROM queue_types q
                  LEFT JOIN orders o ON q.name = o.queue_type AND DATE(o.order_date) = CURDATE()
                  WHERE q.is_active = TRUE
                  GROUP BY q.id
                  ORDER BY q.id";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $queues = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "success" => true,
            "data" => $queues
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error obteniendo información de colas",
            "error" => $e->getMessage()
        ]);
    }
}

function handleUpdateQueue($db) {
    try {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($input['queue_name']) || !isset($input['action'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "queue_name y action son requeridos"]);
            return;
        }
        
        $queue_name = $input['queue_name'];
        $action = $input['action'];
        
        switch ($action) {
            case 'increment':
                $query = "UPDATE queue_types SET current_counter = current_counter + 1 WHERE name = ?";
                break;
            case 'decrement':
                $query = "UPDATE queue_types SET current_counter = GREATEST(current_counter - 1, 0) WHERE name = ?";
                break;
            case 'reset':
                $query = "UPDATE queue_types SET current_counter = 0 WHERE name = ?";
                break;
            case 'set':
                if (!isset($input['value'])) {
                    http_response_code(400);
                    echo json_encode(["success" => false, "message" => "Valor requerido para acción 'set'"]);
                    return;
                }
                $query = "UPDATE queue_types SET current_counter = ? WHERE name = ?";
                $params = [$input['value'], $queue_name];
                break;
            default:
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Acción inválida"]);
                return;
        }
        
        if ($action !== 'set') {
            $params = [$queue_name];
        }
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        if ($stmt->rowCount() > 0) {
            // Obtener el nuevo valor
            $get_query = "SELECT current_counter FROM queue_types WHERE name = ?";
            $get_stmt = $db->prepare($get_query);
            $get_stmt->execute([$queue_name]);
            $new_value = $get_stmt->fetchColumn();
            
            // Registrar en logs
            logAction($db, null, 'queue_updated', "Cola $queue_name actualizada: $action (nuevo valor: $new_value)");
            
            echo json_encode([
                "success" => true,
                "message" => "Cola actualizada exitosamente",
                "data" => [
                    "queue_name" => $queue_name,
                    "new_counter" => $new_value
                ]
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Cola no encontrada"]);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error actualizando cola",
            "error" => $e->getMessage()
        ]);
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