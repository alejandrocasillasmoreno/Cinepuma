const emailInput = document.querySelector('#email');

emailInput.addEventListener('blur', () => {
    if (!emailInput.value.includes('@')) {
        emailInput.classList.add('input-error');
        // Quitar la clase después de la animación para poder repetirla
        setTimeout(() => emailInput.classList.remove('input-error'), 400);
    }
});