document.addEventListener('DOMContentLoaded', () => {
    // Selecciona todos los botones de encabezado del acordeón
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            // El contenido asociado está inmediatamente después del encabezado
            const content = header.nextElementSibling;

            // 1. Alternar la clase 'active' en el encabezado
            // Esto permite cambiar el estilo del botón si es necesario (ej: añadir un icono de flecha)
            header.classList.toggle('active');

            // 2. Mostrar u Ocultar el contenido
            if (content.style.maxHeight) {
                // Si maxHeight tiene un valor (está abierto), lo cerramos
                content.style.maxHeight = null;
                content.style.padding = '0 18px'; // Elimina el padding cuando está cerrado
            } else {
                // Si maxHeight es null (está cerrado), lo abrimos
                // Usamos scrollHeight para calcular la altura exacta del contenido
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.padding = '10px 18px 20px'; // Restaura el padding cuando está abierto
            }
        });
    });

});