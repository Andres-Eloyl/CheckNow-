# CheckNow! — Fase 4: Dashboard Operativo (Staff)

## Contexto
Mientras el Backend de la **Fase 2** ya está expuesto (vía REST y WebSockets) y la **Fase 3** (Vista Comensal) está en desarrollo, tu misión es construir el **centro de comando del restaurante**. 

Este será un panel web que usarán:
1. **Los Meseros/Capitanes:** Para ver el estado de las mesas en tiempo real.
2. **La Cocina/Barra:** Para ver y despachar comandas.
3. **El Cajero/Gerente:** Para administrar el menú, validar pagos y cerrar cuentas.

## Stack Tecnológico
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Estilos:** Tailwind CSS o Vanilla CSS (según el sistema de diseño acordado en Fase 3)
- **Estado Global:** Zustand o Context API 
- **Tiempo Real:** WebSocket (`WebSocket` API nativa o librería `socket.io-client` si usamos un adaptador, pero preferiblemente WS nativo contra la ruta fastapi)
- **Fetch:** SWR, React Query, o Fetch nativo.

---

## Lista de Tareas (Roadmap)

### 1. Setup e Infraestructura Base
- [ ] Configurar el proyecto Next.js en la carpeta `/frontend-staff/` (o dentro de un monorepo si aplica).
- [ ] Implementar la pantalla de Login (Autenticación usando PIN de 4-6 dígitos).
- [ ] Guardar el JWT Token retornado por la API (`POST /api/auth/staff/login`) en HTTP-only cookies o local storage.
- [ ] Configurar el layout principal con una barra de navegación lateral (Mesas, Comandas, Menú, Historial).
- [ ] Crear un Provider para gestionar la conexión global de WebSockets apuntando a `wss://<API_URL>/ws/dashboard/<restaurant_slug>?token=<token>`.

### 2. Mapa de Mesas en Vivo
- [ ] Consultar el listado de mesas (`GET /api/tables`).
- [ ] Dibujar una cuadrícula (grid) o lista de tarjetas con todas las mesas del local.
- [ ] Mostrar estados por colores (ej. Verde = Libre, Rojo = Ocupada, Amarillo = Esperando Cuenta).
- [ ] Escuchar eventos vía WebSocket para que el estado de las mesas cambie mágicamente sin refrescar la página.
- [ ] Modal emergente al hacer clic en una mesa para ver: resumen del pedido actual y botón para "Cerrar Mesa" (liberar).

### 3. Pantalla de Comandas (Kitchen/Bar Display)
- [ ] Crear un feed estilo tablero Kanban (Pendiente, Preparando, Listo).
- [ ] Escuchar el evento WS `new_order`. Cuando llegue un pedido, hacer sonar una alerta auditiva (un *ding*) y mostrar la tarjeta con la orden (ítems, cantidades y modificadores tipo "sin cebolla").
- [ ] Botones en la tarjeta para cambiar el estado (llamando a `PATCH /api/orders/<id>/status` con body `{"status": "preparing"|"ready"}`).

### 4. Administrador de Menú (CRUD)
- [ ] Vista de listado de Categorías e Ítems.
- [ ] Formularios completos para:
  - Crear/Editar Categoría (Nombre, ícono).
  - Crear/Editar Ítems de Categoría (Nombre, descripción, precio, tiempo de preparación, "destino" local u online).
  - Agregar Modificadores a los ítems.
- [ ] **Control de Stock:** Un input numérico rápido junto a cada ítem para decir "quedan 5 porciones". Al llegar a cero, el ítem se apaga automáticamente en el menú.

### 5. Validación de Pagos (Caja)
- [ ] Vista de Notificaciones/Caja donde caen los avisos cuando una mesa decide pagar con "Pago Móvil" o "Zelle".
- [ ] Mostar la referencia enviada por el comensal.
- [ ] Botones de "Aprobar" (cierra la cuenta parcial o total) o "Rechazar" (devuelve el estado a la mesa con un error).

---

## Por dónde empezar HOY
No necesitas esperar a que todo el backend esté listo para empezar:
1. Inicia el proyecto Next.js.
2. Maqueta las **vistas estáticas** del Mapa de Mesas y el Tablero de Comandas usando datos simulados (JSON dummy).
3. Una vez maquetado, conecta el Login real y luego el WebSocket.
