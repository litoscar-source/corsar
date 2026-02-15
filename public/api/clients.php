<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $conn->prepare("SELECT 
            id, name, nif, contact_person as contactPerson, email, phone, 
            address, postal_code as postalCode, locality, county, shop_name as shopName,
            status, last_visit as lastVisit, visit_frequency as visitFrequency, account_manager_id as accountManagerId
            FROM clients");
        $stmt->execute();
        $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($clients);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        $sql = "REPLACE INTO clients (id, name, nif, contact_person, email, phone, address, postal_code, locality, county, shop_name, status, last_visit, visit_frequency, account_manager_id) 
                VALUES (:id, :name, :nif, :contactPerson, :email, :phone, :address, :postalCode, :locality, :county, :shopName, :status, :lastVisit, :visitFrequency, :accountManagerId)";
        
        $stmt = $conn->prepare($sql);
        
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":nif", $data->nif);
        $stmt->bindParam(":contactPerson", $data->contactPerson);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":phone", $data->phone);
        $stmt->bindParam(":address", $data->address);
        $stmt->bindParam(":postalCode", $data->postalCode);
        $stmt->bindParam(":locality", $data->locality);
        $stmt->bindParam(":county", $data->county);
        $stmt->bindParam(":shopName", $data->shopName);
        $stmt->bindParam(":status", $data->status);
        $stmt->bindParam(":lastVisit", $data->lastVisit);
        $stmt->bindParam(":visitFrequency", $data->visitFrequency);
        $stmt->bindParam(":accountManagerId", $data->accountManagerId);
        
        if($stmt->execute()) {
            echo json_encode(["message" => "Client saved"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error saving client"]);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : die();
        $stmt = $conn->prepare("DELETE FROM clients WHERE id = :id");
        $stmt->bindParam(":id", $id);
        if($stmt->execute()) {
            echo json_encode(["message" => "Client deleted"]);
        } else {
             http_response_code(500);
            echo json_encode(["error" => "Error deleting client"]);
        }
        break;
}
?>