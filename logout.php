<?php
session_start();
session_destroy(); // Borra los datos de la sesión
header("Location: ../html/login.php"); // Redirige al login
exit();
?>