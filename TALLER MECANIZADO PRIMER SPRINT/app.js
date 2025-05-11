// Base de datos en localStorage
        const DB = {
            usuarios: [],
            clientes: [],
            trabajos: [],
            pagos: [],
            
            init() {
                // Cargar datos del localStorage
                this.usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
                this.clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
                this.trabajos = JSON.parse(localStorage.getItem('trabajos') || '[]');
                this.pagos = JSON.parse(localStorage.getItem('pagos') || '[]');
                
                // Si no hay usuarios, crear uno de prueba
                if (this.usuarios.length === 0) {
                    this.usuarios.push({
                        id: 1,
                        nombre: 'Administrador',
                        usuario: 'admin',
                        password: CryptoJS.SHA256('admin').toString()
                    });
                    this.saveUsuarios();
                }
            },
            
            saveUsuarios() {
                localStorage.setItem('usuarios', JSON.stringify(this.usuarios));
            },
            
            saveClientes() {
                localStorage.setItem('clientes', JSON.stringify(this.clientes));
            },
            
            saveTrabajos() {
                localStorage.setItem('trabajos', JSON.stringify(this.trabajos));
            },
            
            savePagos() {
                localStorage.setItem('pagos', JSON.stringify(this.pagos));
            }
        };

        // Inicializar la base de datos
        DB.init();

        // Variables globales
        let currentUser = null;
        let currentTrabajoId = null;

        // Elementos DOM
        const loginContainer = document.getElementById('loginContainer');
        const dashboardContainer = document.getElementById('dashboardContainer');
        const userWelcome = document.getElementById('userWelcome');
        const trabajosTableBody = document.getElementById('trabajosTableBody');
        const clienteFormContainer = document.getElementById('clienteFormContainer');
        const trabajoFormContainer = document.getElementById('trabajoFormContainer');
        const trabajoDetalleContainer = document.getElementById('trabajoDetalleContainer');
        const trabajosListaContainer = document.getElementById('trabajosListaContainer');
        const trabajoCliente = document.getElementById('trabajoCliente');
        const requiereFactura = document.getElementById('requiereFactura');
        const facturaContainer = document.getElementById('facturaContainer');
        const registrarPagoModal = new bootstrap.Modal(document.getElementById('registrarPagoModal'));

        // Event Listeners
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
        document.getElementById('registerForm').addEventListener('submit', handleRegister);
        document.getElementById('logoutBtn').addEventListener('submit', handleLogout);
        document.getElementById('nuevoClienteBtn').addEventListener('click', showClienteForm);
        document.getElementById('nuevoTrabajoBtn').addEventListener('click', showTrabajoForm);
        document.getElementById('cancelarClienteBtn').addEventListener('click', showTrabajosList);
        document.getElementById('cancelarTrabajoBtn').addEventListener('click', showTrabajosList);
        document.getElementById('clienteForm').addEventListener('submit', handleClienteSubmit);
        document.getElementById('trabajoForm').addEventListener('submit', handleTrabajoSubmit);
        document.getElementById('volverBtn').addEventListener('click', showTrabajosList);
        document.getElementById('registrarPagoBtn').addEventListener('click', showRegistrarPagoModal);
        document.getElementById('guardarPagoBtn').addEventListener('click', handlePagoSubmit);
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        document.getElementById('editarTrabajoBtn').addEventListener('click', handleEditarTrabajo);
        
        // Toggle factura container
        requiereFactura.addEventListener('change', function() {
            facturaContainer.style.display = this.checked ? 'block' : 'none';
        });

        // Funciones de autenticación
        function handleLogin(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            const hashedPassword = CryptoJS.SHA256(password).toString();
            
            const user = DB.usuarios.find(u => u.usuario === username && u.password === hashedPassword);
            
            if (user) {
                currentUser = user;
                showDashboard();
            } else {
                alert('Usuario o contraseña incorrectos');
            }
        }

        function handleRegister(e) {
            e.preventDefault();
            
            const nombre = document.getElementById('registerNombre').value;
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden');
                return;
            }
            
            // Verificar si el usuario ya existe
            if (DB.usuarios.some(u => u.usuario === username)) {
                alert('El nombre de usuario ya existe');
                return;
            }
            
            // Crear nuevo usuario
            const newUser = {
                id: DB.usuarios.length > 0 ? Math.max(...DB.usuarios.map(u => u.id)) + 1 : 1,
                nombre,
                usuario: username,
                password: CryptoJS.SHA256(password).toString()
            };
            
            DB.usuarios.push(newUser);
            DB.saveUsuarios();
            
            alert('Usuario registrado correctamente');
            
            // Cambiar a la pestaña de login
            document.getElementById('login-tab').click();
        }

        function handleLogout() {
            currentUser = null;
            showLoginForm();
        }

        // Funciones de navegación
        function showLoginForm() {
            loginContainer.style.display = 'block';
            dashboardContainer.style.display = 'none';
        }

        function showDashboard() {
            loginContainer.style.display = 'none';
            dashboardContainer.style.display = 'block';
            userWelcome.textContent = `Bienvenido, ${currentUser.nombre}`;
            
            showTrabajosList();
        }

        function showTrabajosList() {
            trabajosListaContainer.style.display = 'block';
            clienteFormContainer.style.display = 'none';
            trabajoFormContainer.style.display = 'none';
            trabajoDetalleContainer.style.display = 'none';
            
            loadTrabajos();
        }

        function showClienteForm() {
            trabajosListaContainer.style.display = 'none';
            clienteFormContainer.style.display = 'block';
            trabajoFormContainer.style.display = 'none';
            trabajoDetalleContainer.style.display = 'none';
            
            // Limpiar formulario
            document.getElementById('clienteForm').reset();
        }

        function showTrabajoForm() {
            trabajosListaContainer.style.display = 'none';
            clienteFormContainer.style.display = 'none';
            trabajoFormContainer.style.display = 'block';
            trabajoDetalleContainer.style.display = 'none';
            
            // Limpiar formulario
            document.getElementById('trabajoForm').reset();
            facturaContainer.style.display = 'none';
            
            // Cargar clientes
            loadClientesSelect();
        }

        function showTrabajoDetalle(trabajoId) {
            trabajosListaContainer.style.display = 'none';
            clienteFormContainer.style.display = 'none';
            trabajoFormContainer.style.display = 'none';
            trabajoDetalleContainer.style.display = 'block';
            
            currentTrabajoId = trabajoId;
            loadTrabajoDetalle(trabajoId);
        }

        function showRegistrarPagoModal() {
            const trabajo = DB.trabajos.find(t => t.id === currentTrabajoId);
            
            if (!trabajo) return;
            
            if (trabajo.saldo <= 0) {
                alert('Este trabajo ya está pagado completamente');
                return;
            }
            
            document.getElementById('saldoPendiente').textContent = trabajo.saldo.toFixed(2);
            document.getElementById('pagoMonto').max = trabajo.saldo;
            document.getElementById('pagoMonto').value = '';
            
            registrarPagoModal.show();
        }

        // Funciones de carga de datos
        function loadTrabajos() {
            trabajosTableBody.innerHTML = '';
            
            const trabajosUsuario = DB.trabajos.filter(t => t.usuario_id === currentUser.id);
            
            if (trabajosUsuario.length === 0) {
                trabajosTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">No hay trabajos registrados</td>
                    </tr>
                `;
                return;
            }
            
            trabajosUsuario.forEach(trabajo => {
                const cliente = DB.clientes.find(c => c.id === trabajo.cliente_id);
                const clienteNombre = cliente ? cliente.nombre : 'Cliente desconocido';
                
                const row = document.createElement('tr');
                row.className = 'trabajo-item';
                row.addEventListener('click', () => showTrabajoDetalle(trabajo.id));
                
                let badgeClass = '';
                switch (trabajo.estado) {
                    case 'Pendiente': badgeClass = 'badge-pendiente'; break;
                    case 'En Proceso': badgeClass = 'badge-proceso'; break;
                    case 'Terminado': badgeClass = 'badge-terminado'; break;
                    case 'Entregado': badgeClass = 'badge-entregado'; break;
                }
                
                row.innerHTML = `
                    <td>${trabajo.id}</td>
                    <td>${clienteNombre}</td>
                    <td>${trabajo.descripcion.substring(0, 30)}${trabajo.descripcion.length > 30 ? '...' : ''}</td>
                    <td>${new Date(trabajo.fecha_creacion).toLocaleDateString()}</td>
                    <td>$${trabajo.valor_total.toFixed(2)}</td>
                    <td class="${trabajo.saldo > 0 ? 'saldo-positivo' : 'saldo-cero'}">$${trabajo.saldo.toFixed(2)}</td>
                    <td><span class="badge ${badgeClass}">${trabajo.estado}</span></td>
                `;
                
                trabajosTableBody.appendChild(row);
            });
        }

        function loadClientesSelect() {
            trabajoCliente.innerHTML = '<option value="">Seleccione un cliente</option>';
            
            const clientesUsuario = DB.clientes.filter(c => c.usuario_id === currentUser.id);
            
            clientesUsuario.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = cliente.nombre;
                trabajoCliente.appendChild(option);
            });
        }

        function loadTrabajoDetalle(trabajoId) {
            const trabajo = DB.trabajos.find(t => t.id === trabajoId);
            
            if (!trabajo) {
                alert('Trabajo no encontrado');
                showTrabajosList();
                return;
            }
            
            const cliente = DB.clientes.find(c => c.id === trabajo.cliente_id);
            
            // Actualizar información del trabajo
            document.getElementById('trabajoDetalleId').textContent = trabajo.id;
            document.getElementById('detalleCliente').textContent = cliente ? cliente.nombre : 'Cliente desconocido';
            
            const detalleEstado = document.getElementById('detalleEstado');
            detalleEstado.textContent = trabajo.estado;
            
            let badgeClass = '';
            switch (trabajo.estado) {
                case 'Pendiente': badgeClass = 'badge-pendiente'; break;
                case 'En Proceso': badgeClass = 'badge-proceso'; break;
                case 'Terminado': badgeClass = 'badge-terminado'; break;
                case 'Entregado': badgeClass = 'badge-entregado'; break;
            }
            detalleEstado.className = `badge ${badgeClass}`;
            
            document.getElementById('detalleFecha').textContent = new Date(trabajo.fecha_creacion).toLocaleDateString();
            document.getElementById('detalleValor').textContent = `$${trabajo.valor_total.toFixed(2)}`;
            
            const detalleSaldo = document.getElementById('detalleSaldo');
            detalleSaldo.textContent = `$${trabajo.saldo.toFixed(2)}`;
            detalleSaldo.className = trabajo.saldo > 0 ? 'saldo-positivo' : 'saldo-cero';
            
            document.getElementById('detalleDescripcion').textContent = trabajo.descripcion;
            
            // Mostrar factura si es necesario
            if (trabajo.requiere_factura) {
                document.getElementById('detalleFacturaContainer').style.display = 'block';
                document.getElementById('detalleFactura').textContent = trabajo.factura_electronica || 'No registrada';
            } else {
                document.getElementById('detalleFacturaContainer').style.display = 'none';
            }
            
            // Cargar pagos
            const pagosTableBody = document.getElementById('pagosTableBody');
            pagosTableBody.innerHTML = '';
            
            const pagosDelTrabajo = DB.pagos.filter(p => p.trabajo_id === trabajo.id);
            
            if (pagosDelTrabajo.length === 0) {
                document.getElementById('noPagosMessage').style.display = 'block';
            } else {
                document.getElementById('noPagosMessage').style.display = 'none';
                
                pagosDelTrabajo.forEach(pago => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${new Date(pago.fecha).toLocaleDateString()}</td>
                        <td>$${pago.monto.toFixed(2)}</td>
                    `;
                    pagosTableBody.appendChild(row);
                });
            }
            
            // Habilitar/deshabilitar botón de pago
            document.getElementById('registrarPagoBtn').disabled = trabajo.saldo <= 0;
        }

        // Funciones de manejo de formularios
        function handleClienteSubmit(e) {
            e.preventDefault();
            
            const nombre = document.getElementById('clienteNombre').value;
            const telefono = document.getElementById('clienteTelefono').value;
            
            // Crear nuevo cliente
            const newCliente = {
                id: DB.clientes.length > 0 ? Math.max(...DB.clientes.map(c => c.id)) + 1 : 1,
                nombre,
                telefono,
                usuario_id: currentUser.id
            };
            
            DB.clientes.push(newCliente);
            DB.saveClientes();
            
            alert('Cliente registrado correctamente');
            showTrabajosList();
        }

        function handleTrabajoSubmit(e) {
            e.preventDefault();
            
            const clienteId = parseInt(document.getElementById('trabajoCliente').value);
            const descripcion = document.getElementById('trabajoDescripcion').value;
            const valorTotal = parseFloat(document.getElementById('trabajoValor').value);
            const estado = document.getElementById('trabajoEstado').value;
            const requiereFacturaCheck = document.getElementById('requiereFactura').checked;
            const facturaElectronica = requiereFacturaCheck ? document.getElementById('facturaNumero').value : null;
            
            if (!clienteId) {
                alert('Debe seleccionar un cliente');
                return;
            }
            
            // Crear nuevo trabajo
            const newTrabajo = {
                id: DB.trabajos.length > 0 ? Math.max(...DB.trabajos.map(t => t.id)) + 1 : 1,
                cliente_id: clienteId,
                descripcion,
                fecha_creacion: new Date().toISOString(),
                valor_total: valorTotal,
                saldo: valorTotal, // Saldo inicial igual al valor total
                estado,
                requiere_factura: requiereFacturaCheck,
                factura_electronica: facturaElectronica,
                usuario_id: currentUser.id
            };
            
            DB.trabajos.push(newTrabajo);
            DB.saveTrabajos();
            
            alert('Trabajo registrado correctamente');
            showTrabajosList();
        }

        function handlePagoSubmit() {
            const monto = parseFloat(document.getElementById('pagoMonto').value);
            const trabajo = DB.trabajos.find(t => t.id === currentTrabajoId);
            
            if (!trabajo) return;
            
            if (isNaN(monto) || monto <= 0) {
                alert('Ingrese un monto válido mayor que cero');
                return;
            }
            
            if (monto > trabajo.saldo) {
                alert('El monto no puede ser mayor al saldo pendiente');
                return;
            }
            
            // Crear nuevo pago
            const newPago = {
                id: DB.pagos.length > 0 ? Math.max(...DB.pagos.map(p => p.id)) + 1 : 1,
                trabajo_id: currentTrabajoId,
                monto,
                fecha: new Date().toISOString()
            };
            
            DB.pagos.push(newPago);
            DB.savePagos();
            
            // Actualizar saldo del trabajo
            trabajo.saldo -= monto;
            DB.saveTrabajos();
            
            registrarPagoModal.hide();
            alert('Pago registrado correctamente');
            
            // Recargar detalle del trabajo
            loadTrabajoDetalle(currentTrabajoId);
        }

        function handleEditarTrabajo() {
    const trabajo = DB.trabajos.find(t => t.id === currentTrabajoId);
    if (!trabajo) {
        alert('Trabajo no encontrado');
        return;
    }

    // Mostrar formulario con los datos actuales
    showTrabajoForm();

    document.getElementById('trabajoCliente').value = trabajo.cliente_id;
    document.getElementById('trabajoDescripcion').value = trabajo.descripcion;
    document.getElementById('trabajoValor').value = trabajo.valor_total;
    document.getElementById('trabajoEstado').value = trabajo.estado;
    document.getElementById('requiereFactura').checked = trabajo.requiere_factura;
    if (trabajo.requiere_factura) {
        facturaContainer.style.display = 'block';
        document.getElementById('facturaNumero').value = trabajo.factura_electronica || '';
    }

    // Cambiar texto del botón y comportamiento del submit
    const trabajoForm = document.getElementById('trabajoForm');
    const submitBtn = trabajoForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Actualizar Trabajo';

    trabajoForm.onsubmit = function (e) {
        e.preventDefault();

        const clienteId = parseInt(document.getElementById('trabajoCliente').value);
        const descripcion = document.getElementById('trabajoDescripcion').value.trim();
        const valorTotal = parseFloat(document.getElementById('trabajoValor').value);
        const estado = document.getElementById('trabajoEstado').value;

        let isValid = true;

        if (!clienteId) {
            isValid = false;
            document.getElementById('trabajoCliente').classList.add('is-invalid');
        } else {
            document.getElementById('trabajoCliente').classList.remove('is-invalid');
        }

        if (!descripcion) {
            isValid = false;
            document.getElementById('trabajoDescripcion').classList.add('is-invalid');
        } else {
            document.getElementById('trabajoDescripcion').classList.remove('is-invalid');
        }

        if (isNaN(valorTotal) || valorTotal <= 0) {
            isValid = false;
            document.getElementById('trabajoValor').classList.add('is-invalid');
        } else {
            document.getElementById('trabajoValor').classList.remove('is-invalid');
        }

        if (!isValid) {
            return;
        }

        trabajo.cliente_id = clienteId;
        trabajo.descripcion = descripcion;
        trabajo.valor_total = valorTotal;
        trabajo.estado = estado;
        trabajo.requiere_factura = document.getElementById('requiereFactura').checked;
        trabajo.factura_electronica = trabajo.requiere_factura ? document.getElementById('facturaNumero').value : null;

        // Recalcular saldo si el valor total cambió
        const totalPagado = DB.pagos.filter(p => p.trabajo_id === trabajo.id).reduce((sum, p) => sum + p.monto, 0);
        trabajo.saldo = Math.max(0, trabajo.valor_total - totalPagado);

        DB.saveTrabajos();

        // Mostrar alerta de éxito
        const alerta = document.createElement('div');
        alerta.className = 'alert alert-success mt-3';
        alerta.role = 'alert';
        alerta.textContent = 'Trabajo actualizado correctamente';

        document.querySelector('.dashboard-container .container').prepend(alerta);

        setTimeout(() => alerta.remove(), 3000);

        // Restaurar comportamiento y texto original
        trabajoForm.onsubmit = handleTrabajoSubmit;
        submitBtn.textContent = 'Guardar Trabajo';

        showTrabajosList();
    };
}


        // Inicializar la aplicación
        showLoginForm();