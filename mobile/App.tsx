import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { MapScreen } from './src/screens/MapScreen';
import { QuickReportScreen } from './src/screens/QuickReportScreen';
import { MyPetsScreen } from './src/screens/MyPetsScreen';
import { VeterinariesScreen } from './src/screens/VeterinariesScreen';
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import { EmployeeLoginScreen } from './src/screens/EmployeeLoginScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#2563EB' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '800' },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Mapa y Radar',
          tabBarLabel: 'Mapa',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🗺️</Text>,
        }}
      />
      <Tab.Screen
        name="Veterinaries"
        component={VeterinariesScreen}
        options={{
          title: 'Veterinarias',
          tabBarLabel: 'Veterinarias',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🏥</Text>,
        }}
      />
      <Tab.Screen
        name="MyPets"
        component={MyPetsScreen}
        options={{
          title: 'Mis Mascotas',
          tabBarLabel: 'Mascotas',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🐾</Text>,
        }}
      />
      <Tab.Screen
        name="Subscriptions"
        component={SubscriptionScreen}
        options={{
          title: 'Membresías',
          tabBarLabel: 'Planes',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>⭐</Text>,
        }}
      />
      <Tab.Screen
        name="EmployeeLogin"
        component={EmployeeLoginScreen}
        options={{
          title: 'Portal Personal',
          tabBarLabel: 'Personal',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🛡️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator>
        <Stack.Screen name="MainTabs" component={HomeTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="QuickReport"
          component={QuickReportScreen}
          options={{
            title: 'Reportar en Calle',
            headerStyle: { backgroundColor: '#F97316' },
            headerTintColor: '#FFFFFF',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
