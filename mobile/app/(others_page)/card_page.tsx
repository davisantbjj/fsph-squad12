import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from "react";
import { Dimensions, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.92;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

export default function CardPage() {
  const router = useRouter();

  // Listas para atualizar os nomes e tipos sanguíneos
  const randomData = useMemo(() => {
    const nomes = [
      "Lucas Andrade",
      "Marcos Vinícius Silva",
      "João Pedro Nascimento",
      "Felipe Moura Santos",
      "Eduardo Almeida",
      "Rafael Campos Dias"
    ];
    const tipos = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    // Data de nascimento aleatória
    const randomDate = () => {
      const d = new Date(
        1990 + Math.floor(Math.random() * 15),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      );
      return d.toLocaleDateString("pt-BR");
    };
    const randomId = () => Math.floor(100000 + Math.random() * 900000).toString();

    // Retorna os dados aleatórios: nome, data de nascimento, inscrição e tipo sanguíneo
    return {
      nome: nomes[Math.floor(Math.random() * nomes.length)],
      nascimento: randomDate(),
      inscricao: randomId(),
      tipo: tipos[Math.floor(Math.random() * tipos.length)],
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Cartão do Doador</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.cardWrapper}>
        <ImageBackground
          source={require("../../assets/images/card_bg.png")}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.rotatedContent}>
            <View style={styles.vContainer}>
              <View style={[styles.vBar, { transform: [{ rotate: "45deg" }] }]} />
              <View style={[styles.vBar, { transform: [{ rotate: "-45deg" }] }]} />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.label}>NOME:</Text>
              <Text style={styles.text}>{randomData.nome}</Text>

              <Text style={[styles.label, { marginTop: 10 }]}>DATA DE NASCIMENTO:</Text>
              <Text style={styles.text}>{randomData.nascimento}</Text>

              <Text style={[styles.label, { marginTop: 10 }]}>Nº DE INSCRIÇÃO:</Text>
              <Text style={styles.text}>{randomData.inscricao}</Text>
            </View>

            <View style={styles.bloodBox}>
              <Text style={[styles.label, { marginBottom: 4 }]}>TIPO SANGUÍNEO:</Text>
              <Text style={styles.blood}>{randomData.tipo}</Text>
            </View>

            <Image
              source={require("../../assets/images/hemose_logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 24,
    position: 'absolute',
    top: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  backBtn: { width: 36 },

  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 36,
    overflow: "hidden",
    marginTop: 60,
  },
  background: {
    width: "100%",
    height: "100%",
  },

  rotatedContent: {
    transform: [{ rotate: "90deg" }],
    width: CARD_HEIGHT, 
    height: CARD_WIDTH,
    position: "absolute",
    top: (CARD_HEIGHT - CARD_WIDTH) / 2,
    left: -(CARD_HEIGHT - CARD_WIDTH) / 2,
  },

  vContainer: {
    position: "absolute",
    top: -5,
    width: "100%",
    height: 140,
    alignItems: "center",
  },
  vBar: {
    position: "absolute",
    width: 210,
    height: 60,
    backgroundColor: "#d52d2f",
    borderRadius: 10,
  },

  infoBox: {
    position: "absolute",
    top: CARD_WIDTH * 0.55,  
    right: CARD_HEIGHT * 0.32,
  },

  label: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  text: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 18,
  },

  bloodBox: {
    position: "absolute",
    right: CARD_HEIGHT * 0.02, 
    bottom: CARD_WIDTH * 0.1, 
    alignItems: 'center',
  },
  blood: {
    color: "#fff",
    fontSize: Math.round(CARD_WIDTH * 0.22),
    fontWeight: "bold",
    lineHeight: Math.round(CARD_WIDTH * 0.22) * 1,
  },

  logo: {
    position: "absolute",
    top: CARD_WIDTH * 0.08,   
    right: CARD_HEIGHT * 0.08,
    width: Math.round(CARD_WIDTH * 0.35),
    height: Math.round(CARD_WIDTH * 0.22),
  },
});