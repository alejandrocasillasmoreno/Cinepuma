<?php
$servername = "localhost";
$username = "root";         // Tu usuario de MySQL
$password = "your_mysql_password"; // ¡CÁMBIALA!
$dbname = "cinepuma_db";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die("Error de conexión a la base de datos: " . $conn->connect_error);
}

// Puedes establecer el conjunto de caracteres a utf8
$conn->set_charset("utf8");
?>