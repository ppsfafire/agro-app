// screens/Home.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { CartContext } from '../context/CartContext';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
  const { addToCart } = useContext(CartContext);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState({
    description: null,
    temp: null
  });
  const [quantityPrompt, setQuantityPrompt] = useState({ visible: false, product: null });
  const [inputQuantity, setInputQuantity] = useState('1');
  const [isProducer, setIsProducer] = useState(false);

  // Buscar produtos do Supabase
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  // Buscar clima de Recife
  const fetchWeather = async () => {
    try {
      const response = await fetch('https://wttr.in/Recife?format=j1');
      const data = await response.json();
      const cond = data?.current_condition?.[0];
      if (cond) {
        setWeather({
          description: cond.weatherDesc?.[0]?.value ?? null,
          temp: cond.temp_C ?? null
        });
      }
    } catch (error) {
      console.error('Erro ao buscar clima:', error);
    }
  };

  // Buscar se o usuário é produtor
  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) return;
      const { user } = data;
      // Buscar dados extras do usuário na tabela users
      const { data: userData } = await supabase
        .from('users')
        .select('is_producer')
        .eq('id', user.id)
        .single();
      setIsProducer(userData?.is_producer === true);
    };
    fetchUser();
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    fetchProducts();
    fetchWeather();
    // Subscription realtime para produtos
    const channel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Filtra produtos pelo nome
  useEffect(() => {
    if (query.trim() === '') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter(p =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.description?.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  }, [query, products]);

  // Função de refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchWeather()]);
    setRefreshing(false);
  };

  // Adicionar ao carrinho
  const handleAddToCart = (product) => {
    setQuantityPrompt({ visible: true, product });
    setInputQuantity('1');
  };

  const confirmAddToCart = () => {
    const qty = parseInt(inputQuantity, 10);
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Quantidade inválida', 'Digite um valor válido.');
      return;
    }
    addToCart({ ...quantityPrompt.product, quantity: qty });
    setQuantityPrompt({ visible: false, product: null });
    setInputQuantity('1');
    Alert.alert('Sucesso', `${quantityPrompt.product.name} adicionado ao carrinho!`);
  };

  // Renderizar item do produto
  const renderProduct = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
      style={styles.productCard}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description || 'Sem descrição'}
        </Text>
        <Text style={styles.productPrice}>
          R$ {parseFloat(item.price).toFixed(2)} / {item.unit}
        </Text>
        {item.stock_quantity > 0 ? (
          <Text style={styles.stockInfo}>
            Em estoque: {item.stock_quantity} {item.unit}
          </Text>
        ) : (
          <Text style={styles.outOfStock}>Fora de estoque</Text>
        )}
      </View>
      <View style={styles.productActions}>
        <Button 
          title="Adicionar" 
          onPress={() => handleAddToCart(item)}
          disabled={item.stock_quantity <= 0}
        />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando produtos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agricultura Familiar</Text>

      <TextInput
        placeholder="Buscar produto..."
        value={query}
        onChangeText={setQuery}
        style={styles.input}
      />

      {weather.description && weather.temp && (
        <View style={styles.weatherContainer}>
          <Text style={styles.weather}>
            🌤️ Tempo em Recife: {weather.description}, {weather.temp}°C
          </Text>
        </View>
      )}

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {query ? 'Nenhum produto encontrado para sua busca.' : 'Nenhum produto disponível no momento.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id.toString()}
          renderItem={renderProduct}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de quantidade */}
      {quantityPrompt.visible && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 12, width: 300 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Quantidade</Text>
            <Text style={{ marginBottom: 8 }}>{quantityPrompt.product?.name}</Text>
            <TextInput
              keyboardType="numeric"
              value={inputQuantity}
              onChangeText={setInputQuantity}
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 }}
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button title="Cancelar" color="#888" onPress={() => setQuantityPrompt({ visible: false, product: null })} />
              <Button title="Adicionar" onPress={confirmAddToCart} />
            </View>
          </View>
        </View>
      )}

      {/* Botão flutuante para cadastrar produto (apenas produtores) */}
      {isProducer && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('ProductCreate')}
        >
          <Ionicons name="add-circle" size={56} color="#2E7D32" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 16,
    color: '#2E7D32',
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: 'white',
    fontSize: 16
  },
  weatherContainer: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  weather: { 
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center'
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  productInfo: {
    flex: 1
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4
  },
  stockInfo: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 12
  },
  outOfStock: {
    fontSize: 12,
    color: '#f44336',
    marginBottom: 12
  },
  productActions: {
    alignItems: 'flex-end'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: 'transparent',
    zIndex: 20
  }
});