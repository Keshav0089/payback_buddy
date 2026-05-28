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

$lender = $data->lender_name;
$borrower = $data->borrower_name;
$email = $data->borrower_email;
$amount = $data->amount;
$reason = $data->reason;
$due_date = $data->due_date;

$sql = "INSERT INTO loans(lender_name, borrower_name, borrower_email, amount, reason, due_date)
VALUES('$lender','$borrower','$email','$amount','$reason','$due_date')";

if($conn->query($sql)){
    echo json_encode(["message" => "Loan Added Successfully"]);
}else{
    echo json_encode(["message" => "Failed to Add Loan"]);
}
?>