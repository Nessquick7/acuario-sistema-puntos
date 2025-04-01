const DB_NAME = "acuarioPuntosDB";
let currentClientId = null;
let filtroActual = null;
let terminoBusqueda = '';

function getDatabase() {
    const db = localStorage.getItem(DB_NAME);
    return db ? JSON.parse(db) : { clientes: [], nextId: 1 };
}

function saveDatabase(db) {
    localStorage.setItem(DB_NAME, JSON.stringify(db));
}

function guardarCliente() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const purchase = parseFloat(document.getElementById('purchase').value);

    // Validación 1: Campos vacíos
    if (!name || !phone) {
        alert("⚠️ Complete todos los campos obligatorios (Nombre y Teléfono)");
        return;
    }

    // Validación 2: Monto inválido
    if (isNaN(purchase) || purchase <= 0) {
        alert("⚠️ Ingrese un monto de compra válido (mayor a 0)");
        return;
    }

    const db = getDatabase();

    // Validación 3: Teléfono ya registrado (solo si hay clientes)
    if (db.clientes.length > 0 && db.clientes.some(c => c.phone === phone)) {
        alert("📱 Este teléfono ya está registrado");
        return;
    }

    // Crear nuevo cliente
    const puntos = purchase * 0.2; // Ratio del 40%
    const cliente = {
        id: db.nextId++,
        name,
        phone,
        purchases: [purchase],
        totalPurchases: purchase,
        points: puntos,
        puntosAjustados: 0, // Inicializar ajustes en 0
        historial: [{
            fecha: new Date().toLocaleString(),
            acciones: "Registro",
            monto: purchase,
            puntos: puntos,
            totalAnterior: 0,
            puntosAnteriores: 0
        }]
    };

    db.clientes.push(cliente);
    saveDatabase(db);

    // Verificar metas (código existente)
    const metas = [
        { valor: 30000, nombre: '30,000 puntos (Bronce) 🥉' },
        { valor: 60000, nombre: '60,000 puntos (Plata) 🥈' },
        { valor: 100000, nombre: '100,000 puntos (Oro) 🥇' }
    ];
    
    const maximaMeta = metas
        .filter(meta => cliente.points >= meta.valor)
        .pop();

    if (maximaMeta) {
        setTimeout(() => {
            mostrarNotificacion(cliente, maximaMeta.valor, maximaMeta.nombre);
        }, 1000);
    }

    // Feedback y limpieza
    alert(`✅ Cliente ID: ${cliente.id} registrado\nPuntos iniciales: ${cliente.points.toFixed(2)}`);
    document.getElementById('name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('purchase').value = '';

    actualizarVistas();
}

function buscarCliente() {
    const id = parseInt(document.getElementById('searchId').value);
    if (isNaN(id)) {
        alert("🔢 Ingrese un ID válido");
        return;
    }

    const db = getDatabase();
    const cliente = db.clientes.find(c => c.id === id);

    if (!cliente) {
        alert("🔍 Cliente no encontrado");
        return;
    }

    currentClientId = id;
    document.getElementById('currentId').textContent = id;
    document.getElementById('addPurchaseSection').style.display = 'block';
    document.getElementById('additionalPurchase').focus();
}

function agregarCompra() {
    if (!currentClientId) {
        alert("🔍 Primero busque un cliente");
        return;
    }

    const monto = parseFloat(document.getElementById('additionalPurchase').value);
    
    if (isNaN(monto)) {
        alert("⚠️ Ingrese un monto válido");
        return;
    }

    if (monto <= 0) {
        alert("⚠️ El monto debe ser mayor a 0");
        return;
    }

    const db = getDatabase();
    const cliente = db.clientes.find(c => c.id === currentClientId);

    if (!cliente) {
        alert("❌ Cliente no encontrado");
        return;
    }

    const puntosCompra = monto * 0.2; // Puntos de ESTA compra
    
    cliente.purchases.push(monto);
    cliente.totalPurchases += monto;
    
    // Calcula puntos TOTALES: (compras * ratio) + ajustes manuales
    cliente.points = (cliente.totalPurchases * 0.2) + (cliente.puntosAjustados || 0);
    
    cliente.historial.push({
        fecha: new Date().toLocaleString(),
        acciones: "Compra",
        monto: monto,
        puntos: puntosCompra,
        puntosAnteriores: cliente.points - puntosCompra,
        nuevoTotal: cliente.points
    });

    saveDatabase(db);
    
    // Verificar metas
    const metas = [
        { valor: 30000, nombre: '30,000 puntos (Bronce) 🥉' },
        { valor: 60000, nombre: '60,000 puntos (Plata) 🥈' },
        { valor: 100000, nombre: '100,000 puntos (Oro) 🥇' }
    ];
    
    const maximaMeta = metas
        .filter(meta => cliente.points >= meta.valor)
        .pop();

    if (maximaMeta) {
        setTimeout(() => {
            mostrarNotificacion(cliente, maximaMeta.valor, maximaMeta.nombre);
        }, 1000);
    }

    alert(`✅ Compra de $${monto.toFixed(2)} registrada\nPuntos agregados: ${puntosCompra.toFixed(2)}\nTotal puntos: ${cliente.points.toFixed(2)}`);
    document.getElementById('additionalPurchase').value = '';
    actualizarVistas();
}

function filtrarPorNombre() {
    const searchTerm = document.getElementById('searchName').value.trim().toLowerCase();
    if (!searchTerm) {
        alert("🔍 Ingrese un nombre para buscar");
        return;
    }

    filtroActual = 'nombre';
    terminoBusqueda = searchTerm;
    actualizarVistas();
}

function filtrarPorTelefono() {
    const searchTerm = document.getElementById('searchPhone').value.trim();
    if (!searchTerm) {
        alert("📱 Ingrese un teléfono para buscar");
        return;
    }

    filtroActual = 'telefono';
    terminoBusqueda = searchTerm;
    actualizarVistas();
}

function limpiarFiltros() {
    filtroActual = null;
    terminoBusqueda = '';
    document.getElementById('searchName').value = '';
    document.getElementById('searchPhone').value = '';
    actualizarVistas();
}

function resetearPuntos(id) {
    if (!confirm(`⚠️ ¿Resetear puntos y compras del cliente ID: ${id}?`)) return;

    const db = getDatabase();
    const cliente = db.clientes.find(c => c.id === id);
    
    if (cliente) {
        cliente.historial.push({
            fecha: new Date().toLocaleString(),
            acciones: "Reseteo",
            totalAnterior: cliente.totalPurchases,
            puntosAnteriores: cliente.points,
            comprasReseteadas: cliente.purchases.length
        });

        cliente.purchases = [];
        cliente.totalPurchases = 0;
        cliente.points = 0;

        saveDatabase(db);
        alert(`♻️ Puntos reseteados para ID: ${id}\nEl registro se guardó en el historial.`);
        actualizarVistas();
    }
}

function borrarCliente(id) {
    if (!confirm(`⚠️ ¿Borrar permanentemente al cliente ID: ${id}?`)) return;

    const db = getDatabase();
    db.clientes = db.clientes.filter(c => c.id !== id);
    saveDatabase(db);

    if (currentClientId === id) {
        document.getElementById('addPurchaseSection').style.display = 'none';
        currentClientId = null;
    }

    alert(`🗑️ Cliente eliminado`);
    actualizarVistas();
}

function resetearSistema() {
    if (!confirm("⚠️ ¿ESTÁ SEGURO QUE QUIERE REINICIAR TODO EL SISTEMA?\n\nEsto borrará TODOS los clientes y comenzará con ID=1.\n\nEsta acción NO se puede deshacer.")) {
        return;
    }
    
    const db = {
        clientes: [],
        nextId: 1
    };
    
    localStorage.setItem(DB_NAME, JSON.stringify(db));
    currentClientId = null;

    document.getElementById('name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('purchase').value = '';
    document.getElementById('searchId').value = '';
    document.getElementById('additionalPurchase').value = '';
    document.getElementById('addPurchaseSection').style.display = 'none';
    
    alert("✅ Sistema reiniciado correctamente\n\nAhora comenzarás con ID=1");
    actualizarVistas();
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId).parentElement;
    section.classList.toggle('section-collapsed');

    const icon = section.querySelector('.toggle-icon');
    if (section.classList.contains('section-collapsed')) {
        icon.textContent = '▶';
    } else {
        icon.textContent = '▼';
    }
}

function toggleHistorial(id) {
    const historial = document.getElementById(`historial-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    
    if (historial.style.display === 'none' || !historial.style.display) {
        historial.style.display = 'table-row';
        icon.textContent = '▼';
    } else {
        historial.style.display = 'none';
        icon.textContent = '▶';
    }
}

function generarHtmlHistorial(cliente) {
    if (cliente.historial.length === 0) {
        return '<p>No hay registros históricos</p>';
    }

    let html = `
    <table class="historial-table">
        <tr>
            <th>Fecha</th>
            <th>Acción</th>
            <th>Detalle</th>
            <th>Puntos</th>
            <th style="width:40px;"></th>
        </tr>`;

    [...cliente.historial].reverse().forEach((registro, index) => {
        const originalIndex = cliente.historial.length - 1 - index;
        
        html += `
        <tr>
            <td>${registro.fecha}</td>
            <td>${registro.acciones}</td>
            <td>${
                registro.acciones === 'Compra' ? `$${registro.monto.toFixed(2)}` :
                registro.acciones === 'Registro' ? `Registro inicial` :
                registro.acciones === 'Reseteo' ? `Reset: ${registro.comprasReseteadas} compras (Total: $${registro.totalAnterior.toFixed(2)})` :
                registro.acciones === 'Edición' ? `${registro.detalle}` :
                registro.acciones === 'Puntos Restados' ? `Puntos restados: ${Math.abs(registro.puntos).toFixed(2)}` :
                '--'
            }</td>
            <td>${
                registro.acciones === 'Reseteo' ? 
                `${registro.puntosAnteriores.toFixed(2)} pts (reseteados)` :
                registro.acciones === 'Puntos Restados' ?
                `-${Math.abs(registro.puntos).toFixed(2)} pts (Nuevo total: ${registro.nuevoTotal.toFixed(2)})` :
                registro.puntos ? `${registro.puntos.toFixed(2)} pts` : '--'
            }</td>
            <td><span class="delete-historial-btn" onclick="eliminarRegistroHistorial(${cliente.id}, ${originalIndex})">🗑️</span></td>
        </tr>`;
    });

    return html + '</table>';
}

function actualizarTabla() {
    const db = getDatabase();
    const tbody = document.querySelector('#clientesTable tbody');
    tbody.innerHTML = '';

    let clientesFiltrados = [...db.clientes];
    let mensajeFiltro = '';

    if (filtroActual === 'nombre') {
        clientesFiltrados = db.clientes.filter(cliente => 
            cliente.name.toLowerCase().includes(terminoBusqueda)
        );
        mensajeFiltro = `Mostrando resultados para nombre: "${terminoBusqueda}" (${clientesFiltrados.length} clientes)`;
    } else if (filtroActual === 'telefono') {
        clientesFiltrados = db.clientes.filter(cliente => 
            cliente.phone.includes(terminoBusqueda)
        );
        mensajeFiltro = `Mostrando resultados para teléfono: "${terminoBusqueda}" (${clientesFiltrados.length} clientes)`;
    }

    const filtroInfo = document.getElementById('filtroInfo');
    if (filtroActual) {
        filtroInfo.textContent = mensajeFiltro;
        filtroInfo.style.display = 'block';
    } else {
        filtroInfo.style.display = 'none';
    }

    if (clientesFiltrados.length === 0) {
        const noResults = document.createElement('tr');
        noResults.innerHTML = `
            <td colspan="6" style="text-align:center;">
                ${filtroActual ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </td>
        `;
        tbody.appendChild(noResults);
        return;
    }

    clientesFiltrados.forEach(cliente => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span id="icon-${cliente.id}" onclick="toggleHistorial(${cliente.id})" 
                      style="cursor:pointer;margin-right:8px;">▶</span>
                ${cliente.id}
            </td>
            <td>
                <span id="nombre-${cliente.id}">${cliente.name}</span>
                <button onclick="editarNombre(${cliente.id})" class="edit-btn">✏️</button>
            </td>
            <td>${cliente.phone}</td>
            <td>$${cliente.totalPurchases.toFixed(2)}</td>
            <td>${cliente.points.toFixed(2)} pts</td>
            <td>
                <button onclick="restarPuntos(${cliente.id})" class="subtract-btn">➖ Quitar puntos</button>
                <button onclick="resetearPuntos(${cliente.id})" class="reset-btn">♻️ Resetear</button>
                <button onclick="borrarCliente(${cliente.id})" class="delete-btn">🗑️ Borrar</button>
            </td>
        `;
        tbody.appendChild(row);

        const historialRow = document.createElement('tr');
        historialRow.id = `historial-${cliente.id}`;
        historialRow.style.display = 'none';
        historialRow.innerHTML = `
            <td colspan="6" style="padding:0;">
                <div class="historial-container">
                    ${generarHtmlHistorial(cliente)}
                </div>
            </td>
        `;
        tbody.appendChild(historialRow);
    });
}

function actualizarScoreboard() {
    const db = getDatabase();
    const topClientsContainer = document.getElementById('topClients');
    
    const topClientes = [...db.clientes]
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);

    let html = '';
    topClientes.forEach((cliente, index) => {
        const positionEmoji = ['🥇', '🥈', '🥉', '🏅', '🏅'][index];
        html += `
            <div class="top-client">
                <div>
                    <strong>${positionEmoji} ${cliente.name}</strong><br>
                    <small>ID: ${cliente.id}</small>
                </div>
                <div style="text-align:right;">
                    <strong>${cliente.points.toFixed(2)} pts</strong><br>
                    <small>$${cliente.totalPurchases.toFixed(2)}</small>
                </div>
            </div>
        `;
    });

    topClientsContainer.innerHTML = html || '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.7)">No hay datos</div>';
}

function actualizarVistas() {
    actualizarTabla();
    actualizarScoreboard();
}

function exportarAExcel() {
    const db = getDatabase();
    if (db.clientes.length === 0) {
        alert("No hay clientes para exportar");
        return;
    }

    let clientesAExportar = [...db.clientes];
    if (filtroActual === 'nombre') {
        clientesAExportar = db.clientes.filter(cliente => 
            cliente.name.toLowerCase().includes(terminoBusqueda)
        );
    } else if (filtroActual === 'telefono') {
        clientesAExportar = db.clientes.filter(cliente => 
            cliente.phone.includes(terminoBusqueda)
        );
    }

    clientesAExportar.sort((a, b) => a.id - b.id);

    let csvContent = "ID;Nombre;Teléfono;Total Compras;Puntos\n";
    
    clientesAExportar.forEach(cliente => {
        csvContent += `${cliente.id};"${cliente.name}";${cliente.phone};${cliente.totalPurchases.toFixed(2).replace('.', ',')};${cliente.points.toFixed(2).replace('.', ',')}\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Clientes_Acuario_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportarTablero() {
    const loading = document.createElement('div');
    loading.textContent = 'Generando imagen...';
    loading.style.position = 'fixed';
    loading.style.top = '20px';
    loading.style.left = '50%';
    loading.style.transform = 'translateX(-50%)';
    loading.style.background = '#3b82f6';
    loading.style.color = 'white';
    loading.style.padding = '10px 20px';
    loading.style.borderRadius = '5px';
    loading.style.zIndex = '10000';
    document.body.appendChild(loading);

    // Clonamos el scoreboard pero modificamos su contenido
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '500px';
    
    const scoreboardClone = document.querySelector('.scoreboard').cloneNode(true);
    const topClientsClone = scoreboardClone.querySelector('#topClients').cloneNode(true);
    
    // Eliminamos los IDs de cada cliente en el clon
    const clientsElements = topClientsClone.querySelectorAll('.top-client');
    clientsElements.forEach(client => {
        const smallElements = client.querySelectorAll('small');
        smallElements.forEach(el => {
            if (el.textContent.includes('ID:')) {
                el.remove(); // Eliminamos el elemento que muestra el ID
            }
        });
    });
    
    // Reconstruimos el scoreboard clonado sin IDs
    scoreboardClone.innerHTML = '';
    scoreboardClone.style.background = 'linear-gradient(135deg, #1e3a8a, #3b82f6)';
    scoreboardClone.style.borderRadius = '15px';
    scoreboardClone.style.padding = '20px';
    scoreboardClone.style.color = 'white';
    scoreboardClone.style.border = '2px solid #93c5fd';
    
    const title = document.createElement('h2');
    title.textContent = '🐠 TOP 5 ACUARISTAS 🐠';
    title.style.marginBottom = '15px';
    
    const fecha = document.createElement('div');
    fecha.textContent = new Date().toLocaleDateString('es-AR', {
        weekday: 'long', 
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    fecha.style.textAlign = 'center';
    fecha.style.marginTop = '15px';
    fecha.style.paddingTop = '15px';
    fecha.style.borderTop = '2px dashed rgba(255, 255, 255, 0.3)';
    fecha.style.fontWeight = 'bold';
    fecha.style.fontSize = '16px';
    
    scoreboardClone.appendChild(title);
    scoreboardClone.appendChild(topClientsClone);
    scoreboardClone.appendChild(fecha);
    
    container.appendChild(scoreboardClone);
    document.body.appendChild(container);

    html2canvas(container, {
        backgroundColor: null,
        scale: 2,
        logging: true,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `TOP5_Clientes_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        document.body.removeChild(container);
        document.body.removeChild(loading);
    }).catch(err => {
        console.error('Error al generar imagen:', err);
        document.body.removeChild(loading);
    });
}

function eliminarRegistroHistorial(clienteId, registroIndex) {
    if (!confirm('¿Eliminar este registro permanentemente?\nEsta acción no se puede deshacer.')) {
        return;
    }

    const db = getDatabase();
    const cliente = db.clientes.find(c => c.id === clienteId);
    
    if (cliente && cliente.historial[registroIndex]) {
        const registro = cliente.historial[registroIndex];
        
        if (registro.acciones === 'Compra') {
            cliente.totalPurchases -= registro.monto || 0;
            cliente.points = cliente.totalPurchases * 0.2;
        }
        
        cliente.historial.splice(registroIndex, 1);
        
        if (registro.acciones === 'Registro') {
            const primeraCompra = cliente.historial.find(r => r.acciones === 'Compra');
            if (primeraCompra) {
                primeraCompra.acciones = 'Registro';
            }
        }
        
        saveDatabase(db);
        actualizarVistas();
        alert('Registro eliminado correctamente');
    } else {
        alert('Error: No se encontró el registro');
    }
}

function mostrarClientesPorPuntos(minPuntos, maxPuntos, categoria) {
    const db = getDatabase();
    let clientesFiltrados = db.clientes.filter(cliente => {
        if (maxPuntos === null) {
            return cliente.points >= minPuntos;
        }
        return cliente.points >= minPuntos && cliente.points <= maxPuntos;
    });

    clientesFiltrados.sort((a, b) => b.points - a.points);

    const modal = document.getElementById('modalFiltro');
    const titulo = document.getElementById('modalTitulo');
    const tbody = document.querySelector('#modalTabla tbody');
    
    // Resetear animaciones
    modal.style.animation = 'none';
    void modal.offsetWidth; // Trigger reflow
    modal.style.animation = null;
    
    tbody.innerHTML = '';

    clientesFiltrados.forEach((cliente, index) => {
        const row = document.createElement('tr');
        row.style.animationDelay = `${index * 0.1 + 0.2}s`;
        row.innerHTML = `
            <td>${cliente.id}</td>
            <td>${cliente.name}</td>
            <td>${cliente.phone}</td>
            <td>$${cliente.totalPurchases.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
            <td>${cliente.points.toLocaleString('es-AR', {minimumFractionDigits: 2})} pts</td>
        `;
        tbody.appendChild(row);
    });

    modal.className = `modal-filtro modal-${categoria}`;
    
    // Configurar título según categoría
    const configCategoria = {
        gold: {
            emoji: '🥇',
            nombre: 'ORO',
            min: '100,000+',
            color: '#f59e0b'
        },
        silver: {
            emoji: '🥈',
            nombre: 'PLATA',
            min: '60,000',
            max: '100,000',
            color: '#94a3b8'
        },
        bronze: {
            emoji: '🥉',
            nombre: 'BRONCE',
            min: '30,000',
            max: '60,000',
            color: '#b45309'
        }
    };
    
    const config = configCategoria[categoria];
    let tituloText = `${config.emoji} CLIENTES ${config.nombre}`;
    
    if (config.max) {
        tituloText += ` (${config.min} - ${config.max} PUNTOS)`;
    } else {
        tituloText += ` (${config.min} PUNTOS)`;
    }
    
    tituloText += ` <small style="font-size:0.7em;color:${config.color}">${clientesFiltrados.length} clientes</small>`;
    
    titulo.innerHTML = tituloText;
    modal.style.display = 'flex';
    
}

function cerrarModal() {
    document.getElementById('modalFiltro').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarVistas();
    document.getElementById('searchId').value = '';

    document.getElementById('resetSystemBtn').addEventListener('click', resetearSistema);
    document.getElementById('exportExcelBtn').addEventListener('click', exportarAExcel);
    document.getElementById('exportTopClients').addEventListener('click', exportarTablero);

    document.querySelectorAll('.section-content').forEach(section => {
        section.parentElement.classList.remove('section-collapsed');
    });
});

window.addEventListener('click', function(event) {
    const modal = document.getElementById('modalFiltro');
    if (event.target === modal) {
        cerrarModal();
    }
});

document.querySelector('.modal-contenido').addEventListener('click', function(e) {
    e.stopPropagation();
});

function editarNombre(id) {
    const db = getDatabase();
    const cliente = db.clientes.find(c => c.id === id);
    if (!cliente) return;

    const nombreElement = document.getElementById(`nombre-${id}`);
    const nuevoNombre = prompt("Editar nombre del cliente:", cliente.name);
    
    if (nuevoNombre && nuevoNombre.trim() !== "" && nuevoNombre !== cliente.name) {
        cliente.name = nuevoNombre.trim();
        
        // Registrar en el historial
        cliente.historial.push({
            fecha: new Date().toLocaleString(),
            acciones: "Edición",
            detalle: `Nombre cambiado de "${cliente.name}" a "${nuevoNombre}"`
        });
        
        saveDatabase(db);
        actualizarVistas();
    }
}

function restarPuntos(id) {
    const db = getDatabase();
    const cliente = db.clientes.find(c => c.id === id);
    
    if (!cliente) {
        alert("❌ Cliente no encontrado");
        return;
    }
    
    if (cliente.points <= 0) {
        alert("ℹ️ El cliente no tiene puntos disponibles");
        return;
    }

    const puntosARestar = parseFloat(
        prompt(`Puntos disponibles: ${cliente.points.toFixed(2)}\n\nIngrese la cantidad a restar:`)
    );

    if (isNaN(puntosARestar) || puntosARestar <= 0) {
        alert("⚠️ Ingrese un valor numérico mayor a 0");
        return;
    }

    if (puntosARestar > cliente.points) {
        alert(`❌ No puede restar más puntos (${puntosARestar.toFixed(2)}) de los disponibles (${cliente.points.toFixed(2)})`);
        return;
    }

    // Registrar ajuste manteniendo la base de compras
    cliente.puntosAjustados = (cliente.puntosAjustados || 0) - puntosARestar;
    cliente.points = (cliente.totalPurchases * 0.2) + (cliente.puntosAjustados || 0);
    
    cliente.historial.push({
        fecha: new Date().toLocaleString(),
        acciones: "Puntos Restados",
        puntos: -puntosARestar,
        puntosAnteriores: cliente.points + puntosARestar,
        nuevoTotal: cliente.points
    });

    saveDatabase(db);
    actualizarVistas();
    alert(`➖ Se restaron ${puntosARestar.toFixed(2)} puntos\nNuevo total: ${cliente.points.toFixed(2)} pts`);
}

function mostrarNotificacion(cliente, puntosMinimos, premio) {
    const overlay = document.createElement('div');
    overlay.className = 'notificacion-overlay';
    
    // Determinar el icono según el premio
    let trofeo = '🏆';
    if (puntosMinimos >= 100000) trofeo = '🥇';
    else if (puntosMinimos >= 60000) trofeo = '🥈';
    else if (puntosMinimos >= 30000) trofeo = '🥉';
    
    overlay.innerHTML = `
        <div class="notificacion-contenido">
            <span class="cerrar-notificacion">&times;</span>
            <div class="trofeo-icono">${trofeo}</div>
            <div class="notificacion-titulo">¡NUEVO LOGRO ALCANZADO!</div>
            <div class="notificacion-mensaje">
                <span class="meta-alcanzada">${cliente.name}</span>
                ha alcanzado el nivel:
                <div class="premio-destacado">${premio}</div>
                <div class="puntos-actuales">
                    Puntos actuales: ${cliente.points.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                </div>
            </div>
        </div>
    `;

    overlay.querySelector('.cerrar-notificacion').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    document.body.appendChild(overlay);

    // Cerrar automáticamente después de 8 segundos
    setTimeout(() => {
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
    }, 8000);
}