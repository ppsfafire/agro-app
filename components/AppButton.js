
import { Text, Pressable, StyleSheet } from 'react-native';

export default function MyButton({ onPress, title }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    elevation: 2,          // apenas Android
  },
  label: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});
