<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $conn->prepare("SELECT id, name, nif, address, postal_code as postalCode, locality, email, phone, website, logo_url as logoUrl FROM company_settings LIMIT 1");
        $stmt->execute();
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        if($settings) {
            echo json_encode($settings);
        } else {
            echo json_encode(null); // Return null if not set
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        // Always use ID 1 for settings
        $id = 1;
        
        $stmt = $conn->prepare("REPLACE INTO company_settings (id, name, nif, address, postal_code, locality, email, phone, website, logo_url) 
                                VALUES (:id, :name, :nif, :address, :postalCode, :locality, :email, :phone, :website, :logoUrl)");
        
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":nif", $data->nif);
        $stmt->bindParam(":address", $data->address);
        $stmt->bindParam(":postalCode", $data->postalCode);
        $stmt->bindParam(":locality", $data->locality);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":phone", $data->phone);
        $stmt->bindParam(":website", $data->website);
        $stmt->bindParam(":logoUrl", $data->logoUrl);
        
        if($stmt->execute()) {
            echo json_encode(["message" => "Settings saved"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error saving settings"]);
        }
        break;
}
?>