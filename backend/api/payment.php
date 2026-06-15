<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include '../config/db.php';

$data    = json_decode(file_get_contents("php://input"), true);
$loan_id = intval($data['loan_id'] ?? 0);
$user_id = intval($data['user_id'] ?? 0);  // verify ownership

if ($loan_id <= 0 || $user_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "loan_id and user_id are required."]);
    exit();
}

// Only allow the owner to mark it paid
$stmt = $conn->prepare("UPDATE loans SET status = 'Paid' WHERE id = ? AND user_id = ? AND status != 'Paid'");
$stmt->bind_param("ii", $loan_id, $user_id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(["success" => true, "message" => "Payment marked successfully!"]);
} else {
    echo json_encode(["success" => false, "message" => "Loan not found, not yours, or already paid."]);
}

$stmt->close();
$conn->close();
?>