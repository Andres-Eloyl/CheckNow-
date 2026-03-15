# CheckNow! — Fase 3: WebApp del Comensal

Desarrollar toda la interfaz del lado del cliente (comensal) usando Next.js 14 con TypeScript.  
El comensal escanea un QR en la mesa y accede a esta webapp desde su celular.

## Stack Tecnológico
- **Framework:** Next.js  (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** CSS puro (variables CSS + dark mode)
- **Estado global:** Zustand
- **WebSockets:** socket.io-client (se conectará al backend más adelante)

## Ubicación del código
```
CheckNow!/frontend/
```

---

## Tareas

### 1. Inicialización del proyecto
- [ ] Crear proyecto Next.js  con TypeScript y App Router
- [ ] Configurar estructura de carpetas (`app/`, `components/`, `lib/`)
- [ ] Instalar dependencias necesarias (zustand, socket.io-client)

### 2. Sistema de diseño
- [ ] Definir variables CSS globales (colores, tipografía, espaciado, bordes)
- [ ] Implementar dark mode como tema por defecto
- [ ] Crear estilos base responsivos (mobile-first)

### 3. Componentes UI reutilizables
- [ ] Crear componentes genéricos: botones, modales, toasts, loaders
- [ ] Crear componente de avatar (emoji + color) para identificar comensales
- [ ] Crear componentes específicos del menú (tarjeta de ítem, tabs de categoría)
- [ ] Crear componentes del carrito (fila de ítem, resumen de totales)
- [ ] Crear componentes del split (tarjetas de modo, barras de fracción, temporizador)
- [ ] Crear componentes de pago (selector de método, campo de referencia)

### 4. Pantallas principales
- [ ] **Landing QR** — Bienvenida con logo del restaurante + formulario para unirse a la mesa (alias + emoji)
- [ ] **Menú** — Navegación por categorías + grilla de ítems + modal de detalle con modificadores
- [ ] **Carrito** — Lista de ítems agrupados por persona + totales + botón "Enviar a cocina"
- [ ] **Smart Split** — Selección de modo de división + visualización de fracciones + aceptar/rechazar
- [ ] **Checkout** — Resumen de cuenta + selección de método de pago + formulario de referencia/captura

### 5. Pantallas secundarias
- [ ] Página 404 personalizada
- [ ] Pantalla de "Sesión expirada"
- [ ] Pantalla de confirmación de pago exitoso

### 6. Datos de prueba
- [ ] Crear archivo de mocks (`lib/mocks/data.ts`) con restaurante, menú, usuarios y órdenes de ejemplo
- [ ] Usar los mocks en todas las pantallas para que se vean funcionales sin backend

### 7. Extras
- [ ] Configurar PWA manifest para instalación en celular
- [ ] Agregar animaciones y transiciones suaves
- [ ] Probar responsive en distintos dispositivos (iPhone, Android, tablet)

---

## Notas importantes
- **No necesitas el backend corriendo.** Trabaja con datos mock hardcodeados.
- Cuando el backend esté listo, solo hay que cambiar una variable de entorno (`NEXT_PUBLIC_API_URL`) para conectar todo.
- Los contratos de la API están documentados en `architecture_plan.md` y en los esquemas Pydantic (`backend/app/schemas/`).
- Los colores del restaurante se personalizan por tenant: `primary_color` y `secondary_color`.
