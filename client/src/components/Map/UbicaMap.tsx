import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardMedia,
  CardContent,
  Button,
  Stack,
  Fab,
  Tooltip,
  Rating,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  MyLocation as GpsIcon,
  Phone as PhoneIcon,
  LocalHospital as VetIcon,
  Store as StoreIcon,
  Star as StarIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { Sighting, LostRadarPet, Veterinary, PetStore } from '../../types';
import { getUserCoordinates } from '../../services/geoService';
import { sendUserLocation } from '../../services/socket';

interface UbicaMapProps {
  sightings: Sighting[];
  lostPets: LostRadarPet[];
  veterinaries?: Veterinary[];
  stores?: PetStore[];
  onMapClick?: (lat: number, lng: number) => void;
  flyToCoords?: { lat: number; lng: number } | null;
  onUserLocationFound?: (lat: number, lng: number) => void;
}

// Custom DivIcons
const createLostPetRadarIcon = (photoUrl: string) => {
  return L.divIcon({
    className: 'radar-custom-marker',
    html: `
      <div class="radar-wave-container">
        <div class="radar-wave-circle"></div>
        <div class="radar-wave-circle radar-wave-circle-delay-1"></div>
        <div class="radar-wave-circle radar-wave-circle-delay-2"></div>
        <img class="pet-avatar-pin" src="${photoUrl}" alt="Lost Pet" />
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
  });
};

const createSightingIcon = (species: string, hasCollar: boolean) => {
  const bgColor = hasCollar ? '#EF4444' : '#2563EB';
  const label = species === 'dog' ? '🐶' : species === 'cat' ? '🐱' : '🐾';

  return L.divIcon({
    className: 'sighting-pin',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <div style="transform: rotate(45deg); font-size: 18px; position: relative;">
          ${label}
          ${hasCollar ? `<span style="position: absolute; top:-6px; right:-6px; font-size: 11px;">🔔</span>` : ''}
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
  });
};

const createVeterinaryIcon = (is24h: boolean) => {
  return L.divIcon({
    className: 'vet-pin',
    html: `
      <div style="
        background-color: ${is24h ? '#DC2626' : '#10B981'};
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        border: 2px solid white;
      ">
        <div style="transform: rotate(45deg); font-size: 18px;">
          ${is24h ? '🚨' : '🏥'}
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
  });
};

const createStoreIcon = (isPremium: boolean) => {
  return L.divIcon({
    className: 'store-pin',
    html: `
      <div style="
        background: ${isPremium ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#2563EB'};
        width: ${isPremium ? '42px' : '36px'};
        height: ${isPremium ? '42px' : '36px'};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${isPremium ? '0 0 16px rgba(245, 158, 11, 0.7)' : '0 4px 10px rgba(0,0,0,0.3)'};
        border: 2px solid white;
      ">
        <div style="transform: rotate(45deg); font-size: ${isPremium ? '19px' : '16px'};">
          ${isPremium ? '⭐' : '🛍️'}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="position: relative; width: 28px; height: 28px;">
        <div style="
          position: absolute;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: rgba(37, 99, 235, 0.35);
          animation: radarPulse 2s ease-out infinite;
        "></div>
        <div style="
          position: absolute;
          top: 5px;
          left: 5px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: #2563EB;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.45);
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapFlyController({ flyToCoords }: { flyToCoords?: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (flyToCoords) {
      map.flyTo([flyToCoords.lat, flyToCoords.lng], 15, { duration: 1.4 });
    }
  }, [flyToCoords, map]);
  return null;
}

function LocateControl({
  onLocate,
  onError,
}: {
  onLocate: (lat: number, lng: number) => void;
  onError: (msg: string) => void;
}) {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const handleLocate = async () => {
    setLoading(true);
    try {
      const coords = await getUserCoordinates();
      map.flyTo([coords.lat, coords.lng], 16, { duration: 1.5 });
      sendUserLocation(coords.lat, coords.lng);
      onLocate(coords.lat, coords.lng);
    } catch (err: any) {
      onError(err.message || 'No pudimos acceder a tu ubicación GPS.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ position: 'absolute', bottom: { xs: 85, sm: 28 }, right: { xs: 16, sm: 28 }, zIndex: 1000 }}>
      <Tooltip title="Centrar en mi ubicación GPS">
        <Fab
          color="primary"
          onClick={handleLocate}
          size="medium"
          disabled={loading}
          sx={{
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.45)',
          }}
        >
          <GpsIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}

export const UbicaMap: React.FC<UbicaMapProps> = ({
  sightings,
  lostPets,
  veterinaries = [],
  stores = [],
  onMapClick,
  flyToCoords,
  onUserLocationFound,
}) => {
  const centerLat = -33.4489;
  const centerLng = -70.6693;

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleLocationFound = (lat: number, lng: number) => {
    setUserPos({ lat, lng });
    onUserLocationFound?.(lat, lng);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {gpsError && (
        <Snackbar
          open={Boolean(gpsError)}
          autoHideDuration={6000}
          onClose={() => setGpsError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ bottom: { xs: 90, sm: 40 } }}
        >
          <Alert severity="warning" onClose={() => setGpsError(null)} sx={{ borderRadius: 2 }}>
            {gpsError}
          </Alert>
        </Snackbar>
      )}

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onClick={onMapClick} />
        <MapFlyController flyToCoords={flyToCoords} />
        <LocateControl onLocate={handleLocationFound} onError={(msg) => setGpsError(msg)} />

        {/* CURRENT USER GPS POSITION MARKER */}
        {userPos && (
          <Marker position={[userPos.lat, userPos.lng]} icon={createUserLocationIcon()}>
            <Popup>
              <Box p={0.5}>
                <Typography variant="subtitle2" fontWeight="800" color="primary">
                  📍 Tu Ubicación Actual
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  GPS activo ({userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)})
                </Typography>
              </Box>
            </Popup>
          </Marker>
        )}

        {/* 1. LOST PETS WITH EXPANDING RADAR */}
        {lostPets.map((pet) => (
          <React.Fragment key={pet.petId}>
            <Circle
              center={[pet.centerLatitude, pet.centerLongitude]}
              radius={pet.radiusMeters}
              pathOptions={{
                color: '#EF4444',
                fillColor: '#F97316',
                fillOpacity: 0.12,
                weight: 2,
                dashArray: '6, 6',
              }}
            />
            <Marker
              position={[pet.centerLatitude, pet.centerLongitude]}
              icon={createLostPetRadarIcon(pet.photoUrl)}
            >
              <Popup>
                <Card sx={{ maxWidth: 280, boxShadow: 'none' }}>
                  <CardMedia component="img" height="130" image={pet.photoUrl} alt={pet.petName} />
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="h6" fontWeight="800" color="error.main">
                      ¡{pet.petName.toUpperCase()} PERDIDO!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Radio estimado: <strong>{pet.formattedRadius}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pet.daysLost} días fuera • {pet.homeAddress}
                    </Typography>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* 2. STREET SIGHTINGS */}
        {sightings.map((s) => (
          <Marker
            key={s.id}
            position={[s.latitude, s.longitude]}
            icon={createSightingIcon(s.species, s.collarStatus === 'with_collar')}
          >
            <Popup>
              <Card sx={{ maxWidth: 280, boxShadow: 'none' }}>
                <CardMedia component="img" height="120" image={s.photoUrl} alt="Sighting" />
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight="700">
                    {s.breed}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    📍 {s.address}
                  </Typography>
                  {s.contactPhone && (
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<PhoneIcon />}
                      href={`tel:${s.contactPhone}`}
                      sx={{ mt: 1 }}
                    >
                      Llamar: {s.contactPhone}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}

        {/* 3. VETERINARIES WITH RATING & GPS DISTANCE */}
        {veterinaries.map((v) => (
          <Marker
            key={v.id}
            position={[v.latitude, v.longitude]}
            icon={createVeterinaryIcon(v.isEmergency24h)}
          >
            <Popup>
              <Card sx={{ maxWidth: 290, boxShadow: 'none' }}>
                <CardMedia component="img" height="110" image={v.photoUrl} alt={v.clinicName} />
                <CardContent sx={{ p: 1.5 }}>
                  <Stack direction="row" spacing={0.5} mb={0.5}>
                    <Chip
                      label={v.isEmergency24h ? '🚨 Urgencias 24h' : '🏥 Veterinaria'}
                      size="small"
                      color={v.isEmergency24h ? 'error' : 'success'}
                      sx={{ fontWeight: 700 }}
                    />
                    {v.formattedDistance && (
                      <Chip label={`A ${v.formattedDistance}`} size="small" variant="outlined" />
                    )}
                  </Stack>
                  <Typography variant="subtitle1" fontWeight="800">
                    {v.clinicName}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5} my={0.5}>
                    <Rating value={v.rating} precision={0.1} size="small" readOnly />
                    <Typography variant="body2" fontWeight="700">
                      {v.rating} ({v.reviewCount} reseñas)
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    🕒 {v.openingHours}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    📍 {v.address}
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<PhoneIcon />}
                    href={`tel:${v.phone}`}
                  >
                    Llamar Urgencia ({v.phone})
                  </Button>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}

        {/* 4. PET STORES ($5.000 Basic & $10.000 Premium) */}
        {stores.map((st) => (
          <Marker
            key={st.id}
            position={[st.latitude, st.longitude]}
            icon={createStoreIcon(st.isPromoted)}
          >
            <Popup>
              <Card sx={{ maxWidth: 300, boxShadow: 'none' }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Box
                      component="img"
                      src={st.logoUrl}
                      alt="Logo"
                      sx={{ width: 44, height: 44, borderRadius: 2, objectFit: 'cover' }}
                    />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="800">
                        {st.businessName}
                      </Typography>
                      {st.isPromoted ? (
                        <Chip
                          label="⭐ Comercio Premium Destacado"
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                        />
                      ) : (
                        <Chip label="Comercio Asociado" size="small" variant="outlined" />
                      )}
                    </Box>
                  </Stack>

                  <Typography variant="caption" color="text.secondary" paragraph sx={{ mb: 1 }}>
                    {st.description}
                  </Typography>

                  {/* Promotions Coupon */}
                  {st.promotions && st.promotions.length > 0 && (
                    <Box p={1} mb={1} borderRadius={1.5} bgcolor="warning.50" border="1px dashed #F59E0B">
                      <Typography variant="caption" fontWeight="800" color="warning.dark">
                        🎟️ Cupón de la Comunidad:
                      </Typography>
                      <Typography variant="body2" fontWeight="900" color="warning.main">
                        {st.promotions[0].title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Usa el código: <strong>{st.promotions[0].code}</strong>
                      </Typography>
                    </Box>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<WhatsAppIcon />}
                    href={`https://wa.me/${st.whatsapp?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                  >
                    Contactar por WhatsApp
                  </Button>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};
