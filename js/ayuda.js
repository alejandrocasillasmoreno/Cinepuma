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

//Video de fondo de ayuda.html
const video = document.getElementById('miVideo');
const playPauseBtn = document.getElementById('playPauseBtn');
const barraProgreso = document.getElementById('barraProgreso');
const barraContenedor = document.getElementById('barraContenedor');
const tiempoTexto = document.getElementById('tiempoTexto');
const volumenSlider = document.getElementById('volumenSlider');
const btnMute = document.getElementById('btnMute');
const videoPlayer = document.getElementById('videoPlayer'); // El contenedor
const btnFullScreen = document.getElementById('btnFullScreen');

// --- 1. ICONOS SVG (Para que se vean bien en todos los PC) ---
const ICONOS = {
    play: '<svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    volumenAlto: '<svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    mute: '<svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>'
};

// Cargar iconos iniciales
playPauseBtn.innerHTML = ICONOS.play;
btnMute.innerHTML = ICONOS.volumenAlto;
btnFullScreen.innerHTML = ICONOS.fullscreen;


// --- 2. LOGICA PLAY / PAUSE ---
playPauseBtn.addEventListener('click', () => {
    if (video.paused) {
        video.play();
        playPauseBtn.innerHTML = ICONOS.pause;
    } else {
        video.pause();
        playPauseBtn.innerHTML = ICONOS.play;
    }
});

// Sincronizar si el video se detiene solo
video.addEventListener('ended', () => {
    playPauseBtn.innerHTML = ICONOS.play;
});


// --- 3. BARRA DE PROGRESO Y TIEMPO ---
function formatearTiempo(segundos) {
    if (!segundos || isNaN(segundos)) return "00:00";
    const minutos = Math.floor(segundos / 60);
    const segs = Math.floor(segundos % 60);
    return `${minutos < 10 ? '0' + minutos : minutos}:${segs < 10 ? '0' + segs : segs}`;
}

video.addEventListener('timeupdate', () => {
    // Si la duración no está disponible, salimos para evitar errores
    if (!video.duration || isNaN(video.duration)) return;

    const porcentaje = (video.currentTime / video.duration) * 100;
    barraProgreso.style.width = porcentaje + '%';
    
    tiempoTexto.textContent = `${formatearTiempo(video.currentTime)} / ${formatearTiempo(video.duration)}`;
});

barraContenedor.addEventListener('click', (e) => {
    if (!video.duration) return;
    const anchoTotal = barraContenedor.offsetWidth;
    const posicionClick = e.offsetX;
    video.currentTime = (posicionClick / anchoTotal) * video.duration;
});

video.addEventListener('loadedmetadata', () => {
    tiempoTexto.textContent = `00:00 / ${formatearTiempo(video.duration)}`;
});


// --- 4. VOLUMEN ---
let ultimoVolumen = 1;

volumenSlider.addEventListener('input', (e) => {
    const valor = parseFloat(e.target.value); // Convertir a número
    video.volume = valor;

    if (valor === 0) {
        btnMute.innerHTML = ICONOS.mute;
    } else {
        btnMute.innerHTML = ICONOS.volumenAlto;
        ultimoVolumen = valor; 
    }
});

btnMute.addEventListener('click', () => {
    if (video.volume > 0) {
        ultimoVolumen = video.volume;
        video.volume = 0;
        volumenSlider.value = 0;
        btnMute.innerHTML = ICONOS.mute;
    } else {
        video.volume = ultimoVolumen || 1;
        volumenSlider.value = video.volume;
        btnMute.innerHTML = ICONOS.volumenAlto;
    }
});


// --- 5. PANTALLA COMPLETA (Arreglado) ---
btnFullScreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        // Entrar en pantalla completa (sobre el contenedor, NO el video)
        if (videoPlayer.requestFullscreen) {
            videoPlayer.requestFullscreen();
        } else if (videoPlayer.webkitRequestFullscreen) {
            videoPlayer.webkitRequestFullscreen();
        } else if (videoPlayer.msRequestFullscreen) {
            videoPlayer.msRequestFullscreen();
        }
    } else {
        // Salir
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
});