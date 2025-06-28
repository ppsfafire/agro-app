// App.js
import React, { useState, useEffect, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext }  from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import WelcomeScreen          from './screens/WelcomeScreen';
import LoginScreen            from './screens/LoginScreen';
import RegisterScreen         from './screens/Register';
import HomeScreen             from './screens/Home';
import MapScreen              from './screens/Map';
import AboutScreen            from './screens/About';
import ProfileScreen          from './screens/Profile';
import ProductDetailsScreen   from './screens/ProductDetailsScreen';
import CartScreen             from './screens/CartScreen';
import ProductCreateScreen    from './screens/ProductCreateScreen';
import MyOrdersScreen         from './screens/MyOrdersScreen';
import ReceivedOrdersScreen   from './screens/ReceivedOrdersScreen';

const RootStack = createNativeStackNavigator();
const Tab       = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let icon = 'home';
          if (route.name === 'Mapa')   icon = 'map';
          if (route.name === 'About')  icon = 'information-circle';
          if (route.name === 'Perfil') icon = 'person';
          if (route.name === 'Carrinho') icon = 'cart';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"   component={HomeScreen} />
      <Tab.Screen name="Carrinho" component={CartScreen} />
      <Tab.Screen name="Mapa"   component={MapScreen} />
      <Tab.Screen name="About"  component={AboutScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Welcome"  component={WelcomeScreen} />
      <RootStack.Screen name="Login"    component={LoginScreen} />
      <RootStack.Screen name="Register" component={RegisterScreen} />
    </RootStack.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  // carrega token do AsyncStorage
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
      setIsLoading(false);
    })();
  }, []);

  const authContext = useMemo(() => ({
    login: async token => {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
    },
    logout: async () => {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
    },
    userToken
  }), [userToken]);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <CartProvider>
        <NavigationContainer>
          {userToken ? (
            <RootStack.Navigator>
              {/* telas principais */}
              <RootStack.Screen
                name="Main"
                component={MainTabs}
                options={{ headerShown: false }}
              />
              {/* detalhes do produto como modal */}
              <RootStack.Screen
                name="ProductDetails"
                component={ProductDetailsScreen}
                options={{
                  presentation: 'modal',
                  title: 'Detalhes do Produto'
                }}
              />
              <RootStack.Screen
                name="Cart"
                component={CartScreen}
                options={{ title: 'Carrinho' }}
              />
              <RootStack.Screen
                name="ProductCreate"
                component={ProductCreateScreen}
                options={{ title: 'Cadastrar Produto' }}
              />
              <RootStack.Screen
                name="MyOrders"
                component={MyOrdersScreen}
                options={{ title: 'Meus Pedidos' }}
              />
              <RootStack.Screen
                name="ReceivedOrders"
                component={ReceivedOrdersScreen}
                options={{ title: 'Pedidos Recebidos' }}
              />
            </RootStack.Navigator>
          ) : (
            <AuthStack />
          )}
        </NavigationContainer>
      </CartProvider>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});