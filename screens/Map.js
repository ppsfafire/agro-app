// screens/Map.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const MARKETS = [
  { id: 1, name: 'Feira da Boa Vista',    latitude: -8.0613, longitude: -34.8711 },
  { id: 2, name: 'Feira de Casa Amarela', latitude: -7.9862, longitude: -34.8764 },
  // ... adicione mais pontos
];

export default function MapScreen() {
  const [region, setRegion] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permissão de localização negada');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  if (!region) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <MapView style={styles.map} initialRegion={region}>
      {MARKETS.map(market => (
        <Marker
          key={market.id}
          coordinate={{
            latitude: market.latitude,
            longitude: market.longitude
          }}
          title={market.name}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1
  }
});   