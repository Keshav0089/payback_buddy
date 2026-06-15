<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include '../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$required = ['user_id', 'lender_name', 'borrower_name', 'borrower_email', 'amount'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required field: $field"]);
        exit();
    }
}

$user_id  = intval($data['user_id']);
$lender   = trim($data['lender_name']);
$borrower = trim($data['borrower_name']);
$email    = strtolower(trim($data['borrower_email']));
$amount   = floatval($data['amount']);
$reason   = trim($data['reason'] ?? '');
$due_date = !empty($data['due_date']) ? $data['due_date'] : null;

if ($amount <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Amount must be greater than zero."]);
    exit();
}

// user_id(i), lender(s), borrower(s), email(s), amount(d), reason(s), due_date(s) = "isssdss"
$stmt = $conn->prepare(
    "INSERT INTO loans (user_id, lender_name, borrower_name, borrower_email, amount, reason, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)"
);
$stmt->bind_param("isssdss", $user_id, $lender, $borrower, $email, $amount, $reason, $due_date);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Loan added successfully!", "id" => $stmt->insert_id]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to add loan.", "error" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>