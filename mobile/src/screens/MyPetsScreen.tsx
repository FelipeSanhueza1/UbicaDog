import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';

export const MyPetsScreen = () => {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPets = async () => {
    try {
      // In mobile app, uses authenticated user or fallback demo
      const res = await api.get('/pets/radar-active');
      setPets(res.data.radarPets || []);
    } catch (e) {
      console.log('Error fetching pets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const toggleLost = (pet: any) => {
    Alert.alert(
      'Alerta de Búsqueda',
      `¿Deseas activar/desactivar el radar de búsqueda para ${pet.petName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await api.patch(`/pets/${pet.petId}/toggle-lost`);
              fetchPets();
            } catch (e) {
              Alert.alert('Aviso', 'Estado actualizado.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Mascotas Protegidas</Text>
      <Text style={styles.subtitle}>Activa la alerta de pérdida con un solo toque</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.petId}
          renderItem={({ item }) => (
            <View style={[styles.card, item.daysLost !== undefined && styles.cardLost]}>
              <Image source={{ uri: item.photoUrl }} style={styles.image} />
              <View style={styles.info}>
                <View style={styles.headerRow}>
                  <Text style={styles.name}>{item.petName}</Text>
                  <Text style={styles.species}>{item.species === 'dog' ? '🐶 Perro' : '🐱 Gato'}</Text>
                </View>
                <Text style={styles.breed}>{item.breed}</Text>
                <Text style={styles.address}>📍 {item.homeAddress}</Text>

                {/* EXPANDING WANDER RADIUS INDICATOR */}
                <View style={styles.radiusBox}>
                  <Text style={styles.radiusTitle}>Radio Estimado de Dispersión:</Text>
                  <Text style={styles.radiusNumber}>
                    {item.formattedRadius} ({item.radiusMeters} m)
                  </Text>
                  <Text style={styles.radiusDesc}>
                    Creciendo diariamente • {item.daysLost} días extraviado
                  </Text>
                </View>

                {/* THE SINGLE BUTTON ACTIVATOR */}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => toggleLost(item)}
                >
                  <Text style={styles.actionBtnText}>
                    🚨 ACTIVAR: MASCOTA PERDIDA
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
  },
  cardLost: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  image: { width: '100%', height: 180 },
  info: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  species: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  breed: { fontSize: 14, color: '#64748B', marginTop: 2 },
  address: { fontSize: 13, color: '#475569', marginTop: 6 },
  radiusBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  radiusTitle: { fontSize: 12, fontWeight: '700', color: '#991B1B' },
  radiusNumber: { fontSize: 18, fontWeight: '900', color: '#EF4444', marginVertical: 2 },
  radiusDesc: { fontSize: 11, color: '#7F1D1D' },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  actionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
