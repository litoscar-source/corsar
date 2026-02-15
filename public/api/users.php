<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $conn->prepare("SELECT * FROM users");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Converte allowed_templates de JSON string para Array
        foreach($users as &$user) {
            $user['allowedTemplates'] = json_decode($user['allowed_templates']);
            unset($user['allowed_templates']); // Remove snake_case key
        }
        echo json_encode($users);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        // Verifica se é Create ou Update
        $stmt = $conn->prepare("REPLACE INTO users (id, name, role, pin, avatar, allowed_templates) VALUES (:id, :name, :role, :pin, :avatar, :allowed_templates)");
        
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":role", $data->role);
        $stmt->bindParam(":pin", $data->pin);
        $stmt->bindParam(":avatar", $data->avatar);
        $templatesJson = json_encode($data->allowedTemplates);
        $stmt->bindParam(":allowed_templates", $templatesJson);
        
        if($stmt->execute()) {
            echo json_encode(["message" => "User saved successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Unable to save user"]);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : die();
        $stmt = $conn->prepare("DELETE FROM users WHERE id = :id");
        $stmt->bindParam(":id", $id);
        if($stmt->execute()) {
            echo json_encode(["message" => "User deleted"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Unable to delete user"]);
        }
        break;
}
?>