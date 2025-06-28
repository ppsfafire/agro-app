import React, { useContext } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { cart, removeFromCart, clearCart } = useContext(CartContext);
  const { logout } = useContext(AuthContext);
  const navigation = useNavigation();

  const total = cart.reduce((sum, i) => sum + i.price, 0);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seu Carrinho</Text>
      <Button
        title="Meus Pedidos"
        onPress={() => navigation.navigate('MyOrders')}
      />
      <Button
        title="Pedidos Recebidos (Produtor)"
        onPress={() => navigation.navigate('ReceivedOrders')}
      />
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name} — R$ {item.price.toFixed(2)}</Text>
            <Button title="Remover" onPress={() => removeFromCart(item.id)} />
          </View>
        )}
        ListEmptyComponent={<Text>Seu carrinho está vazio.</Text>}
      />
      {cart.length > 0 && (
        <>
          <Text style={styles.total}>Total: R$ {total.toFixed(2)}</Text>
          <Button title="Limpar Carrinho" onPress={clearCart} />
        </>
      )}
      <Button title="Sair" color="#f44336" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  total: { fontSize: 18, fontWeight: 'bold', marginVertical: 12 },
});