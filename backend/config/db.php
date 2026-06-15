<?php
// Database configuration
// Update these values to match your environment
$host     = "localhost";
$user     = "root";
$password = "";          // Change in production!
$database = "payback_buddy";   // Match your DB name

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

$conn->set_charset("utf8mb4");
?>