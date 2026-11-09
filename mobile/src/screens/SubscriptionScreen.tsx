import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { api } from '../services/api';

export const SubscriptionScreen = () => {
  const [targetTab, setTargetTab] = useState<'owner' | 'store'>('owner');

  const handleSubscribe = async (tier: string, name: string) => {
    Alert.alert(
      'Suscripción UbicaDog',
      `¿Deseas activar el ${name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar con Stripe',
          onPress: async () => {
            try {
              await api.post('/subscriptions/subscribe', { tier });
              Alert.alert('¡Éxito!', `Te has suscrito exitosamente al ${name}.`);
            } catch (e) {
              Alert.alert('Error', 'No se pudo procesar la suscripción.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>⭐ Membresías y Planes</Text>
      <Text style={styles.subtitle}>
        Sin publicidad. Modelo 100% por suscripción justa para la comunidad y comercios locales.
      </Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, targetTab === 'owner' && styles.tabActive]}
          onPress={() => setTargetTab('owner')}
        >
          <Text style={[styles.tabText, targetTab === 'owner' && styles.tabTextActive]}>
            🐾 Dueños de Mascotas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, targetTab === 'store' && styles.tabActive]}
          onPress={() => setTargetTab('store')}
        >
          <Text style={[styles.tabText, targetTab === 'store' && styles.tabTextActive]}>
            🛍️ Tiendas y Locales
          </Text>
        </TouchableOpacity>
      </View>

      {targetTab === 'owner' ? (
        <View>
          {/* Free Tier */}
          <View style={styles.planCard}>
            <Text style={styles.planTag}>PLAN COMUNITARIO</Text>
            <Text style={styles.planTitle}>Gratuito para Siempre</Text>
            <Text style={styles.planPrice}>$0 CLP</Text>
            <Text style={styles.benefit}>✓ Publicar mascotas callejeras ilimitadas</Text>
            <Text style={styles.benefit}>✓ Mapa interactivo en tiempo real</Text>
            <Text style={styles.benefit}>✓ Registro de hasta 1 mascota propia</Text>
          </View>

          {/* Pro Owner Tier */}
          <View style={[styles.planCard, styles.planCardFeatured]}>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>RECOMENDADO</Text>
            </View>
            <Text style={styles.planTag}>PLAN DUEÑOS PRO</Text>
            <Text style={styles.planTitle}>UbicaDog Pro</Text>
            <Text style={styles.planPrice}>$2.990 CLP / mes</Text>
            <Text style={styles.benefit}>✓ Registro ILIMITADO de mascotas</Text>
            <Text style={styles.benefit}>✓ Radio de búsqueda expandido al doble (x2)</Text>
            <Text style={styles.benefit}>✓ Placa Inteligente QR para el collar</Text>
            <Text style={styles.benefit}>✓ Ficha médica digital con vacunas</Text>
            <Text style={styles.benefit}>✓ Alertas prioritarias a vecinos cercanos</Text>

            <TouchableOpacity
              style={styles.subscribeBtn}
              onPress={() => handleSubscribe('pro_owner', 'Plan UbicaDog Pro ($2.990 CLP/mes)')}
            >
              <Text style={styles.subscribeBtnText}>Suscribirme por $2.990 CLP</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View>
          {/* Store Basic */}
          <View style={styles.planCard}>
            <Text style={styles.planTag}>COMERCIO BÁSICO</Text>
            <Text style={styles.planTitle}>Presencia en el Mapa</Text>
            <Text style={styles.planPrice}>$5.000 CLP / mes</Text>
            <Text style={styles.benefit}>✓ Pin verificado en el mapa barrial</Text>
            <Text style={styles.benefit}>✓ Botón directo a WhatsApp y llamadas</Text>
            <Text style={styles.benefit}>✓ Vitrina de hasta 5 artículos principales</Text>

            <TouchableOpacity
              style={[styles.subscribeBtn, { backgroundColor: '#2563EB' }]}
              onPress={() => handleSubscribe('store_basic', 'Plan Tienda Básica ($5.000 CLP/mes)')}
            >
              <Text style={styles.subscribeBtnText}>Activar por $5.000 CLP</Text>
            </TouchableOpacity>
          </View>

          {/* Store Premium */}
          <View style={[styles.planCard, styles.planCardGold]}>
            <View style={[styles.featuredBadge, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.featuredBadgeText}>MÁXIMA VISIBILIDAD</Text>
            </View>
            <Text style={styles.planTag}>COMERCIO PREMIUM</Text>
            <Text style={styles.planTitle}>Halo Dorado & Cupones</Text>
            <Text style={styles.planPrice}>$10.000 CLP / mes</Text>
            <Text style={styles.benefit}>✓ Pin destacado con halo dorado y logo en el mapa</Text>
            <Text style={styles.benefit}>✓ Catálogo ILIMITADO de productos y accesorios</Text>
            <Text style={styles.benefit}>✓ Emisión de Cupones de Descuento por geolocalización</Text>
            <Text style={styles.benefit}>✓ Posicionamiento número 1 en búsquedas de usuarios</Text>

            <TouchableOpacity
              style={[styles.subscribeBtn, { backgroundColor: '#D97706' }]}
              onPress={() => handleSubscribe('store_premium', 'Plan Tienda Premium ($10.000 CLP/mes)')}
            >
              <Text style={styles.subscribeBtnText}>Activar por $10.000 CLP</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginTop: 10 },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  tabRow: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#FFFFFF', elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#0F172A' },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    position: 'relative',
  },
  planCardFeatured: { borderColor: '#2563EB', borderWidth: 2 },
  planCardGold: { borderColor: '#F59E0B', borderWidth: 2 },
  featuredBadge: {
    position: 'absolute',
    top: 0,
    right: 20,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  featuredBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  planTag: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 4 },
  planTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  planPrice: { fontSize: 26, fontWeight: '900', color: '#2563EB', marginVertical: 8 },
  benefit: { fontSize: 13, color: '#334155', marginVertical: 4, fontWeight: '600' },
  subscribeBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  subscribeBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
