import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle, Callout } from 'react-native-maps';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

export const MapScreen = ({ navigation }: any) => {
  const [sightings, setSightings] = useState<any[]>([]);
  const [lostPets, setLostPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sightingsRes, radarRes] = await Promise.all([
        api.get('/sightings'),
        api.get('/pets/radar-active'),
      ]);
      setSightings(sightingsRes.data.sightings || []);
      setLostPets(radarRes.data.radarPets || []);
    } catch (e) {
      console.log('Error fetching map data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -33.4489,
          longitude: -70.6693,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {/* LOST PETS WITH EXPANDING RADAR CIRCLES */}
        {lostPets.map((pet) => (
          <React.Fragment key={pet.petId}>
            {/* The expanding estimated wander radius circle */}
            <Circle
              center={{ latitude: pet.centerLatitude, longitude: pet.centerLongitude }}
              radius={pet.radiusMeters}
              fillColor="rgba(249, 115, 22, 0.2)"
              strokeColor="#EF4444"
              strokeWidth={2}
            />

            {/* Inner high-density core */}
            <Circle
              center={{ latitude: pet.centerLatitude, longitude: pet.centerLongitude }}
              radius={Math.round(pet.radiusMeters * 0.4)}
              fillColor="rgba(239, 68, 68, 0.3)"
              strokeColor="#EA580C"
              strokeWidth={1}
            />

            <Marker
              coordinate={{ latitude: pet.centerLatitude, longitude: pet.centerLongitude }}
              title={`¡${pet.petName} PERDIDO!`}
              description={`Radio: ${pet.formattedRadius} • ${pet.daysLost} días`}
            >
              <View style={styles.lostMarkerOuter}>
                <Image source={{ uri: pet.photoUrl }} style={styles.lostMarkerAvatar} />
              </View>
            </Marker>
          </React.Fragment>
        ))}

        {/* STREET SIGHTINGS MARKERS */}
        {sightings.map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.latitude, longitude: s.longitude }}
            title={s.breed || 'Mascota avistada'}
            description={`${s.collarStatus === 'with_collar' ? '🔔 Con Collar' : 'Sin collar'} • ${s.address}`}
          >
            <View
              style={[
                styles.sightingMarker,
                { backgroundColor: s.collarStatus === 'with_collar' ? '#EF4444' : '#2563EB' },
              ]}
            >
              <Text style={{ fontSize: 16 }}>{s.species === 'dog' ? '🐶' : '🐱'}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Floating Street Sighting Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('QuickReport')}
        activeOpacity={0.85}
      >
        <Text style={styles.floatingButtonText}>🚨 Reportar Mascota Callejera</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
  lostMarkerOuter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  lostMarkerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  sightingMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#F97316',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
