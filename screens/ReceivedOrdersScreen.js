import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { supabase } from '../services/supabase';

export default function ReceivedOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    setUserId(userData.user.id);
    // Busca pedidos que tenham produtos do produtor logado
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, producer_id, stock_quantity))')
      .order('created_at', { ascending: false });
    if (!error) {
      // Filtra pedidos que tenham pelo menos um item do produtor
      const filtered = (data || []).filter(order =>
        order.order_items?.some(oi => oi.products?.producer_id === userData.user.id)
      );
      setOrders(filtered);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    // Realtime subscription
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      if (newStatus === 'cancelled') await restoreStock(orderId);
      Alert.alert('Sucesso', `Pedido ${newStatus === 'confirmed' ? 'confirmado' : 'cancelado'}!`);
      fetchOrders();
    }
  };

  // Devolve estoque dos produtos do produtor se cancelar
  const restoreStock = async (orderId) => {
    const { data: items } = await supabase.from('order_items').select('*, products(producer_id, stock_quantity)').eq('order_id', orderId);
    for (const item of items) {
      if (item.products?.producer_id === userId) {
        await supabase
          .from('products')
          .update({ stock_quantity: item.products.stock_quantity + item.quantity })
          .eq('id', item.product_id);
      }
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!orders.length) return <Text style={styles.empty}>Nenhum pedido recebido.</Text>;

  return (
    <FlatList
      data={orders}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.status}>Status: {item.status}</Text>
          <Text style={styles.date}>Data: {new Date(item.created_at).toLocaleString()}</Text>
          <Text style={styles.title}>Itens do seu estoque:</Text>
          {item.order_items?.filter(oi => oi.products?.producer_id === userId).map(oi => (
            <Text key={oi.id}>- {oi.products?.name} x{oi.quantity}</Text>
          ))}
          {item.status === 'pending' && (
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <Button title="Confirmar" color="#2E7D32" onPress={() => handleUpdateStatus(item.id, 'confirmed')} />
              <View style={{ width: 10 }} />
              <Button title="Cancelar" color="#f44336" onPress={() => handleUpdateStatus(item.id, 'cancelled')} />
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', margin: 10, padding: 16, borderRadius: 8, elevation: 2 },
  status: { fontWeight: 'bold', color: '#2E7D32' },
  date: { color: '#888' },
  title: { fontWeight: 'bold', marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' }
}); 