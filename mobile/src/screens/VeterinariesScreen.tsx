import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';

export const VeterinariesScreen = () => {
  const [vets, setVets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [only24h, setOnly24h] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'distance'>('rating');

  const fetchVets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/veterinaries', {
        params: {
          lat: -33.4489,
          lng: -70.6693,
          sortBy,
          onlyEmergency24h: only24h,
        },
      });
      setVets(res.data.veterinaries || []);
    } catch (e) {
      console.log('Error fetching vets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVets();
  }, [only24h, sortBy]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏥 Clínicas Veterinarias</Text>
      <Text style={styles.subtitle}>Ordenadas por valoración y cercanía GPS</Text>

      {/* Filter and Switch */}
      <View style={styles.filterCard}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>🚨 Solo Urgencias 24 Horas</Text>
          <Switch value={only24h} onValueChange={setOnly24h} trackColor={{ true: '#EF4444', false: '#CBD5E1' }} />
        </View>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, sortBy === 'rating' && styles.toggleBtnActive]}
            onPress={() => setSortBy('rating')}
          >
            <Text style={[styles.toggleText, sortBy === 'rating' && styles.toggleTextActive]}>
              ⭐ Mejor Valoradas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, sortBy === 'distance' && styles.toggleBtnActive]}
            onPress={() => setSortBy('distance')}
          >
            <Text style={[styles.toggleText, sortBy === 'distance' && styles.toggleTextActive]}>
              📍 Más Cercanas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={vets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.card, item.isEmergency24h && styles.card24h]}>
              <Image source={{ uri: item.photoUrl }} style={styles.image} />
              <View style={styles.cardContent}>
                <View style={styles.badgeRow}>
                  {item.isEmergency24h ? (
                    <Text style={styles.badge24h}>URGENCIAS 24H</Text>
                  ) : (
                    <Text style={styles.badgeNormal}>CLÍNICA</Text>
                  )}
                  <Text style={styles.distanceText}>📍 A {item.formattedDistance}</Text>
                </View>

                <Text style={styles.clinicName}>{item.clinicName}</Text>

                <View style={styles.ratingRow}>
                  <Text style={styles.ratingStars}>⭐⭐⭐⭐⭐</Text>
                  <Text style={styles.ratingScore}>{item.rating}</Text>
                  <Text style={styles.reviewCount}>({item.reviewCount} opiniones)</Text>
                </View>

                <Text style={styles.address}>📍 {item.address}</Text>
                <Text style={styles.hours}>🕒 {item.openingHours}</Text>

                <TouchableOpacity
                  style={[styles.callBtn, { backgroundColor: item.isEmergency24h ? '#EF4444' : '#10B981' }]}
                  onPress={() => Linking.openURL(`tel:${item.phone}`)}
                >
                  <Text style={styles.callBtnText}>📞 Llamar Urgencia: {item.phone}</Text>
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
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 14 },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  switchLabel: { fontWeight: '700', fontSize: 14, color: '#DC2626' },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: '#2563EB' },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  toggleTextActive: { color: '#FFFFFF' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
  },
  card24h: { borderColor: '#EF4444', borderWidth: 2 },
  image: { width: '100%', height: 140 },
  cardContent: { padding: 14 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge24h: { backgroundColor: '#FEE2E2', color: '#DC2626', fontWeight: '800', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeNormal: { backgroundColor: '#D1FAE5', color: '#059669', fontWeight: '800', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  distanceText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  clinicName: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  ratingStars: { fontSize: 12 },
  ratingScore: { fontWeight: '800', fontSize: 14, color: '#D97706' },
  reviewCount: { fontSize: 12, color: '#64748B' },
  address: { fontSize: 13, color: '#475569', marginBottom: 2 },
  hours: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  callBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  callBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
