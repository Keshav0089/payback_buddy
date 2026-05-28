<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

if(!$data){

    echo json_encode([
        "success" => false,
        "message" => "No Data Received"
    ]);

    exit();
}

$email = $data['email'];
$password = $data['password'];

$sql = "SELECT * FROM users WHERE email='$email'";

$result = $conn->query($sql);

if($result->num_rows > 0){

    $user = $result->fetch_assoc();

    if(password_verify($password, $user['password'])){

        echo json_encode([
            "success" => true,
            "message" => "Login Successful"
        ]);

    }else{

        echo json_encode([
            "success" => false,
            "message" => "Wrong Password"
        ]);
    }

}else{

    echo json_encode([
        "success" => false,
        "message" => "User Not Found"
    ]);
}

?>