<?php
session_start();

// Siempre devolver JSON
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Función para log de debugging (quítala en producción)
function debug_log($message) {
    error_log("AUTH DEBUG: " . $message);
}

// Manejo de errores → siempre JSON
set_exception_handler(function($e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error interno del servidor",
        "error"   => $e->getMessage()
    ]);
    exit;
});

// Respuesta rápida a preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    echo json_encode(["success" => true, "message" => "Preflight OK"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido."]);
    exit;
}

require_once __DIR__ . '/../Database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    debug_log("Conexión a BD exitosa");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Error de conexión a la base de datos",
        "error" => $e->getMessage()
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (empty($data->username) || empty($data->password)) {
    debug_log("Datos incompletos recibidos");
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos."]);
    exit;
}

$username = trim($data->username);
$password = $data->password;

debug_log("Intento de login para usuario: '$username'");

// Buscar usuario
$query = "SELECT id, username, password, full_name, is_active FROM admin_users WHERE username = ? LIMIT 1";
$stmt = $db->prepare($query);
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    debug_log("Usuario '$username' no encontrado en la BD");
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Usuario o contraseña incorrectos."]);
    exit;
}

debug_log("Usuario encontrado: " . $user['username']);
debug_log("Hash en BD: " . substr($user['password'], 0, 20) . "...");
debug_log("Usuario activo: " . ($user['is_active'] ? 'Sí' : 'No'));

// Verificar si está activo
if ((int)$user['is_active'] === 0) {
    debug_log("Usuario '$username' está desactivado");
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Cuenta desactivada."]);
    exit;
}

// Verificar contraseña
debug_log("Verificando contraseña...");
$password_valid = password_verify($password, $user['password']);
debug_log("Resultado de password_verify: " . ($password_valid ? 'true' : 'false'));

if (!$password_valid) {
    debug_log("Contraseña incorrecta para usuario '$username'");
    
    // Debugging adicional: verificar si la contraseña está hasheada
    if (strlen($user['password']) < 60 || !preg_match('/^\$2[ayb]\$\d+\$/', $user['password'])) {
        debug_log("PROBLEMA: La contraseña en BD no parece estar hasheada correctamente");
        debug_log("Longitud del hash: " . strlen($user['password']));
        debug_log("Primeros caracteres: " . substr($user['password'], 0, 10));
    }
    
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Usuario o contraseña incorrectos."]);
    exit;
}

// ✅ Login exitoso
debug_log("Login exitoso para usuario '$username'");

$_SESSION['admin_logged_in'] = true;
$_SESSION['admin_id'] = $user['id'];
$_SESSION['admin_username'] = $user['username'];

echo json_encode([
    "success" => true,
    "message" => "Login exitoso",
    "user" => [
        "id" => $user['id'],
        "username" => $user['username'],
        "full_name" => $user['full_name']
    ]
]);
?>