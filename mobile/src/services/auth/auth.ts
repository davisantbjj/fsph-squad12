import api from "@/src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { validateCredentials } from "./credentials";

export type GetLoginParams = {
  email: string
  senha: string
}

// Retorna apenas o resultado da tentativa de login.
export async function getLogin({ email, senha }: GetLoginParams) {
  try {
    // validação no cliente
    const validation = validateCredentials({ email, senha })

    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    // Chamada real à API
    const response = await api.post('/auth/login', { email, senha });

    if (response.status === 200 && response.data.token) {
      // Armazena o token
      await AsyncStorage.setItem('user_token', response.data.token);
      // Se a API retornar dados do usuário, também seria bom salvar
      // await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
      return { success: true };
    } else {
        return { success: false, message: "Falha na autenticação." };
    }

  } catch (error: any) {
    console.error("Erro no login:", error);
    // Tenta extrair a mensagem de erro da API
    const message = error.response?.data?.error || error.message || "Erro desconhecido ao tentar logar.";
    return { success: false, message };
  }
}

export async function logout() {
    try {
        await AsyncStorage.removeItem('user_token');
        // Limpar outros dados se necessário
    } catch (e) {
        console.error("Erro ao fazer logout", e);
    }
}
