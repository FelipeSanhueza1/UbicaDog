# Modelo de Dominio y Diagrama Entidad-Relación (ERD) — UbicaDog

Este documento define las entidades del dominio, sus invariantes y relaciones según el esquema Prisma en [server/prisma/schema.prisma](../../server/prisma/schema.prisma).

---

## 1. Diagrama Entidad-Relación (Mermaid)

```mermaid
erDiagram
    User ||--o{ Pet : "posee (1 a N)"
    User ||--o{ Sighting : "reporta (0 a N)"
    User ||--o{ Subscription : "contrata (0 a N)"
    User ||--o{ PetStore : "administra (0 a 1)"

    Pet ||--o{ Sighting : "puede vincularse a avistamientos"
    
    User {
      string id PK
      string email UK
      string password
      string name
      string role "user | employee | admin"
      string subscriptionTier "free | pro_owner | store_basic | store_premium"
      string phone
      datetime createdAt
    }

    Pet {
      string id PK
      string ownerId FK
      string name
      string species "dog | cat | other"
      string breed
      string size "small | medium | large"
      float homeLatitude
      float homeLongitude
      string homeAddress
      boolean isLost
      datetime lostSince
      float rewardAmount
      string qrCodeUrl
      string[] vaccines
      boolean sterilized
    }

    Sighting {
      string id PK
      string reporterId FK
      string species
      string collarStatus "with_collar | no_collar | unknown"
      string condition "healthy | injured | scared | wandering"
      float latitude
      float longitude
      string address
      datetime seenAt
      string status "active | resolved | hidden"
    }

    Veterinary {
      string id PK
      string clinicName
      string address
      float latitude
      float longitude
      float rating "1.0 a 5.0"
      int reviewCount
      boolean isEmergency24h
      string phone
      string[] services
    }

    PetStore {
      string id PK
      string ownerId FK
      string businessName
      string tier "store_basic ($5.000) | store_premium ($10.000)"
      float latitude
      float longitude
      string address
      string phone
      string logoUrl
      json catalog
      json promotions
    }

    Subscription {
      string id PK
      string userId FK
      string tier
      string status "active | past_due | canceled"
      int priceClp
      datetime currentPeriodEnd
    }
```

---

## 2. Invariantes del Dominio

1. **Límite Freemium**: Si `User.subscriptionTier === 'free'`, la cantidad de mascotas con `ownerId === User.id` no puede superar **1**.
2. **Ciclo de Pérdida**:
   - Al cambiar `Pet.isLost` de `false` a `true`, `lostSince` se establece en la marca de tiempo actual (`now()`).
   - El radio de búsqueda se calcula mediante la fórmula etológica:
     - Perros: Base de 600m en Día 0, expandiéndose ~1.2 km a 1.5 km diarios ponderado por tamaño (`small: 0.75x`, `medium: 1.0x`, `large: 1.35x`).
     - Gatos: 300m fijos durante las primeras 48h (ocultamiento territorial) y expansión cautelosa posterior.
3. **Planes de Tiendas**:
   - `store_basic` (\$5.000 CLP): Máximo 5 productos en vitrina, sin emisión de cupones de descuento.
   - `store_premium` (\$10.000 CLP): Catálogo ilimitado, halo dorado en mapa y emisión de cupones geolocalizados.
