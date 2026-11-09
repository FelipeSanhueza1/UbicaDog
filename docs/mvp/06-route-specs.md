# Especificación de Rutas y Endpoints — UbicaDog

Este documento especifica los contratos de API y las rutas del cliente según las directrices de `skills-main/create-mvp/references/route-specs.md`.

---

## 1. Rutas del Frontend Web (React 18 + Vite)

| Ruta | Componente | Acceso | Propósito |
| :--- | :--- | :--- | :--- |
| `/` | `MapPage.tsx` | Público | Mapa interactivo en tiempo real con capas de radar, avistamientos, veterinarias y tiendas. |
| `/sightings` | `SightingsPage.tsx` | Público | Muro de reportes de mascotas vistas en la calle con filtros de collar y especie. |
| `/veterinaries` | `VeterinariesPage.tsx` | Público | Directorio de veterinarias ordenadas por estrellas (5.0 a 1.0) y distancia GPS. |
| `/pricing` | `PricingPlansPage.tsx` | Público | Tabla de suscripciones para dueños (\$2.990) y tiendas (\$5.000 / \$10.000). |
| `/p/:petId` | `PetPublicProfilePage.tsx` | Público (QR) | Ficha móvil de auxilio al escanear la placa de una mascota en la calle. |
| `/my-pets` | `MyPetsPage.tsx` | Autenticado | Panel personal del dueño con botón de activación de pérdida y descarga de QR. |
| `/login` | `LoginPage.tsx` | Público | Inicio de sesión con correo/contraseña o botón de Google. |
| `/register` | `RegisterPage.tsx` | Público | Registro de usuarios protegidos con reCAPTCHA. |
| `/employee-login` | `EmployeeLoginPage.tsx` | Empleados | Acceso exclusivo para el equipo de moderación corporativa. |
| `/admin` | `AdminDashboardPage.tsx` | Empleados/Admin | Moderación de avistamientos, métricas y emisión de alertas radiales de emergencia. |

---

## 2. Endpoints de la API Backend (Node.js + Express)

### Autenticación (`/api/auth`)
- `POST /login`: `{ email, password, recaptchaToken? }` ➔ `200 { user, token }` \| `401 { error }`
- `POST /register`: `{ name, email, password, phone? }` ➔ `201 { user, token }` \| `409 { error }`
- `POST /employee-login`: `{ email, password }` ➔ `200 { user, token }` \| `403 { error }`
- `POST /google`: `{ email, name, avatarUrl?, googleId? }` ➔ `200 { user, token }`
- `GET /me`: Headers `Authorization: Bearer <jwt>` ➔ `200 { user }`

### Mascotas y Radar (`/api/pets`)
- `GET /my-pets`: Headers `Authorization` ➔ `200 { pets, subscriptionTier, canAddMore }`
- `POST /register`: Headers `Authorization` ➔ `201 { pet }` \| `403 { code: "SUBSCRIPTION_LIMIT_REACHED" }`
- `PATCH /:petId/toggle-lost`: Headers `Authorization` ➔ `200 { pet, radar }` *(Emite evento Socket.io `radar:wave`)*
- `GET /radar-active`: Público ➔ `200 { radarPets }`
- `GET /public/:petId`: Público (Escaneo QR) ➔ `200 { pet }`

### Veterinarias (`/api/veterinaries`)
- `GET /?lat=&lng=&radiusMeters=&sortBy=&onlyEmergency24h=`:
  - `sortBy`: `'rating'` (de 5.0 a 1.0 ⭐ con desempate por reseñas) o `'distance'`.
  - `onlyEmergency24h`: `true` \| `false`.
  - Retorna: `200 { count, userLocation, veterinaries }`.

### Tiendas de Mascotas (`/api/stores`)
- `GET /?lat=&lng=&radiusMeters=`: Retorna tiendas destacando las de plan Premium (`isPromoted: true`) con sus cupones de descuento.
- `POST /`: Headers `Authorization` ➔ `201 { store }` (Permite a una tienda registrar su local con plan de \$5.000 o \$10.000).

### Suscripciones (`/api/subscriptions`)
- `GET /plans`: Retorna el catálogo oficial de planes y beneficios.
- `GET /me`: Headers `Authorization` ➔ Retorna el tier actual y cuántas mascotas tiene registradas de su límite.
- `POST /subscribe`: Headers `Authorization`, Body `{ tier }` ➔ Actualiza la membresía y emite factura recurrente.
