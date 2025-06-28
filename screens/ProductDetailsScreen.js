// screens/ProductDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params;
  const storageKey = `comments_${product.id}`;

  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Carrega comentários do AsyncStorage ao montar
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          setComments(JSON.parse(raw));
        }
      } catch (e) {
        console.warn('Erro ao ler comentários:', e);
      }
    })();
  }, [storageKey]);

  // Persiste no AsyncStorage sempre que comments mudar
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(comments));
      } catch (e) {
        console.warn('Erro ao salvar comentários:', e);
      }
    })();
  }, [comments, storageKey]);

  const handleAdd = () => {
    if (!text.trim()) return;
    setComments(prev => [
      ...prev,
      { id: Date.now().toString(), text: text.trim() }
    ]);
    setText('');
  };

  const handleRemove = id => {
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const startEdit = (id, current) => {
    setEditingId(id);
    setEditingText(current);
  };

  const handleSaveEdit = id => {
    setComments(prev =>
      prev.map(c => (c.id === id ? { ...c, text: editingText } : c))
    );
    setEditingId(null);
    setEditingText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{product.name}</Text>
      <Text style={styles.price}>R$ {product.price.toFixed(2)}</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Escreva um comentário"
          value={text}
          onChangeText={setText}
        />
        <Button title="Adicionar" onPress={handleAdd} />
      </View>

      <FlatList
        data={comments}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Sem comentários.</Text>}
        renderItem={({ item }) => (
          <View style={styles.commentBox}>
            {editingId === item.id ? (
              <>
                <TextInput
                  style={styles.input}
                  value={editingText}
                  onChangeText={setEditingText}
                />
                <View style={styles.buttonRow}>
                  <Button title="Salvar" onPress={() => handleSaveEdit(item.id)} />
                  <Button title="Cancelar" onPress={() => setEditingId(null)} />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.commentText}>{item.text}</Text>
                <View style={styles.buttonRow}>
                  <Button title="Editar" onPress={() => startEdit(item.id, item.text)} />
                  <Button title="Excluir" onPress={() => handleRemove(item.id)} />
                </View>
              </>
            )}
          </View>
        )}
      />

      <Button title="Fechar" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  price: { fontSize: 20, marginBottom: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginRight: 8
  },
  empty: { textAlign: 'center', color: '#666', marginVertical: 20 },
  commentBox: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 8
  },
  commentText: { marginBottom: 6, fontSize: 16 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  }
});