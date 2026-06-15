<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include '../config/db.php';

$data    = json_decode(file_get_contents("php://input"), true);
$loan_id = intval($data['loan_id'] ?? 0);
$message = trim($data['message'] ?? '');

if ($loan_id <= 0 || empty($message)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "loan_id and message are required."]);
    exit();
}

// Fetch loan + lender name
$check = $conn->prepare("
    SELECT l.borrower_name, l.borrower_email, l.amount, l.due_date, l.status,
           u.name AS lender_name
    FROM loans l
    JOIN users u ON l.user_id = u.id
    WHERE l.id = ?
");
$check->bind_param("i", $loan_id);
$check->execute();
$result = $check->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Loan not found."]);
    $check->close(); exit();
}

$loan = $result->fetch_assoc();
$check->close();

if ($loan['status'] === 'Paid') {
    echo json_encode(["success" => false, "message" => "This loan is already paid — no reminder needed!"]);
    exit();
}

// ── Save reminder to DB (this is what borrower sees on their dashboard) ──
$stmt = $conn->prepare("INSERT INTO reminders (loan_id, message) VALUES (?, ?)");
$stmt->bind_param("is", $loan_id, $message);
$insertOk = $stmt->execute();
$stmt->close();

if (!$insertOk) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to save reminder."]);
    exit();
}

// ── Send email ──
$to      = $loan['borrower_email'];
$subject = "Payment Reminder from " . $loan['lender_name'] . " — PayBack Buddy";
$amount  = "₹" . number_format($loan['amount'], 2);
$due     = $loan['due_date'] ? date("d M Y", strtotime($loan['due_date'])) : "the agreed date";

$body  = "Hi " . $loan['borrower_name'] . ",\n\n";
$body .= $loan['lender_name'] . " sent you a payment reminder via PayBack Buddy.\n\n";
$body .= "Amount Due : " . $amount . "\n";
$body .= "Due Date   : " . $due . "\n";
$body .= "Message    : " . $message . "\n\n";
$body .= "Please arrange repayment at your earliest convenience.\n\nRegards,\nPayBack Buddy";

$headers  = "From: no-reply@paybackbuddy.com\r\n";
$headers .= "Reply-To: no-reply@paybackbuddy.com\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

$emailSent = @mail($to, $subject, $body, $headers);

echo json_encode([
    "success"    => true,
    "message"    => "Reminder saved! Borrower will see it on their dashboard." . ($emailSent ? " Email also sent." : ""),
    "email_sent" => $emailSent,
]);

$conn->close();
?>