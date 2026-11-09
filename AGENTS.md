# Reglas de Operación y Calidad para Agentes (UbicaDog)

Este archivo define las reglas obligatorias de desarrollo, calidad de software y flujo de trabajo para cualquier agente de IA o desarrollador que opere sobre el repositorio **UbicaDog**, siguiendo los estándares de `skills-main`.

---

## 1. Reglas Generales y Filosofía de Ingeniería (Anti-Vibecoding)

- **Cero Supuestos Injustificados**: Cada cambio debe responder a un contrato comprobado entre frontend, backend y base de datos.
- **Validación en los Límites**: Los tipos estáticos de TypeScript no validan datos remotos en tiempo de ejecución. Todas las entradas no confiables (cuerpo de peticiones, query params) deben validarse en el controlador.
- **Separación de Responsabilidades**:
  - `server/src/controllers/`: Adaptación HTTP, validación de entrada y respuesta de códigos de estado adecuados.
  - `server/src/services/`: Lógica de negocio pura (fórmula Haversine, reglas etológicas de dispersión de mascotas, reglas de suscripción).
  - `server/src/middleware/`: Seguridad transversal (autenticación JWT, verificación reCAPTCHA, control de roles).
- **Protección de Dominio**: Las restricciones comerciales (como el límite de 1 mascota en el plan gratuito) se protegen en el backend, no solo ocultando botones en la interfaz de usuario.

---

## 2. Calidad de Frontend (Web y Mobile)

### Diseño antes de Implementar UI
- Antes de comenzar a crear o modificar componentes, páginas o layouts, consulta y aplica [client/DESIGN.md](client/DESIGN.md).
- Conserva el sistema de diseño existente: Theming Material UI v6 con escalas numéricas 50 a 900, modo claro (*light*) y oscuro (*dark*).
- No introduzcas librerías visuales alternativas (como Tailwind o Bootstrap) que rompan la coherencia del sistema MUI.

### Invariantes de Interfaz y Formularios
1. **Preservación de Estado en Fallos**: Si una petición de guardado falla, **NUNCA** cierres el modal ni borres los datos ingresados por el usuario. El modal debe permanecer abierto mostrando el mensaje de error con los datos intactos para reintentar.
2. **Bloqueo de Envíos Simultáneos**: Todo botón de acción debe deshabilitarse (`disabled={loading}`) y mostrar indicador de carga durante el procesamiento de la mutación.
3. **Diferenciación de Estados de Carga**:
   - *Carga Inicial*: Puede usar skeleton o spinner central.
   - *Revalidación (Refetch)*: Debe mantener la lista anterior visible y mostrar un indicador suave (*soft loading*), sin desmontar la pantalla ni parpadear.
4. **Ergonomía Táctil y Responsive**:
   - En móviles y pantallas estrechas, todo control táctil (botones, chips, switches) debe contar con un área activa mínima de **44 × 44 CSS px** (o unidades equivalentes en React Native).
   - Prohibido el desbordamiento horizontal accidental (`overflow-x` no intencional).

---

## 3. Calidad de Backend y Servicios

1. **Gestión de Identidad y Ámbito**:
   - La identidad del usuario siempre se deriva del token JWT verificado en `req.user`, nunca confiando en IDs enviados en el body por el cliente.
2. **Códigos de Error Estructurados**:
   - Toda respuesta de error debe tener una categoría estable:
     ```json
     {
       "code": "SUBSCRIPTION_LIMIT_REACHED",
       "error": "Mensaje legible para el usuario"
     }
     ```
   - Diferenciar 400 (Bad Request), 401 (No autenticado), 403 (Prohibido/Límite de suscripción), 404 (No encontrado) y 500 (Error interno).
3. **Resiliencia Geoespacial**:
   - Toda coordenada geográfica recibida debe validarse: `-90 <= latitude <= 90` y `-180 <= longitude <= 180`.

---

## 4. Definición de Terminado (Definition of Done)

Para considerar un cambio completado, se deben ejecutar y verificar los siguientes comandos reales:

- **Tests Unitarios Backend (Vitest)**:
  ```bash
  cd server && npm test
  ```
- **Tests Unitarios Frontend (Vitest + Testing Library)**:
  ```bash
  cd client && npm test
  ```
- **Typecheck Backend**:
  ```bash
  cd server && npm run build
  ```
- **Typecheck y Build Frontend Web**:
  ```bash
  cd client && npm run build
  ```
- **Typecheck Móvil (React Native / Expo)**:
  ```bash
  cd mobile && npx tsc --noEmit
  ```
- **Prueba de Integridad de Servicios**:
  ```bash
  curl -s http://localhost:5001/api/health
  ```
- **Check Integral del Monorepo**:
  ```bash
  npm run check:all
  ```
