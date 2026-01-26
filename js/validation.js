const emailInput = document.querySelector('#email');

// Fase 3: Crear un contenedor para anuncios de error si no existe
const createErrorAnnouncer = (inputEl) => {
    let errorMsg = document.getElementById(inputEl.id + '-error');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.id = inputEl.id + '-error';
        // aria-live="assertive" hace que el lector de pantalla interrumpa para avisar del error
        errorMsg.setAttribute('aria-live', 'assertive');
        errorMsg.style.cssText = "color: #ff6b35; font-size: 0.9rem; margin-top: 5px; min-height: 1.2em;";
        inputEl.parentNode.insertBefore(errorMsg, inputEl.nextSibling);
    }
    return errorMsg;
};

if (emailInput) {
    emailInput.addEventListener('blur', () => {
        const errorAnnouncer = createErrorAnnouncer(emailInput);
        
        if (!emailInput.value.includes('@')) {
            // 1. Error visual (Animación)
            emailInput.classList.add('input-error');
            emailInput.setAttribute('aria-invalid', 'true'); // Indica el error al sistema
            
            // 2. Error auditivo (Anuncio de texto)
            errorAnnouncer.textContent = 'Error: Por favor, introduce un correo electrónico válido que contenga "@".';
            
            setTimeout(() => emailInput.classList.remove('input-error'), 400);
        } else {
            // Limpiar errores si es válido
            emailInput.setAttribute('aria-invalid', 'false');
            errorAnnouncer.textContent = '';
        }
    });
}