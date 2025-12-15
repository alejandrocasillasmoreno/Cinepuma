
<?php
// Incluir la conexión a la base de datos
require_once 'db_connection.php';

// Verificar si se ha enviado el formulario por POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username']; // Asegúrate de que el nombre del campo sea 'username'
    $password = $_POST['password']; // Asegúrate de que el nombre del campo sea 'password'

    if (empty($username) || empty($password)) {
        die("Por favor, rellena todos los campos.");
    }

    // 1. Cifrar la Contraseña de forma segura (usando PASSWORD_DEFAULT, que es bcrypt)
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // 2. Preparar la consulta SQL para prevenir Inyección SQL
    $stmt = $conn->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
    $stmt->bind_param("ss", $username, $password_hash);

    if ($stmt->execute()) {
        echo "¡Registro exitoso! Puedes iniciar sesión.";
        // Redirigir a la página de login
        // header("Location: /login.php"); 
    } else {
        // En caso de usuario duplicado u otro error SQL
        echo "Error al registrar: " . $stmt->error;
    }

    $stmt->close();
}

$conn->close();
?>