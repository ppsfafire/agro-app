import React, { useContext } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert } from 'react-native';
import { CartContext } from '../context/CartContext';
import { supabase } from '../services/supabase';

export default function CartScreen({ navigation }) {
  const { cart, removeFromCart, clearCart } = useContext(CartContext);

  const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  const handleRemove = (id) => {
    removeFromCart(id);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione produtos antes de finalizar o pedido.');
      return;
    }
    try {
      // Buscar usuário autenticado
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Usuário não autenticado');
      const userId = userData.user.id;
      // Calcular total
      const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      // Criar pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({ user_id: userId, total_amount: total, status: 'pending' })
        .select()
        .single();
      if (orderError) throw orderError;
      // Criar itens do pedido e atualizar estoque
      for (const item of cart) {
        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity || 1,
          unit_price: item.price,
          total_price: item.price * (item.quantity || 1)
        });
        // Atualizar estoque
        await supabase
          .from('products')
          .update({ stock_quantity: item.stock_quantity - (item.quantity || 1) })
          .eq('id', item.id);
      }
      clearCart();
      Alert.alert('Sucesso', 'Pedido realizado com sucesso!', [
        { text: 'Ver meus pedidos', onPress: () => navigation.navigate('MyOrders') }
      ]);
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao finalizar pedido');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Carrinho de Compras</Text>
      {cart.length === 0 ? (
        <Text style={styles.empty}>Seu carrinho está vazio.</Text>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>R$ {parseFloat(item.price).toFixed(2)} x {item.quantity || 1}</Text>
              </View>
              <Button title="Remover" color="#f44336" onPress={() => handleRemove(item.id)} />
            </View>
          )}
        />
      )}
      <View style={styles.footer}>
        <Text style={styles.total}>Total: R$ {total.toFixed(2)}</Text>
        <Button title="Finalizar Pedido" onPress={handleCheckout} disabled={cart.length === 0} />
        <Button title="Limpar Carrinho" onPress={clearCart} color="#888" disabled={cart.length === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#2E7D32' },
  empty: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 32 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 8, padding: 12, marginBottom: 10, elevation: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  price: { fontSize: 14, color: '#666' },
  footer: { marginTop: 24 },
  total: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32', marginBottom: 12, textAlign: 'center' }
}); 