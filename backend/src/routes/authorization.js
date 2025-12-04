import express from 'express'
import path from 'path'
import fs from 'fs'

const router = express.Router()

// Serves the authorization PDF placed in the project's docs folder
router.get('/', (req, res) => {
  try {
    // Try several candidate docs locations (server may be started from backend/)
    const candidates = [
      path.join(process.cwd(), 'docs'),
      path.join(process.cwd(), '..', 'docs'),
      path.join(process.cwd(), '..', '..', 'docs'),
      path.join(process.cwd(), '..', '..', '..', 'docs'),
    ]
    let base = null
    for (const c of candidates) {
      try {
        console.log('authorization route checking candidate:', c)
        if (fs.existsSync(c)) {
          base = c
          break
        }
      } catch (e) {
        console.warn('authorization route error checking', c, e && e.message)
      }
    }
    if (!base) {
      console.error('Docs folder not found in expected locations')
      return res.status(404).json({ error: 'Arquivo não encontrado' })
    }

    const filePath = path.join(base, 'Autorizacao-de-Menores-de-Idade.pdf')
    // For security, ensure the path is inside the discovered docs folder
    if (!filePath.startsWith(base)) {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    if (!fs.existsSync(filePath)) {
      console.error('Arquivo não encontrado em', filePath)
      return res.status(404).json({ error: 'Arquivo não encontrado' })
    }

    res.download(filePath, 'Autorizacao-de-Menores-de-Idade.pdf', (err) => {
      if (err) {
        console.error('Erro ao enviar arquivo de autorização:', err)
        if (!res.headersSent) res.status(500).json({ error: 'Erro ao baixar o arquivo' })
      }
    })
  } catch (e) {
    console.error('Erro na rota de autorização:', e)
    res.status(500).json({ error: 'Erro interno' })
  }
})

export default router
