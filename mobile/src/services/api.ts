import axios from 'axios';
import { Platform } from 'react-native';

// Tu IP local en la red Wi-Fi (detectada por Vite: 192.168.1.130).
// Esto permite que tu teléfono físico (con Expo Go) se comunique con el backend en tu Mac.
const LOCAL_WIFI_IP = '192.168.1.130';

export const API_BASE_URL = Platform.select({
  // En emulador estándar de Android Studio se usa 10.0.2.2 o la IP local
  android: `http://${LOCAL_WIFI_IP}:5001/api`,
  // En simulador de iOS o teléfono físico con Expo Go
  ios: `http://${LOCAL_WIFI_IP}:5001/api`,
  default: `http://${LOCAL_WIFI_IP}:5001/api`,
});

export const api = axios.create({
  baseURL: API_BASE_URL,
});
