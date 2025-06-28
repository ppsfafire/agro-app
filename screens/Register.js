// screens/RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { supabase } from '../services/supabase';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    is_producer: false
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      // Cria usuário no auth
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password
      });
      if (error) throw error;
      // Cria registro na tabela users
      const { error: userError } = await supabase.from('users').insert({
        id: data.user.id,
        name: form.name,
        is_producer: form.is_producer
      });
      if (userError) throw userError;
      Alert.alert('Sucesso', 'Cadastro realizado! Faça login.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cadastro</Text>
      <TextInput
        placeholder="Nome"
        value={form.name}
        onChangeText={v => handleChange('name', v)}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        value={form.email}
        onChangeText={v => handleChange('email', v)}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Senha"
        value={form.password}
        onChangeText={v => handleChange('password', v)}
        style={styles.input}
        secureTextEntry
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Sou produtor</Text>
        <Switch
          value={form.is_producer}
          onValueChange={v => handleChange('is_producer', v)}
        />
      </View>
      <Button title={loading ? 'Cadastrando...' : 'Cadastrar'} onPress={handleSubmit} disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#2E7D32' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 16, backgroundColor: 'white', fontSize: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  switchLabel: { fontSize: 16, color: '#333', marginRight: 12 }
});