# 🎨 Guía del Sistema de Diseño (DESIGN.md) — UbicaDog

Este documento es la fuente de verdad visual y de experiencia de usuario (UX) para el frontend web y móvil de UbicaDog. Todo componente nuevo o modificado debe alinearse con estas directrices.

---

## 1. Sistema de Color y Tokens de Marca

El sistema de diseño está implementado en [src/theme/muiTheme.ts](src/theme/muiTheme.ts) con tipado estricto en TypeScript mediante *Module Augmentation*.

### Paleta Principal
- **Primary (`#2563EB`)**: Royal Blue moderno y confiable. Escala de `50` a `900`, donde `500 === main`. Simboliza seguridad, fidelidad y protección.
- **Secondary (`#F97316`)**: Naranja de alta visibilidad. Usado para llamadas a la acción críticas (*"Reportar Callejero"*, alertas de avistamiento y botones de rescate).
- **Tertiary (`#10B981`)**: Verde esmeralda. Utilizado para estados de seguridad (*"Seguro en Hogar"*, mascotas recuperadas, clínicas veterinarias).
- **Error (`#DC2626`)**: Rojo de emergencia. Usado para mascotas extraviadas, ondas de dispersión activas y clínicas veterinarias 24h.
- **Warning (`#F59E0B`)**: Amarillo ámbar. Destacado de tiendas premium ($10.000 CLP) y cupones de descuento.

### Modos Soportados
- **Modo Claro (Light)**: Fondos `#F8FAFC` (default), `#FFFFFF` (surface/paper), textos `#0F172A` (primary) y `#475569` (secondary).
- **Modo Oscuro (Dark)**: Fondos `#0B0F19` (default), `#111827` (surface), `#151D2F` (paper), textos `#F8FAFC` (primary) y `#94A3B8` (secondary).
- **Conmutación**: Manejada por [src/theme/ThemeContext.tsx](src/theme/ThemeContext.tsx) persistiendo en `localStorage`.

---

## 2. Tipografía

- **Familia Tipográfica Principal**: `"Plus Jakarta Sans", "Roboto", sans-serif`.
- **Jerarquía**:
  - `h1` / `h2` / `h3`: Peso `800` (ExtraBold) para títulos de impacto e indicadores numéricos.
  - `h4` / `h5` / `h6`: Peso `700` (Bold) para títulos de tarjetas y encabezados de diálogo.
  - `body1` / `body2`: Peso `400` a `500` con `line-height` entre 1.4 y 1.6 para máxima legibilidad.
  - `button`: Peso `700` sin `text-transform: uppercase` forzado (capitalización natural).

---

## 3. Pautas de Responsive y Ergonomía Táctil (Mobile-First)

1. **Objetivo de Área Táctil**:
   - Todo botón principal, chip cliqueable o control de formulario debe tener una altura mínima de **44px** para facilitar la pulsación con el pulgar en la calle.
2. **Layouts Fluidos**:
   - Uso de `min-width: 0` y `flexWrap: "wrap"` para evitar que cadenas largas o tarjetas rompan el viewport.
   - Prohibido el desbordamiento horizontal global.
3. **Puntos de Interrupción (Breakpoints MUI)**:
   - `xs`: 0px a 599px (móviles en orientación vertical).
   - `sm`: 600px a 899px (tablets).
   - `md`: 900px a 1199px (pantallas de escritorio compactas).
   - `lg` / `xl`: 1200px+ (monitores de escritorio).

---

## 4. Patrones de Estados de Carga y Feedback (skills-main / create-component)

- **Carga Inicial sin Datos**: Skeleton o spinner centrado accesible.
- **Revalidación con Datos Previos (Soft Loading)**: Conservar el contenido visible actual. Prohibido desmontar o reemplazar por skeletons para evitar parpadeos molestos en el mapa o listas.
- **Formularios**:
  - Los botones de envío se deshabilitan (`disabled={loading}`) mostrando spinner integrado (`<CircularProgress size={18} />`).
  - Ante error del servidor, el diálogo o formulario **mantiene los campos llenos** y muestra un `<Alert severity="error">` o `<Alert severity="warning">` contextual.
- **Diferencia entre Vacío y Error**:
  - *Vacío*: Mensaje amable indicando que no hay registros en la zona y ofreciendo registrar el primero.
  - *Error*: Mensaje claro con botón de reintento (*"Reintentar carga"*).

---

## 5. Animación de la Onda de Radar (Radar Pulse)

Definida en [src/index.css](src/index.css):
```css
@keyframes radarPulse {
  0% { transform: scale(0.1); opacity: 0.9; }
  70% { opacity: 0.4; }
  100% { transform: scale(2.8); opacity: 0; }
}
```
Se aplica en anillos concéntricos con desfase de tiempo (`0.8s`, `1.6s`) emanando del centro de la coordenada de la mascota perdida.
