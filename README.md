# 🐾 UbicaDog — Plataforma Integral de Geolocalización, Radar de Búsqueda y Rescate de Mascotas

UbicaDog es una solución tecnológica empresarial multiplataforma (Web + Android + iOS + Backend) diseñada para la rápida publicación de mascotas encontradas en la calle y la activación de un **Radar Dinámico de Dispersión** para mascotas extraviadas con estimación matemática diaria de distancia, alertas sonoras y de proximidad en tiempo real por WebSocket, pasarela de pago Stripe para fondos de recompensa y seguridad anti-bots con reCAPTCHA.

---

## 🏗️ Arquitectura del Proyecto

```
UbicaDog/
├── docker-compose.yml          # Contenedor PostgreSQL 16 + PostGIS para búsquedas espaciales
├── package.json                # Orquestador monorepo (scripts concurrentes)
├── server/                     # Backend API (Node.js, Express, TypeScript, Socket.io, Stripe, reCAPTCHA)
│   ├── prisma/schema.prisma   # Esquema relacional y geoespacial
│   ├── src/
│   │   ├── controllers/       # Auth, Mascotas, Avistamientos en Calle, Stripe, Admin
│   │   ├── middleware/        # JWT Auth, Roles (User, Employee, Admin), reCAPTCHA
│   │   ├── services/          # Motor de cálculo de radio de dispersión, WebSocket
│   │   └── types/
├── client/                     # Frontend Web (React 18, Vite, TypeScript, Material UI v6, Leaflet)
│   ├── src/
│   │   ├── theme/             # Theming MUI con tipado estricto, 50-900, Light & Dark
│   │   ├── components/        # Mapa interactivo con ondas de radar, Diálogos de reporte
│   │   └── pages/             # Mapa en vivo, Mis Mascotas, Avistamientos, Login, Admin
└── mobile/                     # Aplicación Móvil (React Native, Expo SDK 58.0.0, iOS/Android)
    └── src/
        └── screens/           # Mapa GPS con círculos de radar, Reporte rápido en calle
```

---

## 🗄️ Recomendación de Base de Datos para Escala Empresarial

Para la magnitud y los requisitos geoespaciales de UbicaDog, la **recomendación técnica de nivel de producción es PostgreSQL con la extensión PostGIS**.

### ¿Por qué PostGIS?
1. **Indexación Espacial GiST (Generalized Search Tree)**: Permite consultar millones de coordenadas en milisegundos (`ST_DWithin`, `ST_Distance`).
2. **Consultas de Radio de Proximidad Nativas**:
   ```sql
   SELECT * FROM "Pet"
   WHERE ST_DWithin(
     geography(ST_MakePoint(home_longitude, home_latitude)),
     geography(ST_MakePoint(:user_lon, :user_lat)),
     :current_radius_meters
   );
   ```
3. **Escalabilidad y Consistencia ACID**: Manejo concurrente de transacciones financieras (Stripe), roles corporativos y moderación de reportes.
4. **Despliegue Rápido**: El repositorio incluye `docker-compose.yml` listo con `postgis/postgis:16-3.4`.

---

## ⚡ Credenciales de Acceso Preconfiguradas

El sistema cuenta con un apartado separado de inicio de sesión:
1. **Portal Público de Usuarios** (`/login` o `/register`):
   - Correo: `usuario@gmail.com`
   - Contraseña: `usuario123`
   - O mediante el botón **"Continuar con Google"**.
2. **Portal Corporativo Exclusivo para Empleados y Administradores** (`/employee-login`):
   - **Empleado**: `empleado@ubicadog.com` / `empleado123`
   - **Administrador General**: `admin@ubicadog.com` / `admin123`
   - Permite moderar reportes, eliminar publicaciones fraudulentas y emitir transmisiones de emergencia por onda radial a todos los usuarios.

---

## 🚀 Puesta en Marcha en Local

### 1. Iniciar Servidor Backend (Puerto 5001)
```bash
cd server
npm install
npm run dev
```

### 2. Iniciar Frontend Web (Puerto 5173)
```bash
cd client
npm install
npm run dev
```

### 3. Iniciar Aplicación Móvil (Android / iOS)
```bash
cd mobile
npm install
npm run android   # Para Android
npm run ios       # Para iOS
```

---

## 📡 Características Clave Implementadas

1. **Publicación Rápida de Mascotas Callejeras**: Formulario ágil con foto, especie (perro, gato, otro), estado de collar (con collar, sin collar, dudoso), condición (herido, asustado, vagando) y geolocalización inmediata.
2. **Radar de Dispersión Estimada de Mascotas Extraviadas**:
   - Activación con **un solo clic** desde el perfil de la mascota.
   - Fórmula basada en etología y dispersión de animales:
     - Perros: Base de 600m en Día 0, expandiendo ~1.2 km - 1.5 km por día según el tamaño (pequeño, mediano, grande).
     - Gatos: 300m en las primeras 48h (fase de ocultamiento territorial) y expansión cautelosa posterior.
   - Muestra numéricamente la distancia estimada (`3.4 km`, `4.9 km`) y la amplía en el tiempo.
3. **Onda de Radar en Tiempo Real**: Efecto visual de ondas concéntricas (`@keyframes radarPulse`) en el mapa que emite sonido y notificación de proximidad a usuarios cercanos vía Socket.io.
4. **Pasarela Stripe**: Checkout integrado para impulsar alertas de búsqueda comunitaria y fondo de recompensas.
5. **Seguridad reCAPTCHA**: Protección de formularios contra bots y spam.
