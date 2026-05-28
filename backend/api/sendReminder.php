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
$message = $data->message;

$sql = "INSERT INTO reminders(loan_id, message)
VALUES('$loan_id','$message')";

if($conn->query($sql)){
    echo json_encode([
        "message" => "Reminder Sent Successfully"
    ]);
}else{
    echo json_encode([
        "message" => "Reminder Failed"
    ]);
}
?>