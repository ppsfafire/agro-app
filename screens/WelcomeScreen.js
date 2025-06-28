// screens/WelcomeScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        👋 Bem-vindo ao App de Agricultura Familiar!
      </Text>
      <Button title="Fazer Login" onPress={() => navigation.navigate('Login')} />
      <View style={{ height: 10 }} />
      <Button title="Cadastrar" onPress={() => navigation.navigate('Register')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16
  },
  title: {
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 24, 
    textAlign: 'center'
  }
});