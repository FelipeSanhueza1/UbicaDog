# Tablero Kanban del Proyecto: UbicaDog

Este documento refleja el estado de las tareas del MVP y las mejoras priorizadas según `skills-main/create-mvp/references/kanban.md`.

---

## 🟢 Hecho (Done)
- [x] Arquitectura Monorepo (Node.js + Express en Backend, React 18 + Vite en Web, React Native + Expo en Mobile).
- [x] Motor de mapas con Leaflet y OpenStreetMap (Web) y react-native-maps (Móvil).
- [x] Animación concéntrica de onda de radar en CSS `@keyframes radarPulse`.
- [x] Emisión en tiempo real de ondas con Socket.io y alerta sonora/push a clientes cercanos con Haversine.
- [x] Cálculo etológico dinámico de radio de dispersión por especie y tamaño corporal con crecimiento diario.
- [x] Portal corporativo de empleados (`/employee-login` y `/admin`) con moderación de avistamientos y alerta radial de emergencia.
- [x] Directorio de veterinarias con filtro GPS y ordenamiento por estrellas (5.0 a 1.0) con desempate por reseñas y selector 24h.
- [x] Planes de suscripción: Freemium (1 mascota), UbicaDog Pro ($2.990 CLP), Tienda Básica ($5.000 CLP) y Tienda Premium ($10.000 CLP).
- [x] Restricción freemium protegida en backend con código `SUBSCRIPTION_LIMIT_REACHED`.
- [x] Generador de Placas QR inteligentes para collar vinculadas a vista pública `/p/:petId` con botón de auxilio y GPS en 1 toque.
- [x] Actualización de la App Móvil a Expo SDK 58.0.0 (React 19, react-native 0.88).
- [x] Gobernanza del repositorio: `AGENTS.md`, `DESIGN.md` y documentación `docs/mvp/`.

---

## 🟡 En Progreso (In Progress)
- [ ] Refinamiento de UX en modales: retención de datos en memoria ante fallos de red y bloqueo de doble clic.
- [ ] Pruebas unitarias de la fórmula de dispersión Haversine y el ranking bayesiano.

---

## 🔵 Pendiente (Backlog Priorizado)
- [ ] Integración de webhook Stripe en vivo para cancelación automática de suscripciones vencidas.
- [ ] Módulo de notificaciones SMS / WhatsApp para usuarios sin datos móviles encendidos.
- [ ] Caché local offline en React Native (SQLite) para zonas rurales sin cobertura móvil.
