<?php
// Basic PHP entry point for buñuelos application
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Simple routing
$request = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($request, PHP_URL_PATH);

// Serve static assets
if (preg_match('/\.(css|js|png|jpg|jpeg|gif|ico)$/', $path)) {
    return false; // Let PHP built-in server handle static files
}

// Basic routing
switch ($path) {
    case '/':
        include 'pages/index.html';
        break;
    case '/admin':
        include 'pages/admin.html';
        break;
    case '/api/menu':
        include 'api/menu.php';
        break;
    case '/api/orders':
        include 'api/orders.php';
        break;
    default:
        http_response_code(404);
        echo '<h1>404 - Página no encontrada</h1>';
        break;
}
?>