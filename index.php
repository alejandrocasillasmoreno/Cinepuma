<?php
session_start();
if (!isset($_SESSION['usuario'])) {
    header("Location: html/login.php");
    exit();
}
?>
<h1>Bienvenido a Cinepuma, <?php echo $_SESSION['usuario']; ?>!</h1>
<a href="back/logout.php">Cerrar Sesión</a>