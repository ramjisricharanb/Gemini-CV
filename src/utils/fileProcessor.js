export async function extractTextFromFile(file) {
  const ext = file.name.toLowerCase().split('.').pop()

  switch (ext) {
    case 'txt':
      return await file.text()
    case 'pdf':
      return await extractPdfText(file)
    case 'docx':
    case 'doc':
      return await extractDocxText(file)
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'bmp':
    case 'webp':
      return await extractImageAsBase64(file)
    default:
      throw new Error(`Unsupported file format: ${ext}`)
  }
}

async function extractPdfText(file) {
  try {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js not loaded')
    }
    
    const pdf = await window.pdfjsLib.getDocument(await file.arrayBuffer()).promise
    let text = ''
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map(item => item.str).join(' ')
      text += '\n'
    }
    
    return text
  } catch (error) {
    console.warn('PDF extraction failed, returning raw text:', error)
    return await file.text()
  }
}

async function extractDocxText(file) {
  try {
    if (!window.mammoth) {
      throw new Error('Mammoth not loaded')
    }

    const arrayBuffer = await file.arrayBuffer()
    const result = await window.mammoth.extractRawText({ arrayBuffer })
    return result.value
  } catch (error) {
    console.warn('DOCX extraction failed:', error)
    return await file.text()
  }
}

async function extractImageAsBase64(file) {
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      const mimeType = file.type || getMimeType(file.name)
      resolve(JSON.stringify({ type: 'image', mimeType, base64 }))
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getMimeType(filename) {
  const ext = filename.toLowerCase().split('.').pop()
  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

export function validateFiles(jdFile, resumeFiles) {
  if (!jdFile) throw new Error('Job Description is required')
  if (resumeFiles.length === 0) throw new Error('At least one resume is required')

  const maxSize = 20 * 1024 * 1024
  const validFormats = /\.(txt|pdf|doc|docx|png|jpg|jpeg|gif|bmp|webp)$/i

  if (jdFile.size > maxSize) throw new Error('JD file exceeds 20MB')
  if (!validFormats.test(jdFile.name)) throw new Error('Invalid JD file format')

  for (const resume of resumeFiles) {
    if (resume.size > maxSize) throw new Error(`Resume ${resume.name} exceeds 20MB`)
    if (!validFormats.test(resume.name)) throw new Error(`Invalid resume format: ${resume.name}`)
  }
}
