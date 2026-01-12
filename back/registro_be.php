<?php
include 'conexion.php';

// Recibimos los datos del formulario
$nombre = $_POST['nombre'];
$correo = $_POST['correo'];
$pass = $_POST['pass'];

// Encriptamos la contraseña
$pass_hash = password_hash($pass, PASSWORD_BCRYPT);

// Insertamos
$query = "INSERT INTO usuarios (nombre_usuario, correo, contrasena) VALUES ('$nombre', '$correo', '$pass_hash')";

if (mysqli_query($conexion, $query)) {
    header("Location: ../html/login.php?res=success");
} else {
    echo "Error al registrar: " . mysqli_error($conexion);
}
?>