<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $conn->prepare("SELECT * FROM reports ORDER BY date DESC");
        $stmt->execute();
        $rawReports = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $reports = [];
        foreach($rawReports as $r) {
            $reports[] = [
                'id' => $r['id'],
                'clientId' => $r['client_id'],
                // Join could be better, but keeping it simple matching frontend type
                'clientName' => '', // Will be filled by frontend or need a JOIN. Frontend joining is easier for now given structure.
                'auditorId' => $r['auditor_id'],
                'auditorName' => '', // Filled by frontend
                'typeKey' => $r['type_key'],
                'typeName' => '', // Filled by frontend logic
                'date' => $r['date'],
                'startTime' => $r['start_time'],
                'endTime' => $r['end_time'],
                'contractNumber' => $r['contract_number'],
                'routeNumber' => $r['route_number'],
                'summary' => $r['summary'],
                'clientObservations' => $r['client_observations'],
                'gpsLocation' => ($r['gps_lat'] && $r['gps_lng']) ? ['lat' => floatval($r['gps_lat']), 'lng' => floatval($r['gps_lng'])] : null,
                'status' => $r['status'],
                'auditorSignature' => $r['auditor_signature'],
                'clientSignature' => $r['client_signature'],
                'auditorSignerName' => $r['auditor_signer_name'],
                'clientSignerName' => $r['client_signer_name'],
                'criteria' => json_decode($r['criteria_json']),
                'order' => json_decode($r['order_json'])
            ];
        }
        echo json_encode($reports);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        $sql = "REPLACE INTO reports (
            id, client_id, auditor_id, type_key, date, start_time, end_time, 
            contract_number, route_number, summary, client_observations, 
            gps_lat, gps_lng, status, auditor_signature, client_signature, 
            auditor_signer_name, client_signer_name, criteria_json, order_json
        ) VALUES (
            :id, :clientId, :auditorId, :typeKey, :date, :startTime, :endTime,
            :contractNumber, :routeNumber, :summary, :clientObservations,
            :gpsLat, :gpsLng, :status, :auditorSignature, :clientSignature,
            :auditorSignerName, :clientSignerName, :criteriaJson, :orderJson
        )";
        
        $stmt = $conn->prepare($sql);
        
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":clientId", $data->clientId);
        $stmt->bindParam(":auditorId", $data->auditorId);
        $stmt->bindParam(":typeKey", $data->typeKey);
        $stmt->bindParam(":date", $data->date);
        $stmt->bindParam(":startTime", $data->startTime);
        $stmt->bindParam(":endTime", $data->endTime);
        $stmt->bindParam(":contractNumber", $data->contractNumber);
        $stmt->bindParam(":routeNumber", $data->routeNumber);
        $stmt->bindParam(":summary", $data->summary);
        $stmt->bindParam(":clientObservations", $data->clientObservations);
        
        $lat = $data->gpsLocation ? $data->gpsLocation->lat : null;
        $lng = $data->gpsLocation ? $data->gpsLocation->lng : null;
        $stmt->bindParam(":gpsLat", $lat);
        $stmt->bindParam(":gpsLng", $lng);
        
        $stmt->bindParam(":status", $data->status);
        $stmt->bindParam(":auditorSignature", $data->auditorSignature);
        $stmt->bindParam(":clientSignature", $data->clientSignature);
        $stmt->bindParam(":auditorSignerName", $data->auditorSignerName);
        $stmt->bindParam(":clientSignerName", $data->clientSignerName);
        
        $criteriaJson = json_encode($data->criteria);
        $stmt->bindParam(":criteriaJson", $criteriaJson);
        
        $orderJson = isset($data->order) ? json_encode($data->order) : null;
        $stmt->bindParam(":orderJson", $orderJson);
        
        if($stmt->execute()) {
            echo json_encode(["message" => "Report saved"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error saving report"]);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : die();
        $stmt = $conn->prepare("DELETE FROM reports WHERE id = :id");
        $stmt->bindParam(":id", $id);
        if($stmt->execute()) {
            echo json_encode(["message" => "Report deleted"]);
        } else {
             http_response_code(500);
            echo json_encode(["error" => "Error deleting report"]);
        }
        break;
}
?>