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
  ActivityIndicator
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { shadows } from "./_shadow"
import api from "@/src/services/api"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect } from '@react-navigation/native';

export default function Frame116() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true);
  const [userInfo, setUserInfo] = React.useState<any>(null);
  const [estoque, setEstoque] = React.useState<any[]>([]);
  const [lastEstoqueUpdate, setLastEstoqueUpdate] = React.useState<Date | null>(null);
  const [nextAppointment, setNextAppointment] = React.useState<any>(null);
  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [donationsCount, setDonationsCount] = React.useState<number>(0);
  const [livesSaved, setLivesSaved] = React.useState<number>(0);
  const [userProgress, setUserProgress] = React.useState<number>(0);

  // UseFocusEffect para recarregar dados sempre que a tela ganhar foco (ex: voltar do agendamento)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
        setLoading(true);
        // 1. Carregar dados do usuário
        // Tenta pegar do storage primeiro para ser mais rápido, mas idealmente valida token
        const token = await AsyncStorage.getItem('user_token');
        if (!token) {
          // Quando não houver token, redirecionar para splash para recarregar todo o app
          router.replace('/(login_page)/splash');
          return;
        }

        // Busca perfil
        try {
            // Backend mount: app.use("/api/users", userRoutes); -> Rota: /me
            const profileRes = await api.get('/api/users/me');
            setUserInfo(profileRes.data);
        } catch (e) {
            console.log("Erro ao carregar perfil", e);
        }

        // 2. Carregar Estoque
        try {
          // Backend mount: app.use("/api/estoque", estoqueRoutes);
          const estoqueRes = await api.get('/api/estoque');
          setEstoque(estoqueRes.data || []);
          // marca o horário da última atualização localmente
          setLastEstoqueUpdate(new Date());
        } catch (e) {
          console.log("Erro ao carregar estoque", e);
        }

        // 3. Carregar Agendamentos (pegar o próximo)
        try {
            // Backend mount: app.use("/api/appointments", appointmentsRoutes);
            const apptRes = await api.get('/api/appointments');
          // Filtra apenas agendamentos futuros ou pendentes
          const tryParseDate = (val: any) => {
            if (!val) return null;
            // If already a Date or number
            if (val instanceof Date) return val;
            const asString = String(val);
            let d = new Date(asString);
            if (!isNaN(d.getTime())) return d;
            // Try replacing space with 'T' (common MySQL -> JS issue)
            d = new Date(asString.replace(' ', 'T'));
            if (!isNaN(d.getTime())) return d;
            // Try appending seconds
            d = new Date(asString.replace(' ', 'T') + ':00');
            if (!isNaN(d.getTime())) return d;
            return null;
          };

          const futureAppts = apptRes.data.filter((a: any) => {
            const parsed = tryParseDate(a.data_agendamento);
            return parsed && parsed.getTime() > Date.now() && a.status_agendamento !== 'Cancelado';
          });
            // Ordena e pega o primeiro
            if (futureAppts.length > 0) {
                // Supondo que o back já retorna ordenado, mas garantindo
                futureAppts.sort((a: any, b: any) => new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime());

                const next = futureAppts[0];
                const dateObj = tryParseDate(next.data_agendamento) || new Date(next.data_agendamento);
                // Formata data e hora simples
                setNextAppointment({
                    local: next.local_agendamento,
                    data: dateObj.toLocaleDateString('pt-BR'),
                    hora: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                });
            } else {
                setNextAppointment(null);
            }
        } catch (e) {
             console.log("Erro ao carregar agendamentos", e);
        }

        // 4. Carregar Campanhas
        try {
             // Backend mount: app.use("/api/campaigns", campaignsRoutes);
             const campaignsRes = await api.get('/api/campaigns');
             setCampaigns(campaignsRes.data || []);
        } catch (e) {
             console.log("Erro ao carregar campanhas", e);
        }

        // 5. Carregar Histórico do usuário para calcular estatísticas (remover dados mockados)
        try {
          const historyRes = await api.get('/api/history');
          const historyData = historyRes.data || [];
          const donations = historyData.filter((h: any) => h.origin === 'donation' || h.type === 'Doação Realizada');
          const donationsNumber = donations.length;
          // Estimativa simples: cada doação pode salvar ~3 vidas (ajustável se backend fornecer outra métrica)
          const estimatedLives = donationsNumber * 3;
          setDonationsCount(donationsNumber);
          setLivesSaved(estimatedLives);
          // Try to compute a user progress percent based on ranking top value
          try {
            const rankingRes = await api.get('/api/ranking');
            const ranking = rankingRes.data || [];
            const max = ranking.length > 0 ? (ranking[0].total_doacoes || ranking[0].total_doacoes === 0 ? Number(ranking[0].total_doacoes) : (ranking[0].total_doacoes ?? 0)) : 0;
            const userTotal = donationsNumber;
            const percent = max > 0 ? Math.round((userTotal / max) * 100) : 0;
            setUserProgress(percent);
          } catch (e) {
            // ignore ranking errors, keep default
            console.log('Erro ao carregar ranking para progresso do usuário', e);
          }
        } catch (e) {
          console.log('Erro ao carregar histórico para stats', e);
        }

    } catch (error) {
        console.error("Erro geral no loadData:", error);
    } finally {
        setLoading(false);
    }
  };

  const Line = () => {
    return <View style={styles.line} />
  }

  // Mapeamento de níveis de alerta para texto e cor (simplificado)
  const normalize = (s?: string) => {
    if (!s) return '';
    try {
      return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
    } catch (e) {
      // fallback for environments without Unicode property escapes
      return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }
  };

  const getAlertLevel = (situacao?: string) => {
      const key = normalize(situacao);
      switch(key) {
          case 'critico':
          case 'critico': return { text: 'Crítico', color: '#D32F2F' }; // Vermelho
          case 'alerta': return { text: 'Alerta', color: '#F57C00' };   // Laranja
          case 'estavel':
          case 'estavel': return { text: 'Estável', color: '#388E3C' }; // Verde
          default: return { text: situacao || '---', color: '#999' };
      }
  };

  if (loading && !userInfo) {
      return (
          <View style={[styles.parent, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color="#D32F2F" />
          </View>
      )
  }
  const isStatus = false;

  return (
    <SafeAreaView style={styles.parent}>
      <StatusBar barStyle="dark-content" />
      {/* Profile header: foto e nome do usuário */}
      <View style={styles.profileContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace("/(home_page)/profile_page" as any)}
          style={styles.profileLink}
        >
          {userInfo?.foto_perfil ? (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                overflow: "hidden",
              }}
            >
              {/* Aqui você usaria <Image source={{ uri: userInfo.foto_perfil }} ... /> */}
              <FontAwesome name="user-circle" size={48} color="#d32f2f" />
            </View>
          ) : (
            <FontAwesome
              name="user-circle"
              size={48}
              color="#d32f2f"
              style={styles.profileImage}
            />
          )}
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <ThemedText style={styles.profileGreeting}>Olá,</ThemedText>
          <ThemedText style={styles.profileName}>
            {userInfo?.nome_completo || "Doador"}
          </ThemedText>
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

          {/* Carousel de Estoque (horizontal) */}
          <View style={[styles.frameGroup, styles.viewFlexBox]}>
            {estoque.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContent}
              >
                {estoque.map((item, index) => {
                  const alert = getAlertLevel(item.situacao)
                  // Ajustar fator RH: backend usa 'P'/'N' — mostrar '+' e '-'
                  let rhSymbol = item.fatorrh
                  if (typeof rhSymbol === "string") {
                    if (rhSymbol.toUpperCase() === "P") rhSymbol = "+"
                    else if (rhSymbol.toUpperCase() === "N") rhSymbol = "-"
                  }
                  return (
                    <View
                      key={index}
                      style={[styles.frameBorder, styles.carouselItem]}
                    >
                      <View style={[styles.vectorParent, styles.vectorFlexBox]}>
                        <FontAwesome6 name="droplet" size={24} color="white" />
                        <Text style={[styles.a, styles.aFlexBox]}>
                          {item.grupoabo}
                          {rhSymbol}
                        </Text>
                      </View>
                      <Line />
                      <View
                        style={[styles.alertaWrapper, styles.wrapperBorder]}
                      >
                        <Text style={[styles.alertaTypo, { color: "#FFF" }]}>
                          {alert.text}
                        </Text>
                      </View>
                    </View>
                  )
                })}
              </ScrollView>
            ) : (
              <Text style={{ color: "white" }}>Carregando estoque...</Text>
            )}
          </View>
        </View>

        {/* Última atualização do estoque (apenas data/hora pequena e clara, sem caixa) */}
        <View style={[styles.updateContainer]}>
          <Text style={styles.updateSmallText}>
            Última atualização do estoque:{" "}
            {lastEstoqueUpdate
              ? `${lastEstoqueUpdate.toLocaleDateString(
                  "pt-BR"
                )} — ${lastEstoqueUpdate.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "—"}
          </Text>
        </View>

        {/* Agendamentos */}
        {isStatus ? (
          <View style={styles.scheduleContainer}>
            <View style={[styles.card, shadows.md, styles.appointmentCard]}>
              <Text style={styles.cardTitle}>Seu próximo agendamento</Text>
              <Text style={styles.appointmentDate}>
                Sexta-feira, 3 de Outubro
              </Text>
              <Text style={styles.appointmentTime}>às 10:30</Text>
              <View style={styles.appointmentLocationRow}>
                <Ionicons name="location-outline" size={16} color="#999" />
                <Text style={styles.appointmentLocationText}>
                  Hemocentro de Sergipe
                </Text>
              </View>

              <View style={styles.appointmentActions}>
                <TouchableOpacity
                  style={[styles.outlineButton, { marginRight: 8 }]}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push("/(others_page)/history_page" as any)
                  }
                >
                  <Text style={styles.outlineButtonText}>Ver detalhes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.outlineButton}
                  activeOpacity={0.9}
                  onPress={() =>
                    Alert.alert(
                      "Remarcar/Cancelar",
                      "Implementar fluxo de remarcar ou cancelar."
                    )
                  }
                >
                  <Text style={styles.outlineButtonText}>
                    Remarcar / Cancelar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.scheduleContainer}>
            <View style={[styles.card, shadows.md]}>
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
        )}

        {/* Seu Impacto */}
        <View style={styles.impactContainer}>
          <Text style={styles.impactHeader}>Seu Impacto</Text>
          <ScrollView
            horizontal
            nestedScrollEnabled={true}
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
                    {/* Estatísticas carregadas do histórico */}
                    <Text style={styles.statNumber}>{donationsCount}</Text>
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
                      <Text style={styles.statNumber}>{livesSaved}</Text>
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
                      marginRight: 10,
                    }}
                  >
                    <Ionicons name="trophy-outline" size={30} color="#b71c1c" />
                  </View>
                  <View>
                    <View style={{ width: "100%" }}>
                      {/* <Text style={styles.statSmallTitle}>Vamos lá!</Text> */}
                      <Text style={styles.statSmallSubtitle}>
                        Vamos lá!{"\n"}
                        Seja uma{" "}
                        <Text style={{ fontWeight: "700" }}>heroína</Text>
                        {"\n"}E salve mais uma vida.
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${userProgress}%` },
                        ]}
                      />
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

        {/* Campanhas */}
        <View style={styles.impactContainer}>
          <Text style={styles.impactHeader}>Campanhas</Text>
          <Text style={styles.campaignsSubtitle}>
            Essas pessoas estão precisando de você!
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.campaignsScroll}
            contentContainerStyle={styles.campaignsContent}
          >
            {campaigns.length > 0 ? (
              campaigns.map((campaign, index) => (
                <View key={index} style={styles.campaignCard}>
                  <View style={styles.campaignHeader}>
                    <View style={styles.campaignUser}>
                      <Text style={styles.campaignName} numberOfLines={1}>
                        {campaign.nome_campanha}
                      </Text>
                    </View>
                    <View style={styles.campaignBadge}>
                      <Text style={styles.campaignBadgeText}>Urgente</Text>
                    </View>
                  </View>

                  <Text style={styles.campaignDonors} numberOfLines={2}>
                    {campaign.descricao}
                  </Text>

                  <Text style={styles.campaignLabel}>
                    {campaign.local_campanha}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ paddingHorizontal: 20 }}>
                Nenhuma campanha ativa no momento.
              </Text>
            )}
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
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderStyle: "solid",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 6,
  },
  frameBorder: {
    minWidth: 60,
    height: "94%",
    alignItems: "center",
    backgroundColor: "#d32f2f",
    borderRadius: 10,
    borderColor: "rgba(218, 218, 218, 0.3)",
    borderWidth: 1,
    borderStyle: "solid",
    overflow: "hidden",
    marginRight: 12,
    paddingVertical: 8,
  },
  alertaTypo: {
    textAlign: "center",
    fontSize: 10, // reduzido para caber
    color: "#fff",
    fontFamily: "Roboto-Bold",
    fontWeight: "700",
    textTransform: "uppercase",
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
    gap: 5,
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    overflow: "hidden",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-start", // alinhamento sem espaçamento entre itens
    paddingHorizontal: 5,
  },
  carouselContent: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  carouselItem: {
    width: 76,
    marginHorizontal: 6,
  },
  vectorParent: {
    height: 54,
    width: "100%", // ajustado
  },
  vectorIcon: {
    width: 17,
    height: 21,
    color: "#fff",
  },
  a: {
    fontSize: 18, // reduzido levemente
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
  updateContainer: {
    width: "90%",
    height: 16,
    alignSelf: "center",
    borderBottomEndRadius: 4,
    borderBottomStartRadius: 4,
  },
  updateSmallText: {
    fontSize: 12,
    color: "#9b9b9b",
    textAlign: "right",
    width: "100%",
    paddingLeft: 8,
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
    flex: 1,
  },
  statCard: {
    flexBasis: "48%",
    height: 140,
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
    width: "auto",
    height: "60%",
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
    width: "auto",
    alignItems: "center",
    marginBottom: 8,
    height: "auto",
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

  campaignsSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    fontFamily: "Roboto-Regular",
    padding: 4,
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
    height: 200,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#d32f2f",
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
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
    fontFamily: "Roboto",
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
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
  },
  campaignLabel: {
    fontSize: 11,
    fontFamily: "Roboto",
    color: "#999",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  appointmentCard: {
    padding: 16,
  },
  appointmentSmallTitle: {
    fontSize: 14,
  },
  appointmentDate: {
    fontSize: 18,
    fontWeight: "700",
  },
  appointmentTime: {
    fontSize: 16,
    color: "#555",
  },
  appointmentLocationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  appointmentLocationText: {
    fontSize: 14,
    color: "#999",
    marginLeft: 4,
  },
  appointmentActions: {
    flexDirection: "row",
    marginTop: 12,
  },
  outlineButton: {
    flex: 1,
    width: "100%",
    borderWidth: 1.3,
    borderColor: "#d32f2f",
    borderRadius: 30,
    paddingVertical: 5,
    paddingBottom: 6,
    alignItems: "center",
  },
  outlineButtonText: {
    color: "#d32f2f",
    fontFamily: "Roboto-Bold",
    fontSize: 14,
  },
})
