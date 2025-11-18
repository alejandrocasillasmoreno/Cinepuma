<?php
session_start();

// 1.Lista de usuarios y contraseñas permitidos
$usuarios = [
    'admin' => 'admin123',
];

// 2.Recoger los datos del formulario
$usuario = $_POST['usuario'];
$contrasena = $_POST['contraseña'];

// 3.Verificar las credenciales
//Comprobar Si el usuario existe
if (array_key_exists($usuario, $usuarios)){

}else{
    // Si el usuario no existe entonces te redirige al formulario de login
    header('Location: Login.php');
    exit();
}

// Comprobar si la contraseña es correcta
if ($usuarios[$usuario] === $contrasena) {

    // El usuario y la contraseña son correctos
    $_SESSION['usuario'] = $usuario;

    // Redirigir a la página protegida
    header('Location: index.php');
    exit();

} else {

    // El usuario existe pero la contraseña es incorrecta
    header('Location: Login.php');
    exit();
}
?>
