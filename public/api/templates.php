<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $conn->prepare("SELECT `key`, `label`, `criteria_json` FROM templates");
        $stmt->execute();
        $rawTemplates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $templates = [];
        foreach($rawTemplates as $t) {
            $templates[] = [
                'key' => $t['key'],
                'label' => $t['label'],
                'defaultCriteria' => json_decode($t['criteria_json']),
                'isCustom' => true
            ];
        }
        echo json_encode($templates);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        $stmt = $conn->prepare("REPLACE INTO templates (`key`, `label`, `criteria_json`) VALUES (:key, :label, :criteriaJson)");
        
        $stmt->bindParam(":key", $data->key);
        $stmt->bindParam(":label", $data->label);
        $jsonCriteria = json_encode($data->defaultCriteria);
        $stmt->bindParam(":criteriaJson", $jsonCriteria);
        
        if($stmt->execute()) {
            echo json_encode(["message" => "Template saved"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error saving template"]);
        }
        break;

    case 'DELETE':
        $key = isset($_GET['key']) ? $_GET['key'] : die();
        $stmt = $conn->prepare("DELETE FROM templates WHERE `key` = :key");
        $stmt->bindParam(":key", $key);
        if($stmt->execute()) {
            echo json_encode(["message" => "Template deleted"]);
        } else {
             http_response_code(500);
            echo json_encode(["error" => "Error deleting template"]);
        }
        break;
}
?>