// screens/LoginScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../services/supabase';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  function handleChange(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    const { email, password } = form;
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      if (data.session) {
        await login(data.session.access_token);
        Alert.alert('Sucesso', `Bem-vindo!`);
      } else {
        Alert.alert('Erro', 'Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      Alert.alert('Falha no login', error.message || 'E-mail ou senha incorretos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AgroFamília</Text>
        <Text style={styles.subtitle}>Faça login para continuar</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          value={form.email}
          onChangeText={v => handleChange('email', v)}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          placeholder="Senha"
          value={form.password}
          onChangeText={v => handleChange('password', v)}
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Fazendo login...</Text>
          </View>
        ) : (
          <Button 
            title="Entrar" 
            onPress={handleSubmit}
            color="#4CAF50"
          />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Não tem uma conta?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Cadastre-se aqui</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.demoInfo}>
        <Text style={styles.demoTitle}>Dados de Demonstração:</Text>
        <Text style={styles.demoText}>Email: joao@agrofamilia.com</Text>
        <Text style={styles.demoText}>Senha: 123456</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fafafa'
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  footer: {
    alignItems: 'center',
    marginBottom: 24
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8
  },
  linkText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  demoInfo: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center'
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8
  },
  demoText: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 2
  }
});    