<?php
// api/stats.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Order.php';

$database = new Database();
$db = $database->getConnection();
$order = new Order($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

    try {
        $stats = $order->getDailyStats($date);

        // Top productos
        $topProductsQuery = "SELECT mi.id, mi.name, SUM(oi.quantity) as total_quantity, SUM(oi.total_price) as total_revenue
                             FROM order_items oi
                             JOIN menu_items mi ON oi.menu_item_id = mi.id
                             JOIN orders o ON oi.order_id = o.id
                             WHERE DATE(o.order_date) = ?
                             GROUP BY mi.id, mi.name
                             ORDER BY total_quantity DESC
                             LIMIT 5";
        $topProductsStmt = $db->prepare($topProductsQuery);
        $topProductsStmt->bindValue(1, $date);
        $topProductsStmt->execute();
        $topProducts = $topProductsStmt->fetchAll(PDO::FETCH_ASSOC);

        $stats['top_products'] = $topProducts;
        echo json_encode($stats);
    } catch (Exception $e) {
        error_log("Stats error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["message" => "Error interno del servidor."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido."]);
}
