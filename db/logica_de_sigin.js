// userRoutes.js (continuación)

// Ruta para Iniciar Sesión
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Faltan credenciales.');
    }

    try {
        // 1. Buscar Usuario
        const [rows] = await pool.execute(
            'SELECT id, password_hash FROM users WHERE username = ?',
            [username]
        );

        // Si no hay filas, el usuario no existe
        if (rows.length === 0) {
            return res.status(401).send('Credenciales inválidas.');
        }

        const user = rows[0];
        
        // 2. Comparar Contraseña
        const match = await bcrypt.compare(password, user.password_hash);
        
        // 3. Autenticación
        if (match) {
            // ¡Login exitoso!
            // Aquí deberías generar un Token JWT o establecer una Sesión.
            res.status(200).send({
                message: 'Login exitoso',
                userId: user.id
            });
        } else {
            // Contraseña incorrecta
            res.status(401).send('Credenciales inválidas.');
        }

    } catch (error) {
        console.error('Error durante el login:', error);
        res.status(500).send('Error interno del servidor.');
    }
});

module.exports = router;