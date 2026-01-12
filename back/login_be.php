<?php
session_start();
include 'conexion.php';

$correo = $_POST['correo'];
$pass = $_POST['pass'];

$consulta = mysqli_query($conexion, "SELECT * FROM usuarios WHERE correo = '$correo'");

if (mysqli_num_rows($consulta) > 0) {
    $usuario = mysqli_fetch_assoc($consulta);
    
    // Verificamos la contraseña encriptada
    if (password_verify($pass, $usuario['contrasena'])) {
        $_SESSION['usuario'] = $usuario['nombre_usuario'];
        header("Location: ../index.php"); // Al entrar, vamos a la raíz
    } else {
        echo "Contraseña incorrecta";
    }
} else {
    echo "Usuario no encontrado";
}
?>