<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../config/db.php';
$data = json_decode(file_get_contents("php://input"));

$loan_id = $data->loan_id;

$sql = "UPDATE loans SET status='Paid' WHERE id='$loan_id'";

if($conn->query($sql)){
    echo json_encode([
        "message" => "Payment Successful"
    ]);
}else{
    echo json_encode([
        "message" => "Payment Failed"
    ]);
}
?>