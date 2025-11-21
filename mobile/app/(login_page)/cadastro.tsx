import { Feather } from "@expo/vector-icons"
import { Stack, useRouter } from "expo-router"
import React, { useState, useEffect } from "react"
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native"
import api from "@/src/services/api";
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function getServerSideProps() {
  console.log("SSR redirect to / (login_page)/splash")
}

// Cores a serem usadas
const colors = {
  primaryRed: "#D32F2F",
  black: "#1E1E1E",
  gray: "#8C8C8C",
  gray50: "#DADADA",
  gray10: "#F2F2F2",
  white: "#FFFFFF",
}

const fonts = {
  regular: "Roboto-Regular",
  bold: "Roboto-Bold",
}

// Imports das Logos
const googleLogo: ImageSourcePropType = require("@/assets/images/google-logo.png")
const facebookLogo: ImageSourcePropType = require("@/assets/images/facebook-logo.png")

const CadastroScreen = () => {
  const router = useRouter()
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [isSenhaVisible, setIsSenhaVisible] = useState(false)
  const [isConfirmarSenhaVisible, setIsConfirmarSenhaVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  if (Platform.OS === "web") {
    WebBrowser.maybeCompleteAuthSession();
  }

  const extra = Constants.expoConfig?.extra || {};
  const webClientId = extra.GOOGLE_WEB_CLIENT_ID ||
    '186834080659-bvsr5g2ocvu78j8dq2sa8oj6kdm0nbn2.apps.googleusercontent.com';
  const androidClientId = extra.GOOGLE_ANDROID_CLIENT_ID ||
    '186834080659-bvsr5g2ocvu78j8dq2sa8oj6kdm0nbn2.apps.googleusercontent.com';
  const iosClientId = extra.GOOGLE_IOS_CLIENT_ID ||
    '186834080659-bvsr5g2ocvu78j8dq2sa8oj6kdm0nbn2.apps.googleusercontent.com';

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    webClientId,
    androidClientId,
    iosClientId,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.params?.id_token;
      handleGoogleLogin(idToken);
    }
  }, [response]);

  const handleGoogleLogin = async (idToken: string | undefined) => {
      if (!idToken) return;

      try {
          setLoading(true); // Usa o mesmo loading do form
          const res = await api.post("/auth/google", { idToken });
          if (res.status === 200 && res.data.token) {
              await AsyncStorage.setItem('user_token', res.data.token);
              router.replace("/(home_page)/home_page");
          } else {
              Alert.alert("Erro", `Erro de autenticação: ${res.data.error || "Desconhecido"}`);
          }
      } catch (error) {
          console.error("Erro no login google:", error);
          Alert.alert("Erro", "Falha ao conectar com o servidor.");
      } finally {
          setLoading(false);
      }
  }

  const handleRegister = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    // Validação básica de senha (ex: min 6 chars)
    if (senha.length < 6) {
       Alert.alert("Erro", "A senha deve ter no mínimo 6 caracteres.");
       return;
    }

    setLoading(true);
    try {
      // O endpoint de registro espera { nome_completo, email, senha }
      // O banco de dados pede 'nome_completo', mas o frontend usa 'nome'. Ajustando o payload.
      const payload = {
        nome_completo: nome,
        email,
        senha
      };

      const response = await api.post('/auth/register', payload);

      if (response.status === 201 || response.status === 200) {
        Alert.alert("Sucesso", "Conta criada com sucesso! Faça login para continuar.", [
          { text: "OK", onPress: () => router.replace("/(login_page)/login") }
        ]);
      } else {
        Alert.alert("Erro", "Não foi possível criar a conta. Tente novamente.");
      }
    } catch (error: any) {
      console.error("Erro no registro:", error);
      const msg = error.response?.data?.error || "Erro ao conectar ao servidor. Verifique sua conexão.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryRed} />

      <View style={styles.formContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            style={styles.input}
            placeholder="Insira o seu nome completo"
            placeholderTextColor={colors.gray}
            value={nome}
            onChangeText={setNome}
          />
          <TextInput
            style={styles.input}
            placeholder="Insira o seu email"
            placeholderTextColor={colors.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <View style={styles.passwordFields}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.inputPassword}
                placeholder="Crie a senha"
                placeholderTextColor={colors.gray}
                secureTextEntry={!isSenhaVisible}
                value={senha}
                onChangeText={setSenha}
              />
              <TouchableOpacity
                onPress={() => setIsSenhaVisible(!isSenhaVisible)}
              >
                <Feather
                  name={isSenhaVisible ? "eye-off" : "eye"}
                  size={20}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.inputPassword}
                placeholder="Confirme a senha"
                placeholderTextColor={colors.gray}
                secureTextEntry={!isConfirmarSenhaVisible}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
              />
              <TouchableOpacity
                onPress={() =>
                  setIsConfirmarSenhaVisible(!isConfirmarSenhaVisible)
                }
              >
                <Feather
                  name={isConfirmarSenhaVisible ? "eye-off" : "eye"}
                  size={20}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.hintText}>
            Mínimo 8 caracteres, incluindo letras, números e caracteres
            especiais.
          </Text>

          <TouchableOpacity
            style={styles.createAccountButton}
            activeOpacity={0.8}
            onPress={handleRegister}
            disabled={loading}
          >
             {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.createAccountButtonText}>Criar conta</Text>
                  <Feather name="arrow-up-right" size={20} color={colors.white} />
                </>
              )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Ou continue como</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialLoginContainer}>
            <TouchableOpacity
                style={styles.socialButton}
                onPress={() => promptAsync()}
                disabled={!request || loading}
            >
              <Image source={googleLogo} style={styles.socialLogo} />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Image source={facebookLogo} style={styles.socialLogo} />
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            Ao prosseguir, você confirma que leu e aceita os{" "}
            <Text style={styles.linkText}>Termos de Uso</Text> e a{" "}
            <Text style={styles.linkText}>Política de Privacidade.</Text>
          </Text>
        </ScrollView>
      </View>
    </View>
  )
}

// Estilização
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primaryRed,
  },
  header: {
    paddingHorizontal: "8%",
    paddingTop: "45%",
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    color: colors.white,
    fontFamily: fonts.regular,
    lineHeight: 31,
    letterSpacing: 0.5,
  },
  formContainer: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 20,
  },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: colors.gray10,
    borderRadius: 99,
    padding: 4,
    marginBottom: 16,
  },
  tabInactive: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabActive: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 99,
    paddingVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  tabTextInactive: {
    fontSize: 14,
    color: colors.gray,
    fontFamily: fonts.regular,
  },
  tabTextActive: {
    fontSize: 14,
    color: colors.black,
    fontFamily: fonts.bold,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray50,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 10,
    color: colors.black,
    fontFamily: fonts.regular,
  },
  passwordFields: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    width: "48.5%",
  },
  inputPassword: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.black,
    fontFamily: fonts.regular,
  },
  hintText: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 14,
    paddingHorizontal: 4,
    fontFamily: fonts.regular,
  },
  createAccountButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primaryRed,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    gap: "60%",
  },
  createAccountButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray50,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: colors.gray,
    fontFamily: fonts.regular,
  },
  socialLoginContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.gray50,
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 4,
  },
  socialLogo: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 14,
    color: colors.black,
    fontFamily: fonts.bold,
  },
  termsText: {
    fontSize: 12,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  linkText: {
    color: colors.primaryRed,
    textDecorationLine: "underline",
    fontFamily: fonts.bold,
  },
})

export default CadastroScreen
