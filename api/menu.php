<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Menu data - in production this would come from database
$menuItems = [
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

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        echo json_encode([
            'success' => true,
            'data' => $menuItems
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