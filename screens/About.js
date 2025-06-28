import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sobre o App</Text>
      <Text style={styles.text}>
        Este aplicativo de e-commerce de produtos agrícolas conecta consumidores às feiras públicas
        locais, permite buscar produtos, adicionar ao carrinho e verifica a previsão do tempo para
        planejar suas compras. Desenvolvido como projeto didático.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  text: { fontSize: 16, lineHeight: 22 },
});