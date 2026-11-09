# 🏦 Sistema de Gestión de Cuenta Bancaria Simplificada

Trabajo práctico · **Ingeniería Web** · Unidad de Desarrollo Full-Stack (Node.js + React + MongoDB)

Aplicación web Full-Stack para gestionar una cuenta bancaria: consulta de saldo, depósitos, retiros, transferencias entre cuentas e historial de movimientos. El saldo y el historial se actualizan en pantalla **al instante** después de cada operación, sin recargar la página.

## Tecnologías

| Capa | Tecnologías |
| --- | --- |
| **Backend** | Node.js · Express.js · JavaScript (ES6+, módulos ESM) · MongoDB local con Mongoose |
| **Frontend** | React 19 + Vite · JavaScript y JSX · Componentes, Props, `useState` y `useEffect` · Tailwind CSS v4 (plugin integrado en Vite) |

## Estructura del repositorio

```
cuenta-bancaria-fullstack/
├── package.json                 # Scripts de conveniencia (dev, seed, build, test)
├── README.md
├── server/                      # ── BACKEND (API REST)
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── server.js            # Arranque: conexión a MongoDB + listen
│   │   ├── app.js               # Configuración de Express (CORS, JSON, rutas, errores)
│   │   ├── seed.js              # Script seed: cuentas y movimientos de prueba
│   │   ├── config/db.js         # Conexión a MongoDB
│   │   ├── models/              # Cuenta.js · Transaccion.js (Mongoose)
│   │   ├── controllers/         # Lógica de negocio y validaciones
│   │   ├── routes/              # Rutas /api/cuenta
│   │   ├── middleware/          # Manejo centralizado de errores (400/404/500)
│   │   └── utils/               # Validación de montos, serializadores, ApiError
│   └── tests/api.test.js        # Pruebas de integración de la API
└── client/                      # ── FRONTEND (React + Vite + Tailwind)
    ├── .env.example
    ├── index.html
    ├── vite.config.js           # Plugins de React y Tailwind + proxy a la API
    └── src/
        ├── main.jsx · App.jsx
        ├── index.css            # @import "tailwindcss" + tema (fuente y animaciones)
        ├── components/          # Navbar · SaldoCard · FormOperacion · HistorialTransacciones · Notificaciones · Iconos
        ├── hooks/               # useCuenta (datos + useEffect) · useNotificaciones
        ├── services/api.js      # Cliente HTTP de la API
        └── utils/formato.js     # Formato de moneda y fechas
```

## Requisitos previos

- **Node.js 18.18 o superior** (recomendado 20 o 22) → `node -v`
- **MongoDB Community Server** instalado y **en ejecución** en local (puerto `27017`) → [descarga](https://www.mongodb.com/try/download/community)
  - Windows: el instalador lo registra como servicio; verifica en *Servicios* que `MongoDB Server` esté iniciado.
  - macOS (Homebrew): `brew services start mongodb-community`
  - Linux: `sudo systemctl start mongod`
- **Git** y un terminal.

## Instalación

```bash
# 1. Clonar el repositorio
git clone <URL-DEL-REPOSITORIO>
cd cuenta-bancaria-fullstack

# 2. Instalar dependencias de cada parte
cd server && npm install && cd ..
cd client && npm install && cd ..

# (opcional) instalar concurrently en la raíz para levantar todo con un solo comando
npm install
```

### Variables de entorno

Copia el archivo de ejemplo del backend y ajusta si es necesario (los valores por defecto funcionan con un MongoDB local estándar):

```bash
# Linux / macOS
cp server/.env.example server/.env
# Windows (PowerShell)
Copy-Item server/.env.example server/.env
```

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `PORT` | `5000` | Puerto de la API |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/cuenta_bancaria` | Cadena de conexión a MongoDB local |
| `CLIENT_URL` | `http://localhost:5173` | Origen del frontend permitido por CORS |
| `USE_TRANSACTIONS` | `false` | `true` solo si MongoDB corre como *replica set* (ver «Atomicidad») |

El frontend **no necesita `.env`**: en desarrollo, Vite reenvía `/api` hacia `http://localhost:5000` (proxy). Opcionalmente puedes definir `VITE_API_URL` o `VITE_PROXY_TARGET` (ver `client/.env.example`).

## Script seed (datos de prueba)

Carga 5 cuentas con saldos coherentes y 14 movimientos históricos (depósitos, retiros y transferencias entre ellas). **Vacía las colecciones antes de insertar**, por lo que puede ejecutarse las veces que quieras para reiniciar la base:

```bash
cd server
npm run seed
```

| Cuenta | Titular | Saldo inicial del seed |
| --- | --- | --- |
| `1001-0001` | Ana Torres Salas | S/ 3,800.00 |
| `1001-0002` | Luis Quispe Ramos | S/ 1,643.85 |
| `1001-0003` | María Rojas Paucar | S/ 8,550.00 |
| `1001-0004` | Carlos Mendoza Lazo | S/ 570.50 |
| `1001-0005` | Rosa Huamán Vilca | S/ 13,875.90 |

## Ejecución

Abre **dos terminales**:

```bash
# Terminal 1 — API (http://localhost:5000)
cd server
npm run dev        # con recarga automática  ·  o:  npm start
```

```bash
# Terminal 2 — Interfaz (http://localhost:5173)
cd client
npm run dev
```

Abre **http://localhost:5173** en el navegador. Si instalaste `concurrently` en la raíz, también puedes usar un solo terminal: `npm run dev`.

Verificación rápida de la API: `http://localhost:5000/api/health` → `{"estado":"ok"}`.

### Build de producción del frontend

```bash
cd client
npm run build      # genera client/dist
npm run preview    # sirve el build para revisarlo
```

## API REST

Base: `http://localhost:5000/api/cuenta` · El `:id` es el **número de cuenta** (ej. `1001-0001`).

| Método | Ruta | Descripción | Body (JSON) |
| --- | --- | --- | --- |
| `GET` | `/api/cuenta/:id` | Saldo y datos de la cuenta | — |
| `POST` | `/api/cuenta/deposito` | Registra un depósito | `{ "cuentaId", "monto", "descripcion?" }` |
| `POST` | `/api/cuenta/retiro` | Registra un retiro | `{ "cuentaId", "monto", "descripcion?" }` |
| `POST` | `/api/cuenta/transferencia` | Transfiere entre cuentas | `{ "cuentaOrigen", "cuentaDestino", "monto", "descripcion?" }` |
| `GET` | `/api/cuenta/:id/historial` | Últimas transacciones (`?limit=20&tipo=deposito`) | — |
| `GET` | `/api/cuenta` | *(extra)* Lista de cuentas, usada por los selectores | — |

### Códigos de respuesta

| Código | Cuándo |
| --- | --- |
| `200` / `201` | Consulta correcta / operación registrada |
| `400` | Datos inválidos (monto ≤ 0, no numérico, más de 2 decimales, JSON mal formado, misma cuenta de origen y destino) **o saldo insuficiente** |
| `404` | Cuenta no encontrada (incluye cuenta destino inexistente) o ruta desconocida |
| `500` | Error interno del servidor (el detalle solo se registra en consola) |

### Ejemplos (curl)

```bash
# Consultar saldo
curl http://localhost:5000/api/cuenta/1001-0001

# Depósito
curl -X POST http://localhost:5000/api/cuenta/deposito \
  -H "Content-Type: application/json" \
  -d '{"cuentaId":"1001-0001","monto":150.50,"descripcion":"Pago de honorarios"}'

# Retiro (400 si supera el saldo)
curl -X POST http://localhost:5000/api/cuenta/retiro \
  -H "Content-Type: application/json" \
  -d '{"cuentaId":"1001-0001","monto":80}'

# Transferencia
curl -X POST http://localhost:5000/api/cuenta/transferencia \
  -H "Content-Type: application/json" \
  -d '{"cuentaOrigen":"1001-0001","cuentaDestino":"1001-0002","monto":200,"descripcion":"Alquiler"}'

# Historial
curl "http://localhost:5000/api/cuenta/1001-0001/historial?limit=10"
```

Respuesta de una operación exitosa:

```json
{
  "mensaje": "Depósito realizado con éxito.",
  "cuenta": { "id": "…", "numeroCuenta": "1001-0001", "titular": "Ana Torres Salas", "saldo": 3950.5, "moneda": "PEN" },
  "transaccion": { "id": "…", "tipo": "deposito", "monto": 150.5, "fecha": "2026-11-09T22:50:00.000Z", "cuentaOrigen": null, "cuentaDestino": "1001-0001" }
}
```

## Decisiones de diseño

- **Dinero en céntimos (enteros):** los saldos y montos se guardan como enteros (`saldoCentavos`) para evitar errores de punto flotante (`0.1 + 0.2`). La API expone soles con 2 decimales.
- **Validaciones de negocio en el backend:** monto positivo, máximo 2 decimales, tope por operación, saldo nunca negativo, destino existente, origen ≠ destino. El frontend valida lo mismo para dar respuesta inmediata, pero **la API no confía en el cliente**. Los campos se validan por tipo, lo que además previene inyección de operadores NoSQL.
- **Atomicidad:**
  - *Retiro y débito de transferencias:* una única operación atómica `findOneAndUpdate({ saldo ≥ monto }, { $inc })`. Dos peticiones simultáneas nunca pueden dejar el saldo en negativo.
  - *Transferencia:* débito → crédito → registro del movimiento. Si un paso falla, se **revierte** automáticamente lo aplicado (compensación), de modo que ambos saldos se actualizan o ninguno.
  - *Transacciones ACID:* un MongoDB local *standalone* no las soporta. Si tu instancia corre como *replica set*, activa `USE_TRANSACTIONS=true` y la API envolverá cada operación en `session.withTransaction()`.
- **Manejo de errores centralizado:** un único middleware traduce errores de negocio, de validación y de Mongoose a `400`/`404`/`500` con mensajes en español.
- **Estado en React:** el hook `useCuenta` concentra datos, carga y error. Los `useEffect` sincronizan saldo, historial y lista de cuentas al cambiar de cuenta o completar una operación; el saldo se refleja de inmediato con la respuesta de la API y el resto se refresca en segundo plano. Las peticiones usan `AbortController` para evitar condiciones de carrera.
- **Tailwind CSS:** todo el maquetado usa clases utilitarias; `index.css` solo importa Tailwind y declara el tema (tipografía y animaciones). Diseño *mobile-first* y responsive, con estados de carga (*skeletons*), vacío y error, notificaciones de éxito/error y atributos de accesibilidad (`aria-*`, foco visible).

## Pruebas

```bash
cd server
npm test
```

Ejecuta pruebas de integración de la API con `node:test` sobre una base MongoDB **en memoria** (`mongodb-memory-server`, descarga un binario de MongoDB la primera vez; requiere internet). Cubren los cinco endpoints, los códigos `400`/`404`, el saldo exacto, retiros y transferencias concurrentes y la conservación del dinero total.

Para ejecutarlas contra tu MongoDB local en vez de la base en memoria:

```bash
TEST_MONGODB_URI="mongodb://127.0.0.1:27017/cuenta_bancaria_test" npm test
# PowerShell:  $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017/cuenta_bancaria_test"; npm test
```

> ⚠️ Las pruebas **borran** las colecciones de la base que uses: apunta siempre a una base de pruebas, nunca a `cuenta_bancaria`.

## Solución de problemas

| Síntoma | Causa y solución |
| --- | --- |
| `✖ No se pudo conectar a MongoDB` | El servicio `mongod` no está iniciado o `MONGODB_URI` es incorrecta. Inícialo y vuelve a ejecutar. |
| La web muestra «No se pudo conectar con el servidor» | La API no está corriendo en el puerto 5000. Inicia `npm run dev` en `server/`. |
| La lista de cuentas está vacía | Aún no ejecutaste el seed: `cd server && npm run seed`. |
| `EADDRINUSE` | El puerto ya está en uso. Cambia `PORT` en `server/.env` (y `VITE_PROXY_TARGET` en el cliente). |
| Error de CORS | Si sirves el frontend en otro puerto/origen, ajusta `CLIENT_URL` en `server/.env`. |

## Autor

Trabajo práctico de la asignatura **Ingeniería Web** — Universidad Continental.
