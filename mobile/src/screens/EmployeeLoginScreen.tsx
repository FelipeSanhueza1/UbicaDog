import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';

export const EmployeeLoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('empleado@ubicadog.com');
  const [password, setPassword] = useState('empleado123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await api.post('/auth/employee-login', { email, password });
      Alert.alert('Acceso Autorizado', `Bienvenido al sistema corporativo, ${res.data.user.name}`);
      navigation.navigate('Map');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Credenciales corporativas inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.badge}>ACCESO RESTRINGIDO</Text>
        <Text style={styles.title}>Portal de Empleados</Text>
        <Text style={styles.subtitle}>Gestión y moderación móvil de UbicaDog</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Correo corporativo"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña"
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Ingresar al Panel</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#111827', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1E3A8A' },
  badge: { color: '#60A5FA', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94A3B8', marginBottom: 20 },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    color: '#FFFFFF',
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  btn: { backgroundColor: '#2563EB', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
