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
$sql = "SELECT * FROM loans ORDER BY id DESC";
$result = $conn->query($sql);

$loans = [];

while($row = $result->fetch_assoc()){
    $loans[] = $row;
}

echo json_encode($loans);
?>