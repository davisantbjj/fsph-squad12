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

// Helper to set auth header in-memory (avoids depending on AsyncStorage timing)
function setAuthToken(token: string | null) {
  if (token) {
    // Ensure no surrounding quotes or whitespace
    const clean = (token as string).toString().trim().replace(/^"|"$/g, '');
    api.defaults.headers.common.Authorization = `Bearer ${clean}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.request.use(async (config) => {
  // Prefer in-memory default header (setAuthToken) to avoid AsyncStorage timing issues
  const defaultHeader = api.defaults.headers.common.Authorization;
  if (defaultHeader) {
    config.headers.Authorization = defaultHeader;
    try {
      // Debug: log masked Authorization to help diagnose header issues without printing full token
      const headerToLog = config.headers.Authorization as string;
      const masked = headerToLog ? headerToLog.replace(/(Bearer )?(.{8}).*/, '$1$2...') : headerToLog;
      console.debug('[api] request', config.url, 'Authorization:', masked);
    } catch (e) {}
    return config;
  }

  // Fallback: try AsyncStorage if default header not set
  try {
    const token = await AsyncStorage.getItem('user_token');
    if (token) config.headers.Authorization = `Bearer ${(token as string).trim().replace(/^"|"$/g, '')}`;
  } catch (e) {
    // ignore
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de resposta: trata 401 limpando token e logando detalhes
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    // Log detalhado para debug
    try {
      console.warn('API response error:', {
        url: error.config?.url,
        method: error.config?.method,
        status,
        data: error.response?.data,
      });
    } catch (e) {
      // ignore logging failures
    }

    if (status === 401) {
      // Não removemos o token automaticamente aqui para evitar logout inesperado
      // (ex.: abrir perfil dispara 401). A decisão de limpar credenciais deve
      // ser tomada pela UI/fluxo de navegação para melhorar UX.
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
export { setAuthToken };
