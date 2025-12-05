import { Feather } from "@expo/vector-icons"
import { router, Stack } from "expo-router"
import React, { useEffect, useRef, useState } from "react"
import {
  Animated,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

// Paleta de Cores
const colors = {
  primaryRed: "#D32F2F",
  black: "#1E1E1E",
  gray: "#8C8C8C",
  gray50: "#DADADA",
  gray10: "#F2F2F2",
  white: "#FFFFFF",
  lightBlue: "#E3F2FD",
  blue: "#1976D2",
}

// Fontes
const fonts = {
  regular: "Roboto-Regular",
  bold: "Roboto-Bold",
}

const LoginScreen = () => {
  const [email, setEmail] = useState("")
  //Função para mostrar e esconder o login com google
  const [mostra, setMostra] = useState(false)

  // Animated slider refs
  const translateX = useRef(new Animated.Value(0)).current
  const containerWidth = useRef(0)
  const tabWidth = useRef(0)

  // PanResponder para permitir arrastar o knob
  // manter valor atual do Animated.Value em uma ref através de listener
  const currentX = useRef(0)
  useEffect(() => {
    const id = translateX.addListener(({ value }) => {
      currentX.current = value
    })
    return () => translateX.removeListener(id)
  }, [translateX])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateX.setOffset(currentX.current)
        translateX.setValue(0)
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx
        const min = 0
        const max = Math.max(tabWidth.current, 0)
        const intended = currentX.current + dx
        const clamped = Math.max(min, Math.min(intended, max))
        // setValue relative ao offset
        translateX.setValue(clamped - (translateX as any)._offset || 0)
      },
      onPanResponderRelease: () => {
        // flatten offset and decidir posição final
        translateX.flattenOffset()
        const threshold = tabWidth.current / 2
        const finalX = currentX.current
        const toRight = finalX > threshold
        Animated.spring(translateX, {
          toValue: toRight ? tabWidth.current : 0,
          useNativeDriver: true,
        }).start(() => setMostra(toRight))
      },
    })
  ).current

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.primaryRed}
        />

        <View style={styles.backButton}>
          <TouchableOpacity
            onPress={() => router.replace("/(login_page)/test" as any)}
          >
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {"Utilize o seu número ou email para redefinir a senha."}
          </Text>
        </View>

        {/* Formulário */}
        <View style={styles.formContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Título */}
            <Text style={styles.mainTitle}>Esqueceu a sua senha?</Text>

            {/* Box Informativo */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Informe o seu email que enviaremos um link para recuperação da
                sua senha
              </Text>
            </View>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Insira o seu email ou número"
                placeholderTextColor={colors.gray}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Botão Continuar */}
            <TouchableOpacity style={styles.continueButton} activeOpacity={0.8}>
              <Text style={styles.continueButtonText}>Continuar</Text>
              <Feather name="arrow-up-right" size={20} color={colors.white} />
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Ao prosseguir, você confirma que leu e aceita os{" "}
                <Text style={styles.footerLink}>Termos de Uso</Text> e a{" "}
                <Text style={styles.footerLink}>Política de Privacidade</Text>.
              </Text>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: "30%",
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    color: colors.white,
    fontFamily: fonts.bold,
    lineHeight: 36,
  },
  loginContainer: {
    width: "100%",
    height: "auto",
    gap: 10,
  },
  formContainer: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  scrollContent: {
    padding: 20
  },
  mainTitle: {
    alignSelf: "center",
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.black,
    marginBottom: 12,
  },
  infoBox: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.gray,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray50,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.black,
    backgroundColor: colors.white,
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: colors.primaryRed,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    width: "88%",
    alignSelf: "center",
    marginTop: 36,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  continueButtonArrow: {
    color: colors.white,
    fontSize: 18,
  },
  footer: {
    paddingHorizontal: 10,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: colors.gray,
    fontFamily: fonts.regular,
    textAlign: "center",
    lineHeight: 16,
  },
  footerLink: {
    fontFamily: fonts.bold,
    color: colors.gray,
  },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: colors.gray10,
    borderRadius: 99,
    padding: 4,
    marginBottom: 10,
  },
  tabTouch: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  knob: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    backgroundColor: colors.white,
    borderRadius: 99,
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
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
  backButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? "10%" : 0,
    paddingBottom: 8,
  },
  container: {
    flex: 1,
    backgroundColor: colors.primaryRed,
  },
  inputContainer: {
    marginBottom: "55%",
    backgroundColor: colors.white,
  },
})

export default LoginScreen
