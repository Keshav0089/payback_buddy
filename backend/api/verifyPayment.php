<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

define('RAZORPAY_KEY_ID',     '');   // ← replace with your key
define('RAZORPAY_KEY_SECRET', '');    // ← replace with your secret

include '../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$order_id   = $data['razorpay_order_id']   ?? '';
$payment_id = $data['razorpay_payment_id'] ?? '';
$signature  = $data['razorpay_signature']  ?? '';
$loan_id    = intval($data['loan_id']      ?? 0);
$amount_paid = floatval($data['amount_paid'] ?? 0); // actual amount paid in this transaction (INR)

if (!$order_id || !$payment_id || !$signature || !$loan_id || $amount_paid <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing payment fields."]);
    exit();
}

// Verify Razorpay signature
$expected = hash_hmac("sha256", "$order_id|$payment_id", RAZORPAY_KEY_SECRET);
if (!hash_equals($expected, $signature)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid payment signature."]);
    exit();
}

// Fetch current loan state
$stmt = $conn->prepare("SELECT amount, amount_paid, status FROM loans WHERE id = ?");
$stmt->bind_param("i", $loan_id);
$stmt->execute();
$loan = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$loan) { http_response_code(404); echo json_encode(["success" => false, "message" => "Loan not found."]); exit(); }

$newAmountPaid = floatval($loan['amount_paid']) + $amount_paid;
$totalAmount   = floatval($loan['amount']);

// Determine new status
if ($newAmountPaid >= $totalAmount) {
    $newStatus   = 'Paid';
    $newAmountPaid = $totalAmount; // cap at total
} else {
    $newStatus = 'Partial';
}

// Update loan
$stmt2 = $conn->prepare("UPDATE loans SET amount_paid = ?, status = ? WHERE id = ?");
$stmt2->bind_param("dsi", $newAmountPaid, $newStatus, $loan_id);
$stmt2->execute();
$stmt2->close();

// Log payment
$stmt3 = $conn->prepare(
    "INSERT INTO payments (loan_id, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature)
     VALUES (?, ?, ?, ?, ?)"
);
$stmt3->bind_param("idsss", $loan_id, $amount_paid, $order_id, $payment_id, $signature);
$stmt3->execute();
$stmt3->close();

$remaining = $totalAmount - $newAmountPaid;

echo json_encode([
    "success"      => true,
    "message"      => $newStatus === 'Paid'
        ? "Full payment received! Loan marked as Paid."
        : "Partial payment of ₹" . number_format($amount_paid, 2) . " received. ₹" . number_format($remaining, 2) . " remaining.",
    "status"       => $newStatus,
    "amount_paid"  => $newAmountPaid,
    "remaining"    => $remaining,
]);

$conn->close();
?>