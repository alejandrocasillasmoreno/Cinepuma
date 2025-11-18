<?php
session_start();

// Limpiar todas las variables de sesión
$_SESSION = array();

// Destruir la sesión
session_destroy();

// Redirigir al formulario de login
header("location: login.php");
exit;
?>