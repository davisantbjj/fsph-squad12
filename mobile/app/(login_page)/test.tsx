import { Stack } from "expo-router"
import React, { useEffect, useRef, useState } from "react"
import {
  Animated,
  ImageSourcePropType,
  LayoutChangeEvent,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import Cadastro from "./cadastro"
import Login from "./login"

// Paleta de Cores
const colors = {
  primaryRed: "#D32F2F",
  black: "#1E1E1E",
  gray: "#8C8C8C",
  gray50: "#DADADA",
  gray10: "#F2F2F2",
  white: "#FFFFFF",
}

// Fontes
const fonts = {
  regular: "Roboto-Regular",
  bold: "Roboto-Bold",
}

// Assets
const googleLogo: ImageSourcePropType = require("../../assets/images/google-logo.png")
const facebookLogo: ImageSourcePropType = require("../../assets/images/facebook-logo.png")

const LoginScreen = () => {
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
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryRed} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {"Você carrega\ndentro de si o poder\nde salvar vidas."}
        </Text>
      </View>

      {/* Formulário de Login */}
      <View style={styles.formContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View
            style={styles.tabSelector}
            onLayout={(e: LayoutChangeEvent) => {
              const w = e.nativeEvent.layout.width
              containerWidth.current = w
              tabWidth.current = w / 2
              // posicionar acordo com estado inicial
              Animated.timing(translateX, {
                toValue: mostra ? tabWidth.current : 0,
                duration: 0,
                useNativeDriver: true,
              }).start()
            }}
          >
            {/* track labels */}
            <TouchableOpacity
              style={styles.tabTouch}
              activeOpacity={0.8}
              onPress={() => {
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: true,
                }).start()
                setMostra(false)
              }}
            >
              <Text
                style={mostra ? styles.tabTextInactive : styles.tabTextActive}
              >
                Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabTouch}
              activeOpacity={0.8}
              onPress={() => {
                Animated.spring(translateX, {
                  toValue: tabWidth.current,
                  useNativeDriver: true,
                }).start()
                setMostra(true)
              }}
            >
              <Text
                style={mostra ? styles.tabTextActive : styles.tabTextInactive}
              >
                Cadastro
              </Text>
            </TouchableOpacity>

            {/* knob animado */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.knob,
                {
                  width: tabWidth.current - 8,
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>
          {mostra ? <Cadastro /> : <Login />}
        </ScrollView>
      </View>
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
    paddingTop: "45%",
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    color: colors.white,
    fontFamily: fonts.regular,
    lineHeight: 31,
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
    padding: 20,
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
})

export default LoginScreen
