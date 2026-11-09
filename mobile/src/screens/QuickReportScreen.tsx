import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';

export const QuickReportScreen = ({ navigation }: any) => {
  const [species, setSpecies] = useState<'dog' | 'cat' | 'other'>('dog');
  const [collarStatus, setCollarStatus] = useState<'with_collar' | 'no_collar' | 'unknown'>('unknown');
  const [breed, setBreed] = useState('');
  const [address, setAddress] = useState('Plaza Baquedano');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/sightings', {
        species,
        collarStatus,
        condition: 'wandering',
        breed: breed || (species === 'dog' ? 'Perro callejero' : 'Gato callejero'),
        photoUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
        latitude: -33.4372,
        longitude: -70.6345,
        address,
        seenAt: new Date().toISOString(),
        notes,
        contactPhone: phone,
      });

      Alert.alert('¡Publicado!', 'El avistamiento fue difundido en el mapa y avisado a los vecinos.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'No se pudo publicar el avistamiento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>🚨 Reportar Mascota en la Calle</Text>
      <Text style={styles.subtitle}>Rápido y sencillo: reporta en segundos</Text>

      {/* Species */}
      <Text style={styles.label}>1. Especie</Text>
      <View style={styles.row}>
        {(['dog', 'cat', 'other'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, species === s && styles.chipActive]}
            onPress={() => setSpecies(s)}
          >
            <Text style={[styles.chipText, species === s && styles.chipTextActive]}>
              {s === 'dog' ? '🐶 Perro' : s === 'cat' ? '🐱 Gato' : '🐾 Otro'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Collar */}
      <Text style={styles.label}>2. ¿Tiene collar visible?</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.chip, collarStatus === 'with_collar' && styles.chipAlert]}
          onPress={() => setCollarStatus('with_collar')}
        >
          <Text style={[styles.chipText, collarStatus === 'with_collar' && styles.chipTextActive]}>
            🔔 Con Collar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, collarStatus === 'no_collar' && styles.chipActive]}
          onPress={() => setCollarStatus('no_collar')}
        >
          <Text style={[styles.chipText, collarStatus === 'no_collar' && styles.chipTextActive]}>
            🚫 Sin Collar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Address */}
      <Text style={styles.label}>3. Lugar donde se vio</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="Calle, esquina o plaza"
      />

      {/* Breed */}
      <Text style={styles.label}>4. Raza o color aproximado</Text>
      <TextInput
        style={styles.input}
        value={breed}
        onChangeText={setBreed}
        placeholder="Ej. Mestizo café mediano"
      />

      {/* Phone */}
      <Text style={styles.label}>5. Teléfono de contacto (opcional)</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="+56 9 1234 5678"
        keyboardType="phone-pad"
      />

      {/* Notes */}
      <Text style={styles.label}>6. Notas adicionales</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Ej. Asustado, se refugió bajo un auto..."
        multiline
      />

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Emitir Alerta en el Mapa</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8, marginTop: 12 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#2563EB' },
  chipAlert: { backgroundColor: '#EF4444' },
  chipText: { fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#FFFFFF' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
