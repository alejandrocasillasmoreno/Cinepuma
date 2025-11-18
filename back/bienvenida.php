<?php
// 1. Iniciar la sesión
session_start();

// 2. Comprobar si la sesión está iniciada
if ( !isset($_SESSION['usuario']) ) {
    
// 3. Redirigir esta pagina si no hay sesión iniciada
    header('Location: login.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Bienvenido</title>
</head>
<body>
    <h2>¡Hola, <?php echo htmlspecialchars($_SESSION['nombre_usuario']); ?>!</h2>
    <p>Has iniciado sesión con éxito. Este contenido está protegido.</p>
    <p><a href="logout.php">Cerrar Sesión</a></p>
</body>
</html>