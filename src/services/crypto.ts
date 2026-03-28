const ENCRYPTION_ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256

async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export async function encryptPassword(password: string, masterKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = generateSalt()
  const key = await deriveKey(masterKey, salt.buffer as ArrayBuffer)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    encoder.encode(password)
  )
  
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)
  
  return arrayBufferToBase64(combined.buffer as ArrayBuffer)
}

export async function decryptPassword(encryptedData: string, masterKey: string): Promise<string> {
  const decoder = new TextDecoder()
  const combined = new Uint8Array(base64ToArrayBuffer(encryptedData))
  
  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const encrypted = combined.slice(28)
  
  const key = await deriveKey(masterKey, salt.buffer as ArrayBuffer)
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    encrypted
  )
  
  return decoder.decode(decrypted)
}

export function generateId(): string {
  return crypto.randomUUID()
}
