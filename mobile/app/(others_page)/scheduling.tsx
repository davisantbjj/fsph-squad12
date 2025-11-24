import { EvilIcons, Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import * as React from "react"
import { useState } from "react"
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  Alert,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import api from "@/src/services/api";

// Habilita animação de layout no Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export default function SchedulingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true)
  const [selected, setSelected] = useState<string | null>(null) // Tipo de agendamento
  const [openPre, setOpenPre] = useState(false)

  // Respostas da pré-triagem
  const [selectedPreAnswers, setSelectedPreAnswers] = useState<
    Record<string, string | null>
  >({})
  const hasPreAnswers = Object.values(selectedPreAnswers).length >= 4; // Valida se respondeu as 4 perguntas

  const [openDados, setOpenDados] = useState(false)
  const [openLocal, setOpenLocal] = useState(false)
  const [openDataHora, setOpenDataHora] = useState(false)
  const [openVerif, setOpenVerif] = useState(false)

  // Dados do doador
  const [cpf, setCpf] = useState<string>("")
  const [nome, setNome] = useState<string>("")
  const [dataNascimento, setDataNascimento] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [telefone, setTelefone] = useState<string>("")

  // Carregar perfil do usuário para preencher dados do doador automaticamente
  React.useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const res = await api.get('/api/users/me');
        const u = res.data || {};
        if (!mounted) return;
        // Formatar CPF para máscara 000.000.000-00
        if (u.cpf) setCpf(formatCPF(String(u.cpf)));
        if (u.nome_completo) setNome(u.nome_completo);
        if (u.email) setEmail(u.email);
        if (u.telefone) setTelefone(formatNumber(String(u.telefone)));
        if (u.data_nascimento) {
          // backend geralmente retorna YYYY-MM-DD
          const d = new Date(u.data_nascimento);
          if (!isNaN(d.getTime())) {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            setDataNascimento(`${dd}/${mm}/${yyyy}`);
          } else {
            // fallback: raw string
            setDataNascimento(String(u.data_nascimento));
          }
        }
      } catch (error) {
        console.log('Não foi possível carregar perfil para auto-fill do agendamento', error);
      }
    }

    loadProfile();
    return () => { mounted = false }
  }, [])

  // Local de Doação
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedLocal, setSelectedLocal] = useState<string | null>(null)
  const [showCityList, setShowCityList] = useState(false)
  const [showLocalList, setShowLocalList] = useState(false)

  // Data e Hora
  // Em um app real, usaria um DatePicker
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Formatação de data/time local (mascara)
  const formatDateInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0,8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0,2)}/${digits.slice(2)}`;
    return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
  }

  const handleDateChange = (text: string) => {
    setDate(formatDateInput(text));
  }

  const formatTimeInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0,4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0,2)}:${digits.slice(2)}`;
  }

  const handleTimeChange = (text: string) => {
    setTime(formatTimeInput(text));
  }

  const cities = ["Aracaju"]
  const locationsByCity: Record<string, string[]> = {
    Aracaju: ["HEMOSE", "Shopping Jardins (Campanha)", "Shopping Riomar (Campanha)"],
  }

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setOpen((s) => !s)
  }

  // Avança para o próximo card do fluxo
  const goToNext = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    if (open) {
        if (!selected) { Alert.alert("Selecione um tipo de agendamento"); return; }
        setOpen(false)
        setOpenPre(true)
        return
    }
    if (openPre) {
        if (!hasPreAnswers) { Alert.alert("Responda todas as perguntas da pré-triagem"); return; }
        setOpenPre(false)
        setOpenDados(true)
        return
    }
    if (openDados) {
        if(!cpf || !nome || !email) { Alert.alert("Preencha os dados obrigatórios"); return; }
        setOpenDados(false)
        setOpenLocal(true)
        return
    }
    if (openLocal) {
        if(!selectedLocal) { Alert.alert("Selecione um local"); return; }
        setOpenLocal(false)
        setOpenDataHora(true)
        return
    }
    if (openDataHora) {
        // Validação simples de data/hora manual
        if (!date || !time) { Alert.alert("Informe data e hora"); return; }
        setOpenDataHora(false)
        setOpenVerif(true)
        return
    }
    // Se estiver no último passo, submeter
    if (openVerif) {
      submitAppointment();
    }
  }

  const submitAppointment = async () => {
      try {
          setLoading(true);
          // Monta data ISO aproximada (YYYY-MM-DD HH:mm:ss)
          // date espera formato DD/MM/YYYY
          const [day, month, year] = date.split('/');
          const formattedDate = `${year}-${month}-${day} ${time}:00`;

            // Incluir info do doador no payload (opcional) para rastreabilidade
            const donorCpfClean = cpf ? cpf.replace(/\D/g, '') : null;
            const donorTelefoneClean = telefone ? telefone.replace(/\D/g, '') : null;

            const payload = {
              data_agendamento: formattedDate,
              tipo_agendamento: selected,
              local_agendamento: selectedLocal,
              cidade: selectedCity,
              pre_triagem: {
                perguntas_respostas: selectedPreAnswers
              },
              donor_info: {
                nome_completo: nome,
                cpf: donorCpfClean,
                telefone: donorTelefoneClean,
                email,
                data_nascimento: dataNascimento && dataNascimento.includes('/') ?
                // converter dd/mm/yyyy para YYYY-MM-DD
                (() => {
                  const [dd, mm, yyyy] = dataNascimento.split('/');
                  return `${yyyy}-${mm}-${dd}`;
                })() : dataNascimento
              }
            };

          await api.post('/api/appointments', payload);

          Alert.alert("Sucesso", "Agendamento realizado com sucesso!", [
              { text: "OK", onPress: () => router.replace('/(home_page)/home_page') }
          ]);

      } catch (error) {
          console.error("Erro ao agendar:", error);
          Alert.alert("Erro", "Não foi possível realizar o agendamento. Verifique os dados e tente novamente.");
      } finally {
          setLoading(false);
      }
  }

  // Formata CPF enquanto o usuário digita: 000.000.000-00
  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
      6,
      9
    )}-${digits.slice(9)}`
  }

  const handleCpfChange = (text: string) => {
    setCpf(formatCPF(text))
  }

  const formatNascimento = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  }

  const handleNascimentoChange = (text: string) => {
    setDataNascimento(formatNascimento(text))
  }

  const formatNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 2) return `(${digits}`
    if (digits.length <= 5) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const handlePhoneChange = (text: string) => {
    setTelefone(formatNumber(text))
  }

  const options = [
    { id: "individual", label: "Doação de Sangue Individual" },
    { id: "campaign", label: "Campanha de Doação de Sangue" },
    { id: "boneMarrow", label: "Cadastro de Medula Óssea" },
  ]

  const options_two = [
    { id: "yes", label: "Sim" },
    { id: "no", label: "Não" },
  ]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(home_page)/home_page")}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color="#d32f2f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendamento Doação</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}>
        <View style={[styles.page]}>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={toggleOpen}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>Tipo de agendamento</Text>
              <EvilIcons
                name={open ? "chevron-up" : "chevron-down"}
                size={35}
                color="#bdbdbd"
              />
            </TouchableOpacity>

            {open && (
              <View style={styles.cardBody}>
                <Text style={styles.instruction}>
                  Selecione o tipo de agendamento
                </Text>
                {options.map((opt) => {
                  const active = selected === opt.id
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={styles.optionRow}
                      onPress={() => setSelected(opt.id)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[styles.radio, active && styles.radioActive]}
                      >
                        {active && <View style={styles.radioDot} />}
                      </View>
                      <Text
                        style={[
                          styles.optionLabel,
                          active && styles.optionLabelActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>

          {/* Pré-Triagem */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut
                )
                setOpenPre((s) => !s)
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>Pré-Triagem</Text>
              <EvilIcons
                name={openPre ? "chevron-up" : "chevron-down"}
                size={28}
                color="#bdbdbd"
              />
            </TouchableOpacity>
            {openPre && (
              <View style={styles.cardBody}>
                {(
                  [
                    { id: "primeira", label: "Primeira vez doando sangue?" },
                    { id: "peso", label: "Pesa mais de 50 Kg?" },
                    {
                      id: "tattoo",
                      label:
                        "Fez uma tatuagem/piercing em um local não certificado pela ANVISA nos últimos 12 meses?",
                    },
                    { id: "sexo", label: "Sexo" },
                  ] as { id: string; label: string }[]
                ).map((q) => (
                  <View key={q.id} style={{ marginBottom: 12 }}>
                    <Text style={[styles.instruction, { marginBottom: 8 }]}>
                      {q.label}
                    </Text>

                    {(q.id === "sexo"
                      ? [
                          { id: "male", label: "Masculino" },
                          { id: "female", label: "Feminino" },
                        ]
                      : options_two
                    ).map((opt) => {
                      const active = selectedPreAnswers[q.id] === opt.id
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={styles.optionRow}
                          onPress={() =>
                            setSelectedPreAnswers((prev) => ({
                              ...prev,
                              [q.id]: opt.id,
                            }))
                          }
                          activeOpacity={0.8}
                        >
                          <View
                            style={[styles.radio, active && styles.radioActive]}
                          >
                            {active && <View style={styles.radioDot} />}
                          </View>
                          <Text
                            style={[
                              styles.optionLabel,
                              active && styles.optionLabelActive,
                            ]}
                          >
                            {" "}
                            {opt.label}{" "}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Dados do Doador */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut
                )
                setOpenDados((s) => !s)
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>Dados do Doador</Text>
              <EvilIcons
                name={openDados ? "chevron-up" : "chevron-down"}
                size={28}
                color="#bdbdbd"
              />
            </TouchableOpacity>
            {openDados && (
              <View style={styles.cardBody}>
                <Text style={styles.label}>CPF</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu CPF"
                  value={cpf}
                  onChangeText={handleCpfChange}
                  keyboardType="numeric"
                  returnKeyType="next"
                  maxLength={14}
                />

                <Text style={styles.label}>Nome Completo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu nome completo"
                  value={nome}
                  onChangeText={setNome}
                  returnKeyType="next"
                />

                <Text style={styles.label}>Data de Nascimento</Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={styles.inputInline}
                    placeholder="dd/mm/aaaa"
                    value={dataNascimento}
                    onChangeText={handleNascimentoChange}
                    returnKeyType="next"
                    maxLength={10}
                  />
                  <TouchableOpacity
                    style={styles.iconButton}
                    activeOpacity={0.7}
                  >
                    <Feather name="calendar" size={20} color="#bdbdbd" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="seuemail@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(xx) xxxxx-xxxx"
                  value={telefone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                />
              </View>
            )}
          </View>

          {/* Local de Doação */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut
                )
                setOpenLocal((s) => !s)
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>Local de Doação</Text>
              <EvilIcons
                name={openLocal ? "chevron-up" : "chevron-down"}
                size={28}
                color="#bdbdbd"
              />
            </TouchableOpacity>
            {openLocal && (
              <View style={styles.cardBody}>
                <Text style={styles.label}>Cidades</Text>
                <TouchableOpacity
                  style={styles.select}
                  onPress={() => {
                    setShowCityList((s) => !s)
                    setShowLocalList(false)
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.selectText}>
                    {selectedCity ?? "Selecione uma cidade"}
                  </Text>
                  <Feather
                    name={showCityList ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#bdbdbd"
                  />
                </TouchableOpacity>

                {showCityList && (
                  <View style={{ marginBottom: 12 }}>
                    {cities.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={styles.optionRow}
                        onPress={() => {
                          setSelectedCity(c)
                          setShowCityList(false)
                          setSelectedLocal(null)
                        }}
                      >
                        <Text style={styles.optionLabel}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={styles.label}>Local*</Text>
                <TouchableOpacity
                  style={styles.select}
                  onPress={() => {
                    if (!selectedCity) {
                      Alert.alert("Selecione uma cidade primeiro")
                      return
                    }
                    setShowLocalList((s) => !s)
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.selectText}>
                    {selectedLocal ?? "Selecione um local"}
                  </Text>
                  <Feather
                    name={showLocalList ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#bdbdbd"
                  />
                </TouchableOpacity>

                {showLocalList && selectedCity && (
                  <View style={{ marginBottom: 12 }}>
                    {(locationsByCity[selectedCity] || []).map((loc) => (
                      <TouchableOpacity
                        key={loc}
                        style={styles.optionRow}
                        onPress={() => {
                          setSelectedLocal(loc)
                          setShowLocalList(false)
                        }}
                      >
                        <Text style={styles.optionLabel}>{loc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Data e Hora */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut
                )
                setOpenDataHora((s) => !s)
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>Data e Hora</Text>
              <EvilIcons
                name={openDataHora ? "chevron-up" : "chevron-down"}
                size={28}
                color="#bdbdbd"
              />
            </TouchableOpacity>
            {openDataHora && (
              <View style={styles.cardBody}>
                <Text style={styles.label}>Data (dd/mm/aaaa)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="20/10/2025"
                  value={date}
                  onChangeText={handleDateChange}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
                <Text style={styles.label}>Hora (HH:MM)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="09:00"
                    value={time}
                    onChangeText={handleTimeChange}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                />
              </View>
            )}
          </View>

          {/* Verificações Finais */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut
                )
                setOpenVerif((s) => !s)
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>Verificações Finais</Text>
              <EvilIcons
                name={openVerif ? "chevron-up" : "chevron-down"}
                size={28}
                color="#bdbdbd"
              />
            </TouchableOpacity>
            {openVerif && (
              <View style={styles.cardBody}>
                <Text style={styles.instruction}>
                  Tipo: {options.find(o => o.id === selected)?.label}
                </Text>
                <Text style={styles.instruction}>
                  Local: {selectedLocal}, {selectedCity}
                </Text>
                <Text style={styles.instruction}>
                  Data/Hora: {date} às {time}
                </Text>
                <Text style={styles.instruction}>
                   Ao confirmar, você concorda com os termos de doação.
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* Footer fixo */}
      <View style={styles.footerFixed} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.backFooter}
          onPress={() => {
              if (openVerif) setOpenVerif(false);
              else if (openDataHora) setOpenDataHora(false);
              else if (openLocal) setOpenLocal(false);
              else if (openDados) setOpenDados(false);
              else if (openPre) setOpenPre(false);
              else if (open) router.back();
              else setOpen(true); // fallback
          }}
        >
          <Text style={styles.backFooterText}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.advanceFooter,
            !selected && !hasPreAnswers && styles.nextButtonDisabled,
          ]}
          onPress={goToNext}
          disabled={loading}
        >
          {loading ? (
               <ActivityIndicator color="#FFF" />
          ) : (
              <Text style={styles.advanceFooterText}>{openVerif ? "Confirmar" : "Avançar"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f0dede",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomEndRadius: 10,
    borderBottomStartRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0dede",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardTitle: {
    fontSize: 16,
    color: "#d32f2f",
    fontFamily: "Roboto-Bold",
  },
  cardBody: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  instruction: {
    marginBottom: 12,
    fontSize: 16,
    color: "#111",
    fontFamily: "Roboto-Regular",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#bdbdbd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioActive: {
    borderColor: "#d32f2f",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#d32f2f",
  },
  optionLabel: {
    fontSize: 15,
    color: "#111",
    fontFamily: "Roboto-Regular",
  },
  optionLabelActive: {
    color: "#111",
    fontFamily: "Roboto-Bold",
  },
  footer: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  footerFixed: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  backFooter: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0dede",
  },
  backFooterText: {
    color: "#d32f2f",
    fontFamily: "Roboto-Bold",
  },
  advanceFooter: {
    backgroundColor: "#d32f2f",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  advanceFooterText: {
    color: "#fff",
    fontFamily: "Roboto-Bold",
  },
  nextButton: {
    //backgroundColor: "#d32f2f",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  nextButtonDisabled: {
    backgroundColor: "#f1bcbc",
  },
  nextButtonText: {
    color: "#fff",
    fontFamily: "Roboto-Bold",
    fontSize: 15,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: "#fff",
    borderBlockColor: "#f0dede",
    borderBottomWidth: 1,
  },
  backButton: {
    position: "absolute",
    left: 12,
    top: 12,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#d32f2f",
    fontSize: 18,
    fontFamily: "Roboto-Bold",
  },
  label: {
    fontSize: 13,
    color: "#444",
    marginBottom: 6,
    fontFamily: "Roboto-Regular",
  },
  input: {
    borderWidth: 1,
    borderColor: "#f0dede",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontFamily: "Roboto-Regular",
    backgroundColor: "#fff",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0dede",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  inputInline: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: "Roboto-Regular",
  },
  iconButton: {
    padding: 8,
  },
  select: {
    borderWidth: 1,
    borderColor: "#f0dede",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  selectText: {
    color: "#999",
    fontFamily: "Roboto-Regular",
  },
})
