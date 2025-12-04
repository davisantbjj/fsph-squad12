import { EvilIcons, Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import api from "@/src/services/api"
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
  Modal,
  Dimensions, // Importado para cálculo de largura do calendário
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

// Habilita animação de layout no Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// SIMULAÇÃO DE DADOS DE DISPONIBILIDADE (AJUSTADO PARA BLOCOS E VAGAS)
// Estrutura: Dia => Array de { timeSlot: string, vacancies: number, location: string }
const availableSlots = {
  // Simulação de Dezembro 2025
  "2025-12-05": [
    { timeSlot: "08:00 - 08:15", vacancies: 10, location: "HEMOSE" },
    { timeSlot: "08:15 - 08:30", vacancies: 13, location: "HEMOSE" },
    { timeSlot: "08:30 - 08:45", vacancies: 5, location: "HEMOSE" },
    { timeSlot: "08:45 - 09:00", vacancies: 15, location: "HEMOSE" },
    { timeSlot: "09:00 - 09:15", vacancies: 0, location: "HEMOSE" }, // Esgotado
    { timeSlot: "09:15 - 09:30", vacancies: 12, location: "HEMOSE" },
  ],
  "2025-12-06": [
    { timeSlot: "14:00 - 14:15", vacancies: 8, location: "HEMOSE" },
    { timeSlot: "14:15 - 14:30", vacancies: 10, location: "HEMOSE" },
  ],
  "2025-12-07": [
    { timeSlot: "08:00 - 08:15", vacancies: 2, location: "HEMOSE" },
    { timeSlot: "09:30 - 09:45", vacancies: 9, location: "HEMOSE" },
  ],
  "2025-12-08": [
    { timeSlot: "10:00 - 10:15", vacancies: 11, location: "HEMOSE" },
    { timeSlot: "11:00 - 11:15", vacancies: 14, location: "HEMOSE" },
    { timeSlot: "12:00 - 12:15", vacancies: 10, location: "HEMOSE" },
  ],
  "2025-12-11": [
    { timeSlot: "10:00 - 10:15", vacancies: 7, location: "HEMOSE" },
  ],
  "2025-12-15": [
    { timeSlot: "08:00 - 08:15", vacancies: 10, location: "HEMOSE" },
  ],
  "2025-12-22": [
    { timeSlot: "14:00 - 14:15", vacancies: 3, location: "HEMOSE" },
  ],
  "2025-12-23": [
    { timeSlot: "08:00 - 08:15", vacancies: 10, location: "HEMOSE" },
  ],
} as Record<string, { timeSlot: string; vacancies: number; location: string }[]>

// Função auxiliar para formatar a data de exibição (dia/mês)
const formatDate = (dateString: string) => {
  if (!dateString) return ""
  const [year, month, day] = dateString.split("-")
  return `${day}/${month}`
}
const getDayNumber = (dateString: string) => {
  return dateString.split("-")[2]
}
const getMonthName = (dateString: string) => {
  return "Dezembro 2025"
}
const getDayOfWeekAndDate = (dateString: string) => {
  const dateMap: Record<string, string> = {
    "2025-12-05": "sexta-feira, 5 de dezembro",
    "2025-12-06": "sábado, 6 de dezembro",
    "2025-12-07": "domingo, 7 de dezembro",
    "2025-12-08": "segunda-feira, 8 de dezembro",
  }
  return dateMap[dateString] || formatDate(dateString)
}

// SIMULAÇÃO DA ESTRUTURA DO CALENDÁRIO (Dezembro 2025)
const calendarDays = [
  null,
  "2025-12-01",
  "2025-12-02",
  "2025-12-03",
  "2025-12-04",
  "2025-12-05",
  "2025-12-06",
  "2025-12-07",
  "2025-12-08",
  "2025-12-09",
  "2025-12-10",
  "2025-12-11",
  "2025-12-12",
  "2025-12-13",
  "2025-12-14",
  "2025-12-15",
  "2025-12-16",
  "2025-12-17",
  "2025-12-18",
  "2025-12-19",
  "2025-12-20",
  "2025-12-21",
  "2025-12-22",
  "2025-12-23",
  "2025-12-24",
  "2025-12-25",
  "2025-12-26",
  "2025-12-27",
  "2025-12-28",
  "2025-12-29",
  "2025-12-30",
  "2025-12-31",
  null,
  null,
  null,
]

export default function SchedulingPage() {
  const router = useRouter()
  // Estados de Abertura dos Cards
  const [open, setOpen] = useState(true)
  const [openPre, setOpenPre] = useState(false)
  const [openDados, setOpenDados] = useState(false)
  const [openLocal, setOpenLocal] = useState(false)
  const [openDataHora, setOpenDataHora] = useState(false)
  const [openVerif, setOpenVerif] = useState(false)

  // Novo Estado para o Modal de Data/Hora
  const [showDateTimeModal, setShowDateTimeModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Tipo de agendamento
  const [selected, setSelected] = useState<string | null>(null)

  // Campaign-related state and helpers
  const isCampaignSelected = selected === "campaign"
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
  const [selectedBloodTypes, setSelectedBloodTypes] = useState<string[]>([])
  const toggleBloodType = (type: string) => {
    setSelectedBloodTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : prev.length < 4
        ? [...prev, type]
        : prev
    )
  }
  const [requiredDonors, setRequiredDonors] = useState<string>("")

  // Pré-Triagem
  const [selectedPreAnswers, setSelectedPreAnswers] = useState<
    Record<string, string | null>
  >({})
  const requiredPreQuestions = ["primeira", "peso", "tattoo", "sexo"]
  const isPreTriageValid = useMemo(() => {
    let isValid = requiredPreQuestions.every(
      (qId) => selectedPreAnswers[qId] !== null
    )
    if (selectedPreAnswers["sexo"] === "female") {
      isValid = isValid && selectedPreAnswers["pregnant"] !== null
    }
    return isValid
  }, [selectedPreAnswers])

  // Dados do Doador
  const [cpf, setCpf] = useState<string>("")
  const [nome, setNome] = useState<string>("")
  const [dataNascimento, setDataNascimento] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [telefone, setTelefone] = useState<string>("")
  const isDonorDataValid = useMemo(() => {
    return (
      cpf.length === 14 &&
      nome.trim().length > 0 &&
      dataNascimento.length === 10 &&
      email.trim().length > 0 &&
      telefone.length >= 14
    )
  }, [cpf, nome, dataNascimento, email, telefone])

  // Local de Doação: cidades e locais
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedLocal, setSelectedLocal] = useState<string | null>(null)
  const [showCityList, setShowCityList] = useState(false)
  const [showLocalList, setShowLocalList] = useState(false)
  const cities = ["Aracaju"]
  const locationsByCity: Record<string, string[]> = {
    Aracaju: ["HEMOSE"],
  }
  const isLocationValid = useMemo(() => {
    return selectedCity !== null && selectedLocal !== null
  }, [selectedCity, selectedLocal])

  // Data e Hora
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const isDateTimeValid = useMemo(() => {
    return selectedDate !== null && selectedTime !== null
  }, [selectedDate, selectedTime])

  const isAdvanceEnabled = useMemo(() => {
    if (open) return selected !== null
    if (openPre) return isPreTriageValid
    if (openDados) return isDonorDataValid
    if (openLocal) return isLocationValid
    if (openDataHora) return isDateTimeValid
    if (openVerif) return true
    return false
  }, [
    open,
    openPre,
    openDados,
    openLocal,
    openDataHora,
    openVerif,
    selected,
    isPreTriageValid,
    isDonorDataValid,
    isLocationValid,
    isDateTimeValid,
  ])

  const goToNext = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    if (open && selected !== null) {
      setOpen(false)
      setOpenPre(true)
      return
    }
    if (openPre && isPreTriageValid) {
      setOpenPre(false)
      setOpenDados(true)
      return
    }
    if (openDados && isDonorDataValid) {
      setOpenDados(false)
      setOpenLocal(true)
      return
    }
    if (openLocal && isLocationValid) {
      setOpenLocal(false)
      setOpenDataHora(true)
      return
    }
    if (openDataHora && isDateTimeValid) {
      setOpenDataHora(false)
      setOpenVerif(true)
      return
    }
    if (openVerif) {
      submitAppointment()
      return
    }
  }

  // Build payload and send to backend
  const submitAppointment = async () => {
    try {
      // Ensure we have required fields
      if (!selectedDate || !selectedTime || !selectedLocal) {
        console.warn('Campos obrigatórios ausentes ao confirmar agendamento')
        return
      }

      // selectedTime format: "HH:MM - HH:MM" -> take start
      const startTime = selectedTime.split("-")[0].trim()
      const dateTime = `${selectedDate} ${startTime}:00` // 'YYYY-MM-DD HH:MM:SS'

      const donor_info = {
        nome_completo: nome || undefined,
        cpf: cpf || undefined,
        telefone: telefone || undefined,
        email: email || undefined,
        data_nascimento: dataNascimento || undefined,
      }

      const pre_triagem = {
        perguntas_respostas: selectedPreAnswers,
      }

      const payload = {
        data_agendamento: dateTime,
        tipo_agendamento: selected || 'individual',
        local_agendamento: selectedLocal,
        donor_info,
        pre_triagem,
      }

      // If campaign, include campaign-specific info
      if (selected === 'campaign') {
        payload.campaign_info = {
          blood_types: selectedBloodTypes,
          required_donors: requiredDonors || null,
        }
      }

      const res = await api.post('/api/appointments', payload)
      console.info('Agendamento criado:', res.data)
      // Navigate back to home or to history
      router.replace('/(home_page)/home_page')
    } catch (err: any) {
      console.error('Erro ao criar agendamento:', err)
      // Try to surface server message if present
      const msg = err?.response?.data?.error || err?.message || 'Erro desconhecido'
      // eslint-disable-next-line no-alert
      alert('Não foi possível confirmar o agendamento: ' + msg)
    }
  }

  const goToPrev = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    if (openVerif) {
      setOpenVerif(false)
      setOpenDataHora(true)
      return
    }
    if (openDataHora) {
      setOpenDataHora(false)
      setOpenLocal(true)
      return
    }
    if (openLocal) {
      setOpenLocal(false)
      setOpenDados(true)
      return
    }
    if (openDados) {
      setOpenDados(false)
      setOpenPre(true)
      return
    }
    if (openPre) {
      setOpenPre(false)
      setOpen(true)
      return
    }
    if (open) {
      router.replace("/(home_page)/home_page")
    }
  }

  const handleSlotSelection = (day: string, timeSlot: string) => {
    setSelectedDate(day)
    // O timeSlot já contém a informação de horário (ex: "08:00 - 08:15")
    setSelectedTime(timeSlot)
    setSelectedDay(null) // Reseta o dia selecionado no modal
    setShowDateTimeModal(false) // Fecha o modal
  }

  // Funções de formatação de input (mantidas)
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

  // Pre-fill donor fields from user's profile
  useEffect(() => {
    let mounted = true
    const loadProfile = async () => {
      try {
        const res = await api.get("/api/users/me")
        const user = res.data
        if (!mounted || !user) return

        if (user.cpf) setCpf(formatCPF(String(user.cpf)))
        if (user.nome_completo) setNome(user.nome_completo)
        if (user.email) setEmail(user.email)
        if (user.telefone) setTelefone(formatNumber(String(user.telefone)))
        if (user.data_nascimento) {
          // backend stores ISO YYYY-MM-DD; convert to dd/mm/yyyy
          const iso = String(user.data_nascimento).split("T")[0]
          const parts = iso.split("-")
          if (parts.length === 3) {
            const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`
            setDataNascimento(formatted)
          }
        }
      } catch (err) {
        console.error("Erro ao carregar perfil para pré-preenchimento:", err)
      }
    }

    loadProfile()
    return () => {
      mounted = false
    }
  }, [])

  const options = [
    { id: "individual", label: "Doação de Sangue Individual" },
    { id: "campaign", label: "Campanha de Doação de Sangue" },
    { id: "boneMarrow", label: "Cadastro de Medula Óssea" },
  ]
  const options_two = [
    { id: "yes", label: "Sim" },
    { id: "no", label: "Não" },
  ]

  // Componente do Modal de Data/Hora (Pop-up)
  const DateTimeModal = () => {
    const daysOfWeek = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"]
    const slots = selectedDay ? availableSlots[selectedDay] || [] : []
    const isDaySelection = selectedDay === null
    const currentMonth = getMonthName(
      calendarDays.find((d) => d !== null) || "2025-12-01"
    )

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDateTimeModal}
        onRequestClose={() => {
          setShowDateTimeModal(false)
          setSelectedDay(null)
        }}
      >
        <View style={modalStyles.centeredView}>
          <View
            style={[
              modalStyles.modalView,
              isDaySelection
                ? modalStyles.calendarModal
                : modalStyles.timeModal,
            ]}
          >
            {/* SELEÇÃO DE DIA (Calendar View) */}
            {isDaySelection && (
              <>
                <View style={modalStyles.calendarHeader}>
                  <TouchableOpacity
                    style={modalStyles.calendarNavButton}
                    disabled={true}
                  >
                    <Feather name="chevron-left" size={24} color="#bdbdbd" />
                  </TouchableOpacity>
                  <Text style={modalStyles.modalTitle}>Selecione a Data</Text>
                  <TouchableOpacity
                    style={modalStyles.calendarNavButton}
                    disabled={true}
                  >
                    <Feather name="chevron-right" size={24} color="#bdbdbd" />
                  </TouchableOpacity>
                </View>

                <View style={modalStyles.monthYearTitle}>
                  <Text style={modalStyles.modalMonthText}>{currentMonth}</Text>
                </View>

                <View style={modalStyles.daysOfWeekContainer}>
                  {daysOfWeek.map((day) => (
                    <Text key={day} style={modalStyles.dayOfWeekText}>
                      {day}
                    </Text>
                  ))}
                </View>

                <View style={modalStyles.dayContainer}>
                  {calendarDays.map((day, index) => {
                    const hasSlots = day && availableSlots[day]?.length > 0
                    const isDisabled = !day || !hasSlots

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          modalStyles.calendarDayButton,
                          isDisabled && modalStyles.dayButtonDisabled,
                        ]}
                        onPress={() => hasSlots && setSelectedDay(day)}
                        disabled={isDisabled}
                      >
                        <Text
                          style={[
                            modalStyles.dayButtonText,
                            isDisabled
                              ? modalStyles.dayTextDisabled
                              : modalStyles.dayTextEnabled,
                          ]}
                        >
                          {day ? getDayNumber(day) : ""}
                        </Text>
                        {hasSlots && <View style={modalStyles.dotIndicator} />}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </>
            )}

            {/* SELEÇÃO DE HORÁRIO */}
            {!isDaySelection && (
              <>
                <View style={modalStyles.timeTitleContainer}>
                  <Text style={modalStyles.timeSectionTitle}>
                    Horários Disponíveis
                  </Text>
                  <Text style={modalStyles.timeSectionSubtitle}>
                    {getDayOfWeekAndDate(selectedDay!)}
                  </Text>
                </View>

                <ScrollView style={modalStyles.timeScroll}>
                  <View style={modalStyles.timeSlotsGrid}>
                    {slots.map((slot) => {
                      const isSoldOut = slot.vacancies === 0
                      return (
                        <TouchableOpacity
                          key={slot.timeSlot}
                          style={[
                            modalStyles.timeSlotButton,
                            isSoldOut && modalStyles.timeSlotButtonDisabled,
                          ]}
                          onPress={() =>
                            handleSlotSelection(selectedDay!, slot.timeSlot)
                          }
                          disabled={isSoldOut}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              modalStyles.timeSlotText,
                              isSoldOut && modalStyles.timeSlotTextDisabled,
                            ]}
                          >
                            {slot.timeSlot}
                          </Text>
                          <Text style={modalStyles.timeSlotLocation}>
                            Local: {slot.location}
                          </Text>
                          <View
                            style={[
                              modalStyles.vacanciesTag,
                              isSoldOut && modalStyles.vacanciesTagDisabled,
                            ]}
                          >
                            <Text
                              style={[
                                modalStyles.vacanciesText,
                                isSoldOut && modalStyles.vacanciesTextDisabled,
                              ]}
                            >
                              {isSoldOut
                                ? "ESGOTADO"
                                : `${slot.vacancies} VAGAS`}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </ScrollView>
                <TouchableOpacity
                  style={modalStyles.backToDaySelectionButton}
                  onPress={() => setSelectedDay(null)}
                >
                  <Feather name="arrow-left" size={16} color="#d32f2f" />
                  <Text style={modalStyles.backButtonText}>
                    Voltar para a seleção de dia
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={() => {
                setShowDateTimeModal(false)
                setSelectedDay(null)
              }}
            >
              <Text style={modalStyles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  // Componente do Card de Data e Hora
  const DateTimeCard = () => {
    const displayDate = selectedDate ? formatDate(selectedDate) : null
    const displayDateTime =
      displayDate && selectedTime
        ? `Agendado para: ${displayDate} ${selectedTime}`
        : "Clique para selecionar data e hora"

    return (
      <View style={styles.cardBody}>
        <Text style={styles.instruction}>
          Selecione uma data e o bloco:
        </Text>
        <TouchableOpacity
          style={[styles.select, isDateTimeValid && { borderColor: "#d32f2f" }]}
          onPress={() => setShowDateTimeModal(true)} // AQUI ABRE O MODAL
          activeOpacity={0.8}
        >
          <Text
            style={[styles.selectText, isDateTimeValid && { color: "#111" }]}
          >
            {displayDateTime}
          </Text>
          <Feather
            name="calendar"
            size={18}
            color={isDateTimeValid ? "#d32f2f" : "#bdbdbd"}
          />
        </TouchableOpacity>
        {!isDateTimeValid && (
          <Text style={{ color: "red", fontSize: 12 }}>
            Selecione uma data e hora para continuar.
          </Text>
        )}
      </View>
    )
  }

  // Componente de Perguntas de Pré-Triagem (Simplificado por brevidade)
  const PreTriageQuestions = () => {
    const questions = [
      { id: "primeira", label: "Primeira vez doando sangue?" },
      { id: "peso", label: "Pesa mais de 50 Kg?" },
      {
        id: "tattoo",
        label: "Fez uma tatuagem/piercing nos últimos 12 meses?",
      },
      { id: "sexo", label: "Sexo" },
    ] as { id: string; label: string }[]

    return (
      <>
        {questions.map((q) => (
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
                      ...(q.id === "sexo" && opt.id === "male"
                        ? { pregnant: null }
                        : {}),
                    }))
                  }
                  activeOpacity={0.8}
                >
                  <View style={[styles.radio, active && styles.radioActive]}>
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
            {q.id === "sexo" && selectedPreAnswers[q.id] === "female" && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.instruction, { marginBottom: 8 }]}>
                  Você está grávida ou amamentando atualmente?
                </Text>
                {options_two.map((opt) => {
                  const active = selectedPreAnswers["pregnant"] === opt.id
                  return (
                    <TouchableOpacity
                      key={"pregnant_" + opt.id}
                      style={styles.optionRow}
                      onPress={() =>
                        setSelectedPreAnswers((prev) => ({
                          ...prev,
                          pregnant: opt.id,
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
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>
        ))}
        {!isPreTriageValid && (
          <Text style={{ color: "red", fontSize: 12 }}>
            Responda todas as perguntas para continuar.
          </Text>
        )}
      </>
    )
  }

  // Estrutura principal do componente
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* O Pop-up de Data/Hora Fixo no topo da stack */}
      <DateTimeModal />

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
          {/* 1. Tipo de agendamento */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut
                )
                setOpen((s) => !s)
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>Tipo de agendamento</Text>
              <EvilIcons
                name={open ? "chevron-up" : "chevron-down"}
                size={35}
                color={selected ? "#d32f2f" : "#bdbdbd"}
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
                {!selected && (
                  <Text style={{ color: "red", fontSize: 12 }}>
                    Selecione uma opção para continuar.
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* 2. Pré-Triagem */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                if (!selected) return
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut
                )
                setOpenPre((s) => !s)
              }}
              activeOpacity={0.8}
              disabled={isCampaignSelected}
            >
              <Text style={styles.cardTitle}>Pré-Triagem</Text>
              <EvilIcons
                name={openPre ? "chevron-up" : "chevron-down"}
                size={28}
                color={isPreTriageValid ? "#d32f2f" : "#bdbdbd"}
              />
            </TouchableOpacity>
            {openPre && (
              <View style={styles.cardBody}>
                <PreTriageQuestions />
              </View>
            )}
          </View>

          {/* 3. Dados do Doador */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                if (!isPreTriageValid) return
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
                color={isDonorDataValid ? "#d32f2f" : "#bdbdbd"}
              />
            </TouchableOpacity>
            {openDados && (
              <View style={styles.cardBody}>
                {/* NOVOS CAMPOS PARA CAMPANHA */}
                {isCampaignSelected && (
                  <View style={styles.campaignFields}>
                    <Text style={styles.label}>
                      Tipo Sanguíneo Necessário (Máx. 4)*
                    </Text>

                    {/* Exibe o texto de aviso se o limite for atingido */}
                    {selectedBloodTypes.length === 4 && (
                      <Text
                        style={{
                          color: "orange",
                          marginBottom: 10,
                          fontSize: 13,
                        }}
                      >
                        Limite de 4 tipos sanguíneos atingido.
                      </Text>
                    )}

                    {/* Simulação de lista de seleção rápida de tipos sanguíneos */}
                    <View style={styles.bloodTypeSelection}>
                      {bloodTypes.map((type) => {
                        const active = selectedBloodTypes.includes(type)
                        const disabled =
                          !active && selectedBloodTypes.length >= 4

                        return (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.bloodTypeButton,
                              active && styles.bloodTypeButtonActive,
                              disabled && styles.bloodTypeButtonDisabled,
                            ]}
                            onPress={() => toggleBloodType(type)}
                            disabled={disabled}
                          >
                            <Text
                              style={[
                                styles.bloodTypeButtonText,
                                active && styles.bloodTypeButtonTextActive,
                                disabled && { color: "#b0b0b0" }, // Cor mais clara para desabilitado
                              ]}
                            >
                              {type}
                            </Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>

                    <Text style={styles.label}>
                      Quantidade de Doadores Necessária*
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 50"
                      value={requiredDonors}
                      onChangeText={(text) =>
                        setRequiredDonors(text.replace(/[^0-9]/g, ""))
                      }
                      keyboardType="numeric"
                    />
                  </View>
                )}

                <Text style={styles.label}>CPF</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu CPF"
                  value={cpf}
                  onChangeText={handleCpfChange}
                  keyboardType="numeric"
                  maxLength={14}
                />
                <Text style={styles.label}>Nome Completo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu nome completo"
                  value={nome}
                  onChangeText={setNome}
                />
                <Text style={styles.label}>Data de Nascimento</Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={styles.inputInline}
                    placeholder="dd/mm/aaaa"
                    value={dataNascimento}
                    onChangeText={handleNascimentoChange}
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
                {!isDonorDataValid && (
                  <Text style={{ color: "red", fontSize: 12 }}>
                    Preencha todos os campos corretamente para continuar.
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* 4. Local de Doação */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                if (!isDonorDataValid) return
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
                color={isLocationValid ? "#d32f2f" : "#bdbdbd"}
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
                        style={styles.labeloptionRow}
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
                  style={[
                    styles.select,
                    !selectedCity && { backgroundColor: "#f5f5f5" },
                  ]}
                  onPress={() => {
                    if (!selectedCity) {
                      setShowCityList(true)
                      return
                    }
                    setShowLocalList((s) => !s)
                  }}
                  activeOpacity={0.8}
                  disabled={!selectedCity}
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
                        style={styles.labeloptionRow}
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
                {!isLocationValid && (
                  <Text style={{ color: "red", fontSize: 12 }}>
                    Selecione a cidade e o local para continuar.
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* 5. Data e Hora */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                if (!isLocationValid) return
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
                color={isDateTimeValid ? "#d32f2f" : "#bdbdbd"}
              />
            </TouchableOpacity>
            {openDataHora && <DateTimeCard />}
          </View>

          {/* 6. Verificações Finais */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                if (!isDateTimeValid) return
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
                  Revisão das informações antes de confirmar:
                  {"\n"}- Tipo:{" "}
                  {options.find((o) => o.id === selected)?.label ||
                    "Não selecionado"}
                  {"\n"}- Local: {selectedLocal} ({selectedCity}){"\n"}-
                  Data/Hora: {formatDate(selectedDate || "")} {selectedTime}
                  {"\n"}- Doador: {nome}
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* Footer fixo */}
      <View style={styles.footerFixed} pointerEvents="box-none">
        <TouchableOpacity style={styles.backFooter} onPress={goToPrev}>
          <Text style={styles.backFooterText}>{open ? "Sair" : "Voltar"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.advanceFooter,
            !isAdvanceEnabled && styles.nextButtonDisabled,
          ]}
          onPress={goToNext}
          disabled={!isAdvanceEnabled}
        >
          <Text style={styles.advanceFooterText}>
            {openVerif ? "Confirmar Agendamento" : "Avançar"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const { width } = Dimensions.get("window")
const calendarWidth = width * 0.9 - 40
const dayButtonSize = calendarWidth / 7 - 4
const timeSlotPadding = 10
const timeSlotWidth = calendarWidth / 2 - timeSlotPadding

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
  },
  calendarModal: {
    maxHeight: 500,
    paddingVertical: 10,
  },
  timeModal: {
    maxHeight: 600,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
    marginBottom: 5,
  },
  calendarNavButton: {
    padding: 5,
    opacity: 0.7,
  },
  modalTitle: {
    textAlign: "center",
    fontSize: 18,
    fontFamily: "Roboto-Bold",
    color: "#444",
  },
  modalMonthText: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Roboto-Bold",
    color: "#444",
    marginBottom: 10,
  },
  monthYearTitle: {
    paddingVertical: 5,
  },
  daysOfWeekContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
    // Removendo borda inferior para maior semelhança com a imagem
    // borderBottomWidth: 1,
    // borderBottomColor: '#f0f0f0',
    paddingBottom: 4,
  },
  dayOfWeekText: {
    width: dayButtonSize,
    textAlign: "center",
    fontSize: 12,
    color: "#bdbdbd",
    fontFamily: "Roboto-Regular",
  },
  dayContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    paddingVertical: 4,
    marginBottom: 10,
  },
  calendarDayButton: {
    width: dayButtonSize,
    height: dayButtonSize,
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
    borderRadius: 5,
    backgroundColor: "transparent",
    // Adicionando borda sutil para se parecer com a célula da imagem
    borderWidth: 1,
    borderColor: "#f5f5f5",
  },
  dayButtonDisabled: {
    backgroundColor: "transparent",
  },
  dayButtonText: {
    fontSize: 15,
    fontFamily: "Roboto-Regular",
  },
  dayTextEnabled: {
    color: "#444",
    fontFamily: "Roboto-Regular",
  },
  dayTextDisabled: {
    color: "#dcdcdc",
    fontFamily: "Roboto-Regular",
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#388e3c",
    position: "absolute",
    bottom: 5,
  },
  // ESTILOS PARA O BLOCO DE HORAS
  timeTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingTop: 10,
    marginBottom: 10,
  },
  timeSectionTitle: {
    fontSize: 16,
    fontFamily: "Roboto-Bold",
    color: "#444",
  },
  timeSectionSubtitle: {
    fontSize: 12,
    color: "#999",
    fontFamily: "Roboto-Regular",
  },
  timeScroll: {
    maxHeight: 350,
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingVertical: 10,
    gap: 10,
  },
  timeSlotButton: {
    width: timeSlotWidth,
    borderWidth: 1,
    borderColor: "#f0dede",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white",
    // Mantendo a sombra para dar profundidade (como na imagem)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    marginBottom: 10,
  },
  timeSlotButtonDisabled: {
    opacity: 0.6, // Suavizando a opacidade para indisponibilidade
  },
  timeSlotText: {
    fontSize: 14,
    fontFamily: "Roboto-Bold",
    color: "#444",
    marginBottom: 4,
  },
  timeSlotTextDisabled: {
    color: "#999", // Mudando a cor, mas mantendo a linha por uma melhor UX
  },
  timeSlotLocation: {
    fontSize: 12,
    color: "#777",
    fontFamily: "Roboto-Regular",
    marginBottom: 8,
  },
  vacanciesTag: {
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  vacanciesTagDisabled: {
    backgroundColor: "#dcdcdc", // Mais sutil que vermelho puro
    borderColor: "#dcdcdc",
  },
  vacanciesText: {
    fontSize: 10,
    fontFamily: "Roboto-Bold",
    color: "#444",
  },
  vacanciesTextDisabled: {
    color: "#777",
  },
  // Estilos de controle (mantidos)
  closeButton: {
    marginTop: 20,
    backgroundColor: "#444",
    padding: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "white",
    fontFamily: "Roboto-Bold",
    textAlign: "center",
  },
  backToDaySelectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f0dede",
  },
  backButtonText: {
    marginLeft: 5,
    color: "#d32f2f",
    fontFamily: "Roboto-Regular",
  },
  noSlotsText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    padding: 20,
  },
})

// Estilos existentes (styles) - Omitidos por brevidade
const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 12 },
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
  cardTitle: { fontSize: 16, color: "#d32f2f", fontFamily: "Roboto-Bold" },
  cardBody: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 16 },
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
  radioActive: { borderColor: "#d32f2f" },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#d32f2f",
  },
  optionLabel: { fontSize: 15, color: "#111", fontFamily: "Roboto-Regular" },
  optionLabelActive: { color: "#111", fontFamily: "Roboto-Bold" },
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
  backFooterText: { color: "#d32f2f", fontFamily: "Roboto-Bold" },
  advanceFooter: {
    backgroundColor: "#d32f2f",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  advanceFooterText: { color: "#fff", fontFamily: "Roboto-Bold" },
  nextButtonDisabled: { backgroundColor: "#f1bcbc" },
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
  headerTitle: { color: "#d32f2f", fontSize: 18, fontFamily: "Roboto-Bold" },
  label: {
    fontSize: 13,
    color: "#444",
    marginBottom: 6,
    fontFamily: "Roboto-Regular",
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
  selectText: { color: "#999", fontFamily: "Roboto-Regular" },
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
  inputInline: { flex: 1, paddingVertical: 10, fontFamily: "Roboto-Regular" },
  iconButton: { padding: 8 },
})
