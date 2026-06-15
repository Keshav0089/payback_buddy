<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include '../config/db.php';

$data  = json_decode(file_get_contents("php://input"), true);
$email = strtolower(trim($data['email'] ?? ''));
$name  = trim($data['name']  ?? '');
$uid   = trim($data['uid']   ?? '');   // Firebase UID

if (!$email || !$uid) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email and UID required."]);
    exit();
}

// Check if user already exists by email
$stmt = $conn->prepare("SELECT id, name, email FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$stmt->close();

if ($result->num_rows > 0) {
    // Existing user — just return their info
    $user = $result->fetch_assoc();
    echo json_encode([
        "success" => true,
        "message" => "Login successful!",
        "user"    => $user
    ]);
} else {
    // New Google user — auto-register with a random password hash
    $password = password_hash($uid . time(), PASSWORD_DEFAULT);
    $stmt2 = $conn->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
    $stmt2->bind_param("sss", $name, $email, $password);

    if ($stmt2->execute()) {
        $newId = $stmt2->insert_id;
        $stmt2->close();
        echo json_encode([
            "success" => true,
            "message" => "Account created!",
            "user"    => ["id" => $newId, "name" => $name, "email" => $email]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to create account.", "error" => $stmt2->error]);
    }
}

$conn->close();
?>