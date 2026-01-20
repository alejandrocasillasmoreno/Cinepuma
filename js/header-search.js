// Lógica para el buscador del header en páginas secundarias
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('global-search-form');
    const searchInput = document.getElementById('global-search-input');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                // Determinar la profundidad para volver al index
                // Si estamos en html/detalle.html -> ../html/index.html (o ../index.html si index esta en raiz? No, index.html esta en html/ o raiz?)
                // El usuario tiene c:\xampp\htdocs\Cinepuma\html\index.html Y c:\xampp\htdocs\Cinepuma\js\index.js references ../html/index.html sometimes?
                // Vamos a usar una ruta absoluta relativa al dominio o calcularla.

                // Asumiendo estructura:
                // /Cinepuma/html/index.html
                // /Cinepuma/html/detalle.html
                // /Cinepuma/html/Generos/Genero_X/genero_x.html

                // Detectar si estamos en carpeta Generos (2 niveles profunda) o html (1 nivel)
                const path = window.location.pathname;
                let targetUrl = 'index.html'; // Default para html/detalle.html -> html/index.html

                if (path.includes('/Generos/')) {
                    targetUrl = '../../../html/index.html';
                } else if (path.includes('detalle.html') || path.includes('mejorValoradas.html') || path.includes('ayuda.html')) {
                    targetUrl = 'index.html'; // Mismo nivel
                }

                window.location.href = `${targetUrl}?search=${encodeURIComponent(query)}`;
            }
        });
    }
});
