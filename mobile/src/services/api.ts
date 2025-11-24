import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Determina a URL base de forma dinâmica
const getBaseUrl = () => {
  // Se estiver rodando no web
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  // Se estiver rodando no emulador Android
  if (Platform.OS === 'android') {
    // Verifica se há uma URL de host definida pelo Expo (útil para dispositivos físicos na mesma rede)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        // hostUri vem como "192.168.1.5:8081". Pegamos o IP e mudamos a porta para 3000
        const ip = hostUri.split(':')[0];
        return `http://${ip}:3000`;
    }
    return 'http://10.0.2.2:3000';
  }

  // iOS Simulator
  return 'http://localhost:3000';
};

const API_URL = getBaseUrl();
console.log("API_URL configurada:", API_URL); // Debug

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
