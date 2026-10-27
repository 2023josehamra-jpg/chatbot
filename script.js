// Variables globales para el árbol de conversación y el recuerdo de elección
let arbolDecision = {};
let equipoFavorito = '';

// Referencias del DOM usando las clases requeridas por el boceto
const zonaMensajes = document.getElementById('zonas-de-mensajes');
const ingresoOpciones = document.getElementById('ingresos-de-opciones');

// Inicializar la carga del archivo JSON al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarArbolDecision();
});

// Carga el archivo arbol_decision.json con fetch
function cargarArbolDecision() {
    fetch('arbol_decision.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar la red');
            }
            return response.json();
        })
        .then(data => {
            arbolDecision = data;
            irANodo('inicio');
        })
        .catch(error => {
            console.error('Error al leer arbol_decision.json:', error);
            mostrarMensajeErrorServidor();
        });
}

// Muestra el mensaje obligatorio si falla el fetch por abriro sin servidor local
function mostrarMensajeErrorServidor() {
    zonaMensajes.innerHTML = '';
    ingresoOpciones.innerHTML = '';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'mensaje bot';
    errorDiv.style.backgroundColor = '#ef4444';
    errorDiv.style.color = '#ffffff';
    errorDiv.textContent = 'Abrí el proyecto con Live Server o un servidor local para que pueda leer arbol_decision.json.';

    zonaMensajes.appendChild(errorDiv);
}

// Navega al nodo seleccionado y actualiza la vista
function irANodo(idNodo) {
    const nodo = arbolDecision[idNodo];
    if (!nodo) {
        console.error('Nodo inexistente:', idNodo);
        return;
    }

    // Insertar el texto del bot personalizando si recordó una elección previamente
    let textoBot = nodo.texto;
    if (equipoFavorito && textoBot.includes('{equipo}')) {
        textoBot = textoBot.replace('{equipo}', equipoFavorito);
    }

    agregarMensajeBot(textoBot);
    ingresoOpciones.innerHTML = '';

    // Manejar inputs o navegación por botones
    if (nodo.requiereInput) {
        renderizarInput(nodo);
    } else if (nodo.opciones && nodo.opciones.length > 0) {
        nodo.opciones.forEach(opcion => {
            const boton = document.createElement('button');
            boton.className = 'opcion-btn';
            
            // Asignar clase especial para botones de salida
            if (opcion.siguiente === 'fin' || opcion.texto.includes('Terminar')) {
                boton.classList.add('salir');
            }

            boton.textContent = opcion.texto;
            boton.addEventListener('click', () => {
                agregarMensajeUsuario(opcion.texto);

                // Si esta opción guarda el equipo del usuario, recordarlo
                if (opcion.guardarEquipo) {
                    equipoFavorito = opcion.guardarEquipo;
                }

                irANodo(opcion.siguiente);
            });
            ingresoOpciones.appendChild(boton);
        });
    }
}

// Agrega la respuesta del bot a la zona de mensajes
function agregarMensajeBot(texto) {
    const msj = document.createElement('div');
    msj.className = 'mensaje bot';
    msj.textContent = texto;
    zonaMensajes.appendChild(msj);
    zonaMensajes.scrollTop = zonaMensajes.scrollHeight;
}

// Agrega la respuesta del usuario a la zona de mensajes
function agregarMensajeUsuario(texto) {
    const msj = document.createElement('div');
    msj.className = 'mensaje usuario';
    msj.textContent = texto;
    zonaMensajes.appendChild(msj);
    zonaMensajes.scrollTop = zonaMensajes.scrollHeight;
}

// Formulario exclusivo para cuando sea imperioso un campo de entrada
function renderizarInput(nodo) {
    const contenedor = document.createElement('div');
    contenedor.className = 'input-contenedor';

    const fila = document.createElement('div');
    fila.className = 'input-fila';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-datos';
    input.placeholder = nodo.placeholder || 'Escribe aquí...';

    const btnEnviar = document.createElement('button');
    btnEnviar.type = 'button';
    btnEnviar.className = 'opcion-btn';
    btnEnviar.textContent = 'Enviar';

    const msjError = document.createElement('span');
    msjError.className = 'msj-error';

    fila.appendChild(input);
    fila.appendChild(btnEnviar);
    contenedor.appendChild(fila);
    contenedor.appendChild(msjError);

    // Función de envío con validación
    const procesarEnvio = () => {
        const valor = input.value.trim();

        // Validar formato si es nombre/texto (que no tenga números)
        if (nodo.tipoValidacion === 'texto') {
            const tieneNumeros = /\d/.test(valor);
            if (!valor || tieneNumeros) {
                msjError.textContent = '⚠️ Ingresá un nombre válido (sin números).';
                return;
            }
        } else if (nodo.tipoValidacion === 'numero') {
            const esNumero = !isNaN(valor) && valor !== '';
            if (!esNumero) {
                msjError.textContent = '⚠️ Ingresá un valor numérico válido.';
                return;
            }
        }

        // Si valida correctamente
        if (nodo.guardarEleccion) {
            equipoFavorito = valor;
        }

        agregarMensajeUsuario(valor);
        irANodo(nodo.siguiente);
    };

    btnEnviar.addEventListener('click', procesarEnvio);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            procesarEnvio();
        }
    });

    ingresoOpciones.appendChild(contenedor);
}
