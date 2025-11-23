// tipo de retorno simples para validações: sucesso ou mensagem de erro
export type CredentialValidationResult = { valid: boolean; message?: string }

// validação usada no fluxo de login: garante campos preenchidos e email válido
export function validateCredentials({
  email,
  senha,
}: {
  email: string
  senha: string
}): CredentialValidationResult {
  if (!email || !senha) {
    return { valid: false, message: "Por favor, preencha todos os campos." }
  }

  // validação mínima de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Por favor, informe um email válido." }
  }

  return { valid: true }
}

export function validateRegistration({
  nome,
  email,
  senha,
  confirmarSenha,
}: {
  nome: string
  email: string
  senha: string
  confirmarSenha: string
}): CredentialValidationResult {
  // checa campos obrigatórios
  if (!nome || !email || !senha || !confirmarSenha) {
    return { valid: false, message: "Por favor, preencha todos os campos." }
  }

  if (senha !== confirmarSenha) {
    return { valid: false, message: "As senhas não coincidem." }
  }

  if (senha.length < 8) {
    return { valid: false, message: "A senha deve ter no mínimo 8 caracteres." }
  }

  // reusar validação de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Por favor, informe um email válido." }
  }

  return { valid: true }
}

// estrutura de erros por campo, para exibir as mensagens
export type FieldErrors = {
  nome?: string
  email?: string
  senha?: string
  confirmarSenha?: string
}

// retorna um objeto com possíveis erros nos campos do formulário de login
export function validateCredentialsFields({
  email,
  senha,
}: {
  email: string
  senha: string
}): FieldErrors {
  const errors: FieldErrors = {}
  if (!email) errors.email = "Por favor, preencha o campo email."
  if (!senha) errors.senha = "Por favor, preencha o campo senha."

  // se email presente, validar formato
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (email && !emailRegex.test(email))
    errors.email = "Por favor, informe um email válido."

  return errors
}

// retorna erros por campo para o formulário de cadastro
export function validateRegistrationFields({
  nome,
  email,
  senha,
  confirmarSenha,
}: {
  nome: string
  email: string
  senha: string
  confirmarSenha: string
}): FieldErrors {
  const errors: FieldErrors = {}
  if (!nome) errors.nome = "Por favor, preencha o campo nome."
  if (!email) errors.email = "Por favor, preencha o campo email."
  if (!senha) errors.senha = "Por favor, preencha o campo senha."
  if (!confirmarSenha)
    errors.confirmarSenha = "Por favor, preencha o campo de confirmação."

  // checar senhas
  if (senha && confirmarSenha && senha !== confirmarSenha)
    errors.confirmarSenha = "As senhas não coincidem."
  if (senha && senha.length < 8)
    errors.senha = "A senha deve ter no mínimo 8 caracteres."

  // validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (email && !emailRegex.test(email))
    errors.email = "Por favor, informe um email válido."

  return errors
}
