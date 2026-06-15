<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

define('RAZORPAY_KEY_ID',     '');   // ← replace with your key
define('RAZORPAY_KEY_SECRET', '');    // ← replace with your secret

include '../config/db.php';

$data    = json_decode(file_get_contents("php://input"), true);
$loan_id = intval($data['loan_id'] ?? 0);
$user_id = intval($data['user_id'] ?? 0);
// partial_amount: if set, charge only this amount; otherwise charge remaining balance
$partial = floatval($data['partial_amount'] ?? 0);

if ($loan_id <= 0 || $user_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "loan_id and user_id required."]);
    exit();
}

$stmt = $conn->prepare("SELECT id, amount, amount_paid, borrower_name, borrower_email, status FROM loans WHERE id = ?");
$stmt->bind_param("i", $loan_id);
$stmt->execute();
$loan = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$loan) { http_response_code(404); echo json_encode(["success" => false, "message" => "Loan not found."]); exit(); }
if ($loan['status'] === 'Paid') { echo json_encode(["success" => false, "message" => "Loan already paid."]); exit(); }

$remaining = floatval($loan['amount']) - floatval($loan['amount_paid']);

// Validate partial amount
if ($partial > 0) {
    if ($partial > $remaining) {
        echo json_encode(["success" => false, "message" => "Partial amount ₹$partial exceeds remaining balance ₹$remaining."]);
        exit();
    }
    $chargeAmount = $partial;
} else {
    $chargeAmount = $remaining; // pay full remaining
}

$amountPaise = intval($chargeAmount * 100);

$orderData = [
    "amount"   => $amountPaise,
    "currency" => "INR",
    "receipt"  => "loan_{$loan_id}_" . time(),
    "notes"    => ["loan_id" => $loan_id, "partial" => ($partial > 0 ? "yes" : "no")]
];

$ch = curl_init("https://api.razorpay.com/v1/orders");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_USERPWD, RAZORPAY_KEY_ID . ":" . RAZORPAY_KEY_SECRET);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$order = json_decode($response, true);

if ($httpCode === 200 && isset($order['id'])) {
    echo json_encode([
        "success"         => true,
        "order_id"        => $order['id'],
        "amount"          => $amountPaise,
        "charge_amount"   => $chargeAmount,
        "remaining"       => $remaining,
        "currency"        => "INR",
        "key_id"          => RAZORPAY_KEY_ID,
        "loan_id"         => $loan_id,
        "borrower_name"   => $loan['borrower_name'],
        "borrower_email"  => $loan['borrower_email'],
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Razorpay order failed.", "error" => $order]);
}
$conn->close();
?>