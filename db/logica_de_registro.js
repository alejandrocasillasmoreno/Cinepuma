/ userRoutes.js o donde manejes las rutas de autenticación
const express = require('express');
const router = express.Router();
const pool = require('./db'); // Importa la conexión
const bcrypt = require('bcrypt');
const saltRounds = 10; // Nivel de seguridad del hashing

// Ruta para Registrar un nuevo usuario
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Faltan el nombre de usuario o la contraseña.');
    }

    try {
        // 1. Cifrar la Contraseña
        const password_hash = await bcrypt.hash(password, saltRounds);
        
        // 2. Insertar en la Base de Datos
        const [result] = await pool.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, password_hash]
        );

        res.status(201).send({
            message: 'Usuario registrado exitosamente.',
            userId: result.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            // Error de usuario duplicado (por UNIQUE en username)
            return res.status(409).send('El nombre de usuario ya existe.');
        }
        console.error('Error al registrar usuario:', error);
        res.status(500).send('Error interno del servidor.');
    }
});

// module.exports = router; // Asegúrate de exportar tus rutas