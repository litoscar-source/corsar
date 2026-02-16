<?php
// Configurações da Base de Dados - PREENCHA AQUI NA HOSTINGER
$host = 'localhost';
$db_name = 'NOME_DA_BASE_DE_DADOS';
$username = 'USUARIO_DA_BASE_DE_DADOS';
$password = 'SENHA_DA_BASE_DE_DADOS';

// Headers CORS e Content-Type
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    echo json_encode(["error" => "Connection error: " . $exception->getMessage()]);
    exit();
}
?>