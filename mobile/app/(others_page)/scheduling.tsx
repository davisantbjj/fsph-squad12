import { EvilIcons, Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import * as React from "react"
import { useState, useMemo } from "react"
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
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

// Habilita animação de layout no Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// SIMULAÇÃO DE DADOS DE DISPONIBILIDADE
const availableSlots = {
  // Estrutura: Dia => Array de { timeSlot: string, vacancies: number, location: string }
  "2025-12-05": [
    { timeSlot: "08:00 - 08:15", vacancies: 10, location: "HEMOSE" },
    { timeSlot: "08:15 - 08:30", vacancies: 13, location: "HEMOSE" },
    { timeSlot: "08:30 - 08:45", vacancies: 5, location: "HEMOSE" },
    { timeSlot: "08:45 - 09:00", vacancies: 15, location: "HEMOSE" },
    { timeSlot: "09:00 - 09:15", vacancies: 0, location: "HEMOSE" },
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

// Funções Auxiliares (mantidas)
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

// SIMULAÇÃO DA ESTRUTURA DO CALENDÁRIO
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

  // Estados de Modal
  const [showDateTimeModal, setShowDateTimeModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Tipo de agendamento
  const [selected, setSelected] = useState<string | null>(null)

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

  // DADOS DA CAMPANHA (NOVOS ESTADOS)
  const isCampaignSelected = selected === "campaign"
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
  const [selectedBloodTypes, setSelectedBloodTypes] = useState<string[]>([]) // <--- ALTERADO PARA ARRAY
  const [requiredDonors, setRequiredDonors] = useState<string>("")

  // Lógica para selecionar/desselecionar tipos sanguíneos (com limite de 4)
  const toggleBloodType = (type: string) => {
    setSelectedBloodTypes((prev) => {
      if (prev.includes(type)) {
        // Desseleciona se já estiver no array
        return prev.filter((t) => t !== type)
      } else if (prev.length < 4) {
        // Seleciona se o limite não foi atingido
        return [...prev, type]
      }
      // Se o limite foi atingido, retorna o array sem alteração
      return prev
    })
  }

  // Dados do Doador
  const [cpf, setCpf] = useState<string>("")
  const [nome, setNome] = useState<string>("")
  const [dataNascimento, setDataNascimento] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [telefone, setTelefone] = useState<string>("")

  const isDonorDataValid = useMemo(() => {
    const isBaseDataValid =
      cpf.length === 14 &&
      nome.trim().length > 0 &&
      dataNascimento.length === 10 &&
      email.trim().length > 0 &&
      telefone.length >= 14

    if (isCampaignSelected) {
      // Regra extra para Campanha: exige PELO MENOS UM tipo sanguíneo e quantidade
      return (
        isBaseDataValid &&
        selectedBloodTypes.length > 0 &&
        requiredDonors.trim().length > 0 &&
        !isNaN(Number(requiredDonors))
      )
    }

    return isBaseDataValid
  }, [
    cpf,
    nome,
    dataNascimento,
    email,
    telefone,
    isCampaignSelected,
    selectedBloodTypes,
    requiredDonors,
  ])

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

  // ==============================================================================
  // LÓGICA DE NAVEGAÇÃO
  // ==============================================================================

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

  // Avança para o próximo card (COM REGRA DE REDIRECIONAMENTO)
  const goToNext = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)

    // 1. Etapa de Tipo de Agendamento
    if (open && selected !== null) {
      setOpen(false)
      if (selected === "campaign") {
        // REGRA DE NEGÓCIO: PULAR PRÉ-TRIAGEM E IR DIRETO PARA DADOS
        setOpenDados(true)
        setOpenPre(false) // Garantir que Pré-Triagem está fechada
      } else {
        setOpenPre(true)
      }
      return
    }

    // 2. Outras Etapas (mantém o fluxo original)
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
    if (openVerif && isAdvanceEnabled) {
      // Finalização
      setShowSuccessModal(true)
      console.log("Fluxo finalizado e Modal de Sucesso Aberto!")
      return
    }
  }

  const goToPrev = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)

    // 1. Voltar da etapa Dados do Doador
    if (openDados) {
      setOpenDados(false)
      if (isCampaignSelected) {
        // Se for Campanha, volta para a primeira etapa
        setOpen(true)
      } else {
        // Se não for Campanha, volta para Pré-Triagem
        setOpenPre(true)
      }
      return
    }

    // 2. Outras Etapas (mantém o fluxo original)
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
    if (openPre) {
      setOpenPre(false)
      setOpen(true)
      return
    }
    if (open) {
      router.replace("/(home_page)/home_page")
    }
  }

  // Lógica para selecionar a data e hora final (usada pelo Modal)
  const handleSlotSelection = (day: string, timeSlot: string) => {
    setSelectedDate(day)
    setSelectedTime(timeSlot)
    setSelectedDay(null)
    setShowDateTimeModal(false)
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

  const options = [
    { id: "individual", label: "Doação de Sangue Individual" },
    { id: "campaign", label: "Campanha de Doação de Sangue" },
    { id: "boneMarrow", label: "Cadastro de Medula Óssea" },
  ]
  const options_two = [
    { id: "yes", label: "Sim" },
    { id: "no", label: "Não" },
  ]

  // ==============================================================================
  // COMPONENTES DE MODAL
  // ==============================================================================

  // Modal de Sucesso (Mantido)
  const SuccessModal = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={modalStyles.centeredView}>
          <View style={successModalStyles.successModalView}>
            {/* Ícone de Coração Vermelho */}
            <View style={successModalStyles.heartIconContainer}>
              <Feather name="heart" size={50} color="white" />
            </View>

            <Text style={successModalStyles.successTitle}>
              Agendamento Realizado!
            </Text>

            <Text style={successModalStyles.successMessage}>
              Seu agendamento está feito! Prepare-se para ser um(a) herói
              (heroína) da vida real.
            </Text>

            {/* Botão de Fechar/Continuar - Opcional, mantendo apenas o X para fechar */}
            <TouchableOpacity
              style={successModalStyles.closeButton}
              onPress={() => {
                setShowSuccessModal(false)
                router.replace("/(home_page)/home_page")
              }}
            >
              <EvilIcons name="close" size={30} color="#444" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  // Componente do Modal de Data/Hora (Mantido)
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

  // Componente do Card de Data e Hora (Mantido)
  const DateTimeCard = () => {
    const displayDate = selectedDate ? formatDate(selectedDate) : null
    const displayDateTime =
      displayDate && selectedTime
        ? `Agendado para: ${displayDate} ${selectedTime}`
        : "Clique para selecionar data e hora"

    return (
      <View style={styles.cardBody}>
        <Text style={styles.instruction}>
          Selecione uma data e horário disponíveis no hemonúcleo.
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

  // Componente de Perguntas de Pré-Triagem (Mantido)
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
      {/* Modais fixos no topo da stack */}
      <DateTimeModal />
      <SuccessModal />

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
          <View style={[styles.card, isCampaignSelected && styles.cardHidden]}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                if (!selected || isCampaignSelected) return
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

          {/* 3. Dados do Doador (COM CAMPOS CONDICIONAIS) */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                if (!isCampaignSelected && !isPreTriageValid) return
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
                    Preencha todos os campos
                    {isCampaignSelected &&
                      " (incluindo Tipo Sanguíneo e Quantidade) "}{" "}
                    corretamente para continuar.
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* 4. Local de Doação */}
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
                  {isCampaignSelected &&
                    `\n- Necessário: ${selectedBloodTypes.join(
                      ", "
                    )} (${requiredDonors} Doadores)`}
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

// ==============================================================================
// ESTILOS
// ==============================================================================

const { width } = Dimensions.get("window")
const calendarWidth = width * 0.9 - 40
const dayButtonSize = calendarWidth / 7 - 4
const timeSlotPadding = 10
const timeSlotWidth = calendarWidth / 2 - timeSlotPadding

// ESTILOS DO MODAL DE SUCESSO
const successModalStyles = StyleSheet.create({
  successModalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "85%",
    maxWidth: 350,
  },
  heartIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d32f2f",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: "Roboto-Regular",
    color: "#444",
    textAlign: "center",
    marginBottom: 15,
  },
  successMessage: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#777",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },
})

// ESTILOS DO MODAL DE DATA/HORA
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    marginBottom: 10,
  },
  timeSlotButtonDisabled: {
    opacity: 0.6,
  },
  timeSlotText: {
    fontSize: 14,
    fontFamily: "Roboto-Bold",
    color: "#444",
    marginBottom: 4,
  },
  timeSlotTextDisabled: {
    color: "#999",
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
    backgroundColor: "#dcdcdc",
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

  // ESTILOS DE CAMPANHA
  cardHidden: { display: "none" },
  campaignFields: {
    paddingVertical: 10,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  bloodTypeSelection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
    marginTop: 5,
  },
  bloodTypeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#bdbdbd",
    backgroundColor: "#f5f5f5",
  },
  bloodTypeButtonActive: {
    borderColor: "#d32f2f",
    backgroundColor: "#f0dede",
  },
  bloodTypeButtonDisabled: {
    opacity: 0.6,
    borderColor: "#e0e0e0",
  },
  bloodTypeButtonText: {
    fontSize: 14,
    color: "#444",
    fontFamily: "Roboto-Regular",
  },
  bloodTypeButtonTextActive: {
    color: "#d32f2f",
    fontFamily: "Roboto-Bold",
  },
  labeloptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#f0dede",
    borderRadius: 8,
  },
})
