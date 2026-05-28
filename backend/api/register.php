<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$conn = new mysqli("localhost", "root", "", "payback");

$data = json_decode(file_get_contents("php://input"), true);

if(!$data){
    echo json_encode([
        "message" => "No Data Received"
    ]);
    exit();
}

$name = $data['name'];
$email = $data['email'];
$password = password_hash($data['password'], PASSWORD_DEFAULT);

$sql = "INSERT INTO users(name,email,password)
VALUES('$name','$email','$password')";

if($conn->query($sql)){

    echo json_encode([
        "message" => "User Registered Successfully"
    ]);

}else{

    echo json_encode([
        "message" => "Registration Failed",
        "error" => $conn->error
    ]);
}
?>