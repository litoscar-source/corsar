<?php
// Configurações da Base de Dados (Hostinger Local)
$host = 'localhost'; 
$db_name = 'NOME_DA_BASE_DE_DADOS'; // Ex: u123456789_auditpro
$username = 'USUARIO_DA_BASE_DE_DADOS'; // Ex: u123456789_admin
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
    $dsn = "mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4";
    $conn = new PDO($dsn, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(["error" => "Connection error: " . $exception->getMessage()]);
    exit();
}
?>