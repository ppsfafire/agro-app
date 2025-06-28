import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../services/supabase';

export default function MyOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, image_url))')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });
    if (!error) setOrders(data || []);
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

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!orders.length) return <Text style={styles.empty}>Nenhum pedido encontrado.</Text>;

  return (
    <FlatList
      data={orders}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.status}>Status: {item.status}</Text>
          <Text style={styles.date}>Data: {new Date(item.created_at).toLocaleString()}</Text>
          <Text style={styles.total}>Total: R$ {item.total_amount?.toFixed(2)}</Text>
          <Text style={styles.title}>Itens:</Text>
          {item.order_items?.map(oi => (
            <Text key={oi.id}>- {oi.products?.name} x{oi.quantity}</Text>
          ))}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', margin: 10, padding: 16, borderRadius: 8, elevation: 2 },
  status: { fontWeight: 'bold', color: '#2E7D32' },
  date: { color: '#888' },
  total: { marginTop: 4, marginBottom: 4 },
  title: { fontWeight: 'bold', marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' }
}); 