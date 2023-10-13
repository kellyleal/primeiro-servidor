export function validarNumeroDaConta(numero) {
    return numero && !isNaN(numero) && numero >= 0;
}
