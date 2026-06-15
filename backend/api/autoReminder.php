<?php
/**
 * autoReminder.php — run via XAMPP cron or Windows Task Scheduler daily
 *
 * Setup (Windows Task Scheduler):
 *   Action: C:\xampp\php\php.exe
 *   Arguments: C:\xampp\htdocs\payback\backend\api\autoReminder.php
 *   Trigger: Daily at 9:00 AM
 *
 * Setup (Linux/Mac cron):
 *   0 9 * * * php /var/www/html/payback/backend/api/autoReminder.php
 *
 * Can also be triggered via browser for testing:
 *   http://localhost:8080/payback/backend/api/autoReminder.php?secret=payback2024
 */

// Allow browser trigger with secret key (remove in production)
$isBrowser = isset($_SERVER['HTTP_HOST']);
if ($isBrowser) {
    header("Content-Type: application/json");
    header("Access-Control-Allow-Origin: *");
    $secret = $_GET['secret'] ?? '';
    if ($secret !== 'payback2024') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Unauthorized."]);
        exit();
    }
}

include '../config/db.php';

$today    = date('Y-m-d');
$in3days  = date('Y-m-d', strtotime('+3 days'));
$sent     = 0;
$errors   = [];

// Find loans due today or in 3 days, not yet paid, auto reminder not sent today
$stmt = $conn->prepare("
    SELECT l.id, l.borrower_name, l.borrower_email, l.amount, l.amount_paid,
           l.due_date, l.lender_name, u.name AS lender_real_name
    FROM loans l
    JOIN users u ON l.user_id = u.id
    WHERE l.status != 'Paid'
      AND l.due_date IN (?, ?)
      AND DATE(IFNULL(
            (SELECT MAX(r.sent_at) FROM reminders r WHERE r.loan_id = l.id AND r.type = 'auto'),
            '2000-01-01'
          )) < ?
    ORDER BY l.due_date ASC
");
$stmt->bind_param("sss", $today, $in3days, $today);
$stmt->execute();
$loans = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

foreach ($loans as $loan) {
    $remaining = floatval($loan['amount']) - floatval($loan['amount_paid']);
    $dueDate   = date("d M Y", strtotime($loan['due_date']));
    $isToday   = $loan['due_date'] === $today;

    $subject = $isToday
        ? "⚠️ Payment Due Today — PayBack Buddy"
        : "Reminder: Payment due in 3 days — PayBack Buddy";

    $body  = "Hi {$loan['borrower_name']},\n\n";
    $body .= $isToday
        ? "Your payment to {$loan['lender_name']} is DUE TODAY.\n\n"
        : "Your payment to {$loan['lender_name']} is due in 3 days ({$dueDate}).\n\n";
    $body .= "-------------------------------\n";
    $body .= "Total Amount : ₹" . number_format($loan['amount'], 2) . "\n";
    if ($loan['amount_paid'] > 0) {
        $body .= "Amount Paid  : ₹" . number_format($loan['amount_paid'], 2) . "\n";
        $body .= "Remaining    : ₹" . number_format($remaining, 2) . "\n";
    }
    $body .= "Due Date     : {$dueDate}\n";
    $body .= "-------------------------------\n\n";
    $body .= "Please log in to PayBack Buddy to make your payment.\n\n";
    $body .= "Regards,\nPayBack Buddy (Auto Reminder)";

    $headers  = "From: reminders@paybackbuddy.com\r\n";
    $headers .= "Reply-To: reminders@paybackbuddy.com\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $ok = @mail($loan['borrower_email'], $subject, $body, $headers);

    // Save reminder record regardless of email success
    $msg  = $isToday ? "Auto reminder: payment due today." : "Auto reminder: payment due in 3 days.";
    $type = 'auto';
    $ins  = $conn->prepare("INSERT INTO reminders (loan_id, message, type) VALUES (?, ?, ?)");
    $ins->bind_param("iss", $loan['id'], $msg, $type);
    $ins->execute();
    $ins->close();

    if ($ok) {
        $sent++;
    } else {
        $errors[] = "Email failed for loan #{$loan['id']} ({$loan['borrower_email']})";
    }
}

$result = [
    "success"       => true,
    "date_checked"  => $today,
    "loans_found"   => count($loans),
    "emails_sent"   => $sent,
    "errors"        => $errors,
];

if ($isBrowser) {
    echo json_encode($result, JSON_PRETTY_PRINT);
} else {
    echo "[" . date('Y-m-d H:i:s') . "] Auto reminders: {$sent} sent, " . count($errors) . " failed.\n";
}

$conn->close();
?>