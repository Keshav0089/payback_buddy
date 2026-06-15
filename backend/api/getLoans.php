<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include '../config/db.php';

$user_id = intval($_GET['user_id'] ?? 0);
$email   = trim($_GET['email'] ?? '');

if ($user_id <= 0 || empty($email)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "user_id and email required."]);
    exit();
}

// Lender loans — loans this user created
$s1 = $conn->prepare("
    SELECT l.*,
           ROUND(l.amount - l.amount_paid, 2) AS remaining,
           ROUND((l.amount_paid / l.amount) * 100, 1) AS paid_percent,
           'lender' AS role,
           (SELECT COUNT(*) FROM reminders r WHERE r.loan_id = l.id) AS reminder_count,
           (SELECT sent_at FROM reminders r WHERE r.loan_id = l.id ORDER BY sent_at DESC LIMIT 1) AS last_reminded
    FROM loans l
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
");
$s1->bind_param("i", $user_id);
$s1->execute();
$lenderLoans = $s1->get_result()->fetch_all(MYSQLI_ASSOC);
$s1->close();

// Borrower loans — loans where this user's email is the borrower
$s2 = $conn->prepare("
    SELECT l.*,
           ROUND(l.amount - l.amount_paid, 2) AS remaining,
           ROUND((l.amount_paid / l.amount) * 100, 1) AS paid_percent,
           'borrower' AS role,
           (SELECT COUNT(*) FROM reminders r WHERE r.loan_id = l.id) AS reminder_count,
           (SELECT sent_at FROM reminders r WHERE r.loan_id = l.id ORDER BY sent_at DESC LIMIT 1) AS last_reminded,
           (SELECT message FROM reminders r WHERE r.loan_id = l.id ORDER BY sent_at DESC LIMIT 1) AS last_reminder_message
    FROM loans l
    WHERE LOWER(l.borrower_email) = LOWER(?)
    ORDER BY l.created_at DESC
");
$s2->bind_param("s", $email);
$s2->execute();
$borrowerLoans = $s2->get_result()->fetch_all(MYSQLI_ASSOC);
$s2->close();

echo json_encode([
    "lender_loans"   => $lenderLoans,
    "borrower_loans" => $borrowerLoans,
]);

$conn->close();
?>