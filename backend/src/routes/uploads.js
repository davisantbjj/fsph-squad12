import express from 'express'
import path from 'path'
import fs from 'fs/promises'

const router = express.Router()

// Espera um body com { filename, content_base64, mimeType }
router.post('/authorization', async (req, res) => {
  try {
    const { filename, content_base64 } = req.body || {}
    if (!content_base64) return res.status(400).json({ error: 'content_base64 ausente' })

    const uploadsDir = path.join(process.cwd(), 'uploads', 'authorizations')
    await fs.mkdir(uploadsDir, { recursive: true })

    const safeFilename = `${Date.now()}_${(filename || 'authorization').replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const filePath = path.join(uploadsDir, safeFilename)

    const buffer = Buffer.from(content_base64, 'base64')
    await fs.writeFile(filePath, buffer)

    // retorno: caminho relativo ao processo (usado pelo frontend para referência)
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/')
    return res.json({ path: `/${relativePath}` })
  } catch (e) {
    console.error('Erro ao salvar arquivo de autorização (upload):', e)
    return res.status(500).json({ error: 'Erro ao salvar arquivo' })
  }
})

export default router
