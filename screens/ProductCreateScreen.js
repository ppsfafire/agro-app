import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProductCreateScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [isProducer, setIsProducer] = useState(null);

  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.stock_quantity) {
      Alert.alert('Erro', 'Preencha nome, preço e quantidade.');
      return;
    }
    setLoading(true);
    try {
      // Buscar usuário autenticado
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error('Usuário não autenticado');
      const userId = userData.user.id;
      // Buscar se é produtor
      const { data: dbUser, error: dbUserError } = await supabase
        .from('users')
        .select('is_producer')
        .eq('id', userId)
        .single();
      if (dbUserError || !dbUser?.is_producer) throw new Error('Apenas produtores podem cadastrar produtos.');
      // Insert do produto
      const { error } = await supabase.from('products').insert({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity, 10),
        image_url: form.image_url,
        producer_id: userId
      });
      if (error) throw error;
      Alert.alert('Sucesso', 'Produto cadastrado!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return setIsProducer(false);
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) return setIsProducer(false);
      const { user } = data;
      const { data: userData } = await supabase
        .from('users')
        .select('is_producer')
        .eq('id', user.id)
        .single();
      setIsProducer(userData?.is_producer === true);
    };
    fetchUser();
  }, []);

  if (isProducer === false) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontSize: 18, color: '#f44336', textAlign: 'center' }}>
          Apenas produtores podem cadastrar produtos para venda.
        </Text>
      </View>
    );
  }
  if (isProducer === null) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cadastrar Produto</Text>
      <TextInput
        placeholder="Nome"
        value={form.name}
        onChangeText={v => handleChange('name', v)}
        style={styles.input}
      />
      <TextInput
        placeholder="Descrição"
        value={form.description}
        onChangeText={v => handleChange('description', v)}
        style={styles.input}
      />
      <TextInput
        placeholder="Preço"
        value={form.price}
        onChangeText={v => handleChange('price', v)}
        style={styles.input}
        keyboardType="decimal-pad"
      />
      <TextInput
        placeholder="Quantidade em estoque"
        value={form.stock_quantity}
        onChangeText={v => handleChange('stock_quantity', v)}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="URL da imagem (opcional)"
        value={form.image_url}
        onChangeText={v => handleChange('image_url', v)}
        style={styles.input}
      />
      <Button title={loading ? 'Salvando...' : 'Cadastrar'} onPress={handleSubmit} disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#2E7D32' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 16, backgroundColor: 'white', fontSize: 16 }
}); 