import { ThemedText } from "@/components/ThemedText"
import {
  EvilIcons,
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  Ionicons,
} from "@expo/vector-icons"
import { useRouter } from "expo-router"
import * as React from "react"
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { shadows } from "./_shadow"

export default function Frame116() {
  const router = useRouter()
  const [local, setLocal] = React.useState("")
  const [data, setData] = React.useState("")
  const [hora, setHora] = React.useState("")
  const [nextAppointment, setNextAppointment] = React.useState<null | {
    local: string
    data: string
    hora: string
  }>(null)
  const [showForm, setShowForm] = React.useState(false)

  const handleSchedule = () => {
    if (!local.trim() || !data.trim() || !hora.trim()) {
      Alert.alert(
        "Preencha todos os campos",
        "Por favor informe local, data e hora para o agendamento."
      )
      return
    }

    setNextAppointment({ local, data, hora })
    Alert.alert(
      "Agendamento confirmado",
      `Local: ${local}\nData: ${data}\nHora: ${hora}`
    )
    // limpar campos e fechar formulário
    setLocal("")
    setData("")
    setHora("")
    setShowForm(false)
  }

  const Line = () => {
    return <View style={styles.line} />
  }

  const campaigns = [
    {
      name: "João Santos",
      donors: "3/10",
      bloodTypes: ["A+", "A-", "O+", "O-"],
    },
    { name: "Sofia", donors: "45/50", bloodTypes: ["A-", "B-", "AB-", "O-"] },
    { name: "Simone", donors: "15/30", bloodTypes: [] },
  ]
  return (
    <SafeAreaView style={styles.parent}>
      <StatusBar barStyle="dark-content" />
      {/* Profile header: foto e nome do usuário */}
      <View style={styles.profileContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/profile" as any)}
          style={styles.profileLink}
        >
          {/* substituir require por imagem do usuário se disponível */}
          <FontAwesome
            name="user-circle"
            size={48}
            color="#d32f2f"
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <ThemedText style={styles.profileGreeting}>Olá,</ThemedText>
          <ThemedText style={styles.profileName}>Usuário</ThemedText>
        </View>
      </View>

      {/* Estoque de sangue */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.frameParent, shadows.xl]}>
          <View style={styles.vidasHumanasPrecisamDeVocWrapper}>
            <Text style={[styles.vidasHumanasPrecisam, styles.aFlexBox]}>
              Vidas humanas precisam de você!
            </Text>
          </View>
          <View style={[styles.frameGroup, styles.viewFlexBox]}>
            <View style={styles.frameBorder}>
              <View style={[styles.vectorParent, styles.vectorFlexBox]}>
                <FontAwesome6 name="droplet" size={24} color="white" />
                <Text style={[styles.a, styles.aFlexBox]}>A-</Text>
              </View>
              <Line />
              <View style={[styles.alertaWrapper, styles.wrapperBorder]}>
                <Text style={styles.alertaTypo}>Alerta</Text>
              </View>
            </View>
            <View style={styles.frameBorder}>
              <View style={[styles.vectorParent, styles.vectorFlexBox]}>
                <FontAwesome6 name="droplet" size={24} color="white" />
                <Text style={[styles.a, styles.aFlexBox]}>B+</Text>
              </View>
              <Line />
              <View style={[styles.alertaWrapper, styles.wrapperBorder]}>
                <Text style={styles.alertaTypo}>Crítico</Text>
              </View>
            </View>
            <View style={[styles.frameParent2, styles.frameBorder]}>
              <View style={[styles.vectorContainer, styles.vectorFlexBox]}>
                <FontAwesome6 name="droplet" size={24} color="white" />
                <Text style={[styles.a, styles.aFlexBox]}>AB+</Text>
              </View>
              <Line />
              <View style={[styles.emergnciaWrapper, styles.wrapperBorder]}>
                <Text style={[styles.emergncia, styles.alertaTypo]}>
                  Emergência
                </Text>
              </View>
            </View>
            <View style={styles.frameBorder}>
              <View style={[styles.vectorParent, styles.vectorFlexBox]}>
                <FontAwesome6 name="droplet" size={24} color="white" />
                <Text style={[styles.a, styles.aFlexBox]}>B-</Text>
              </View>
              <Line />
              <View style={[styles.alertaWrapper, styles.wrapperBorder]}>
                <Text style={styles.alertaTypo}>Alerta</Text>
              </View>
            </View>
            <View style={styles.frameBorder}>
              <View style={[styles.vectorParent, styles.vectorFlexBox]}>
                <FontAwesome6 name="droplet" size={24} color="white" />
                <Text style={[styles.a, styles.aFlexBox]}>O-</Text>
              </View>
              <Line />
              <View style={[styles.alertaWrapper, styles.wrapperBorder]}>
                <Text style={styles.alertaTypo}>Alerta</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Agendamentos */}
        <View style={styles.scheduleContainer}>
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>Seu próximo agendamento</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardText}>
                {nextAppointment
                  ? `${nextAppointment.local} — ${nextAppointment.data} às ${nextAppointment.hora}`
                  : "Sem agendamentos próximos"}
              </Text>
              <TouchableOpacity
                style={styles.cardButton}
                onPress={() => {
                  console.log("navegando para scheduling")
                  router.push("/(others_page)/scheduling" as any)
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.cardButtonText}>Agendar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Seu Impacto */}
        <View style={styles.impactContainer}>
          <Text style={styles.impactHeader}>Seu Impacto</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.impactScroll}
          >
            <View style={styles.impactCardWrapper}>
              <TouchableOpacity
                style={[styles.statCard, shadows.md]}
                activeOpacity={0.9}
                onPress={() =>
                  router.push("/(others_page)/history_page" as any)
                }
              >
                <View style={styles.statTopRowSmall}>
                  <View style={{ alignItems: "center", marginLeft: 10 }}>
                    <Text style={styles.statNumber}>2</Text>
                    <Text style={styles.statSeparator}>Doações</Text>
                  </View>
                  <View style={{ alignItems: "center", marginLeft: 10 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <FontAwesome5
                        name="heartbeat"
                        size={22}
                        color="#d32f2f"
                      />
                      <Text style={styles.statNumber}>8</Text>
                    </View>
                    <Text style={styles.statSeparator}>Vidas salvas</Text>
                  </View>
                </View>
                <View style={styles.statFooterSmall}>
                  <Text style={styles.statAction}>Acessar histórico</Text>
                  <EvilIcons name="chevron-right" size={30} color="#cfcfcf" />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.impactCardWrapper}>
              <TouchableOpacity
                style={[styles.statCard, shadows.md]}
                activeOpacity={0.9}
                onPress={() => router.push("/(home_page)/ranking_page" as any)}
              >
                <View style={styles.statTopRow}>
                  <View
                    style={{
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="trophy-outline" size={30} color="#b71c1c" />
                  </View>
                  <View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.statSmallTitle}>Vamos lá!</Text>
                      <Text style={styles.statSmallSubtitle}>
                        Seja uma{" "}
                        <Text style={{ fontWeight: "700" }}>heroína</Text>
                        {"\n"}E salve mais uma vida.
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={styles.progressFill} />
                    </View>
                  </View>
                </View>
                <View style={styles.statFooterSmall}>
                  <Text style={styles.statAction}>Ranking</Text>
                  <EvilIcons name="chevron-right" size={30} color="#cfcfcf" />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Campanhas (comentado) */}
        <View style={styles.campaignsContainer}>
          <Text style={styles.sectionTitle}>Campanhas</Text>
          <Text style={styles.campaignsSubtitle}>
            Essas pessoas estão precisando de você!
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.campaignsScroll}
            contentContainerStyle={styles.campaignsContent}
          >
            {campaigns.map((campaign, index) => (
              <View key={index} style={styles.campaignCard}>
                <View style={styles.campaignHeader}>
                  <View style={styles.campaignUser}>
                    <Text style={styles.campaignName}>{campaign.name}</Text>
                  </View>
                  <View style={styles.campaignBadge}>
                    <Text style={styles.campaignBadgeText}>Doadores</Text>
                  </View>
                </View>

                <Text style={styles.campaignDonors}>{campaign.donors}</Text>

                {campaign.bloodTypes.length > 0 && (
                  <View style={styles.campaignBloodTypes}>
                    {campaign.bloodTypes.map((type, idx) => (
                      <View key={idx} style={styles.campaignBloodType}>
                        <Text style={styles.campaignBloodTypeText}>{type}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.campaignLabel}>Tipo</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  parent: {
    flex: 1,
    backgroundColor: "#ffff",
  },
  line: {
    borderBlockColor: "#ccc",
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 0.4,
  },
  viewFlexBox: {
    justifyContent: "center",
    alignItems: "center",
  },
  aFlexBox: {
    textAlign: "left",
    color: "#fff",
  },
  vectorFlexBox: {
    gap: 2,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    overflow: "hidden",
  },
  wrapperBorder: {
    height: "auto",
    padding: 3,
    borderStyle: "solid",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  frameBorder: {
    height: "90%",
    borderRadius: 12,
    borderColor: "rgba(218, 218, 218, 0.3)",
    borderWidth: 1,
    borderStyle: "solid",
    overflow: "hidden",
  },
  alertaTypo: {
    textAlign: "center",
    fontSize: 14,
    color: "#fff",
    fontFamily: "Roboto-Bold",
    fontWeight: "700",
  },
  view: {
    width: "100%",
    height: 12,
    flexDirection: "column",
    overflow: "hidden",
    //alignItems: "center",
    flex: 1,
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContentContainer: {
    paddingBottom: 24,
    paddingTop: 8,
    alignItems: "center",
  },
  frameParent: {
    width: "90%",
    borderRadius: 10,
    backgroundColor: "#d32f2f",
    height: 125,
    borderWidth: 1,
    borderColor: "rgba(218, 218, 218, 0.17)",
    borderStyle: "solid",
    alignItems: "center",
    overflow: "hidden",
    alignSelf: "center",
    marginVertical: 8,
  },
  vidasHumanasPrecisamDeVocWrapper: {
    width: "100%",
    padding: 3,
    borderStyle: "solid",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  vidasHumanasPrecisam: {
    fontSize: 15,
    fontFamily: "Roboto-Bold",
    fontWeight: "700",
    textAlign: "left",
  },
  frameGroup: {
    gap: 10,
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    overflow: "hidden",
    alignItems: "center",
    flex: 1,
  },
  vectorParent: {
    height: 54,
    width: 57,
  },
  vectorIcon: {
    width: 17,
    height: 21,
    color: "#fff",
  },
  a: {
    fontSize: 24,
    fontFamily: "Roboto-Regular",
  },
  alertaWrapper: {
    height: "auto",
    width: "auto",
  },
  frameParent2: {
    width: "auto",
  },
  vectorContainer: {
    alignSelf: "stretch",
    flex: 1,
  },
  emergnciaWrapper: {
    height: 21,
    alignSelf: "stretch",
  },
  emergncia: {
    display: "flex",
    width: 77,
    justifyContent: "center",
    alignItems: "center",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e6e6e6",
    gap: 12,
  },
  profileLink: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    // se trocar por <Image />, ajustar width/height
    width: 48,
    height: 48,
  },
  profileInfo: {
    justifyContent: "center",
  },
  profileGreeting: {
    fontSize: 12,
    color: "#666",
    fontFamily: "Roboto-Regular",
  },
  profileName: {
    fontSize: 16,
    fontFamily: "Roboto-Bold",
    color: "#111",
  },
  scheduleContainer: {
    marginTop: 16,
    width: "90%",
    alignSelf: "center",
  },
  scheduleTitle: {
    fontSize: 16,
    fontFamily: "Roboto-Bold",
    marginBottom: 8,
    color: "#111",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontFamily: "Roboto-Regular",
  },
  scheduleButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  scheduleButtonText: {
    color: "#fff",
    fontFamily: "Roboto-Bold",
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 14,
    color: "#9b9b9b",
    fontFamily: "Roboto-Bold",
    marginBottom: 8,
    paddingLeft: 4,
  },
  cardTitleContainer: {
    width: "100%",
    paddingBottom: 5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    // leve sombra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContent: {
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  cardText: {
    fontSize: 20,
    color: "#111",
    fontFamily: "Roboto-Regular",
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  cardButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    alignSelf: "flex-end",
  },
  cardButtonText: {
    color: "#fff",
    fontFamily: "Roboto-Bold",
    fontSize: 16,
  },
  formWrap: {
    marginTop: 12,
  },
  /* Seu Impacto */
  impactContainer: {
    width: "90%",
    alignSelf: "center",
    marginTop: 25,
  },
  impactHeader: {
    fontSize: 16,
    color: "#8c8c8c",
    fontFamily: "Roboto-Bold",
    marginBottom: 12,
  },
  impactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
  },
  impactScroll: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "flex-start",
  },
  impactCardWrapper: {
    marginRight: 12,
  },
  statCard: {
    //flexBasis: "48%",
    minWidth: 140,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statTopRowSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    color: "#B71c1c",
    fontFamily: "Roboto-Bold",
  },
  statSeparator: {
    fontSize: 12,
    color: "#B71c1c",
    marginLeft: 6,
    marginRight: 6,
  },
  statFooterSmall: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 8,
  },
  statAction: {
    color: "#9b9b9b",
    fontFamily: "Roboto-Regular",
  },
  statChevron: {
    color: "#cfcfcf",
    fontSize: 18,
  },
  statTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statSmallTitle: {
    fontSize: 14,
    color: "#777",
    fontFamily: "Roboto-Bold",
  },
  statSmallSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: 8,
  },
  progressFill: {
    width: "60%",
    height: "100%",
    backgroundColor: "#d32f2f",
  },
  campaignsContainer: {
    marginTop: "auto",
    paddingHorizontal: "4%",
    marginBottom: "auto",
  },
  campaignsSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  campaignsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  campaignsContent: {
    gap: 16,
    paddingRight: 20,
  },
  campaignCard: {
    width: 160,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  campaignHeader: {
    marginBottom: 12,
  },
  campaignUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  campaignAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  campaignName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  campaignBadge: {
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  campaignBadgeText: {
    fontSize: 8,
    color: "#DC2626",
    fontWeight: "600",
  },
  campaignDonors: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  campaignBloodTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },
  campaignBloodType: {
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  campaignBloodTypeText: {
    fontSize: 10,
    color: "#DC2626",
    fontWeight: "600",
  },
  campaignLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
})
