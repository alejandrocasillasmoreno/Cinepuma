<?php
$conexion = mysqli_connect("localhost", "root", "", "cinepuma_db");

if (!$conexion) {
    die("Error: No se pudo conectar a la base de datos.");
}
?>