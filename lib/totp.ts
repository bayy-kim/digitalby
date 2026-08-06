import crypto from 'crypto'
import { generateSecret, verifySync } from 'otplib'

const getEncryptionKey = () => {
  const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-32-chars-length!!'
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypt TOTP Secret using AES-256-GCM before saving to Database
 */
export function encryptTotpSecret(plainSecret: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  let encrypted = cipher.update(plainSecret, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Decrypt TOTP Secret from Database
 */
export function decryptTotpSecret(encryptedData: string): string {
  // If not in encrypted format (e.g. legacy plain secret), return directly for backward compatibility
  if (!encryptedData.includes(':')) {
    return encryptedData
  }

  const [ivHex, authTagHex, encryptedText] = encryptedData.split(':')
  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Generate a new TOTP secret & return plain + encrypted versions
 */
export function generateEncryptedTotpSecret(): { plainSecret: string; encryptedSecret: string } {
  const plainSecret = generateSecret()
  const encryptedSecret = encryptTotpSecret(plainSecret)
  return { plainSecret, encryptedSecret }
}

/**
 * Verify a 6-digit TOTP token against the encrypted TOTP secret stored in DB
 */
export function verifyTotpToken(token: string, encryptedSecret: string): boolean {
  try {
    const plainSecret = decryptTotpSecret(encryptedSecret)
    const result = verifySync({
      token,
      secret: plainSecret,
    })
    return typeof result === 'boolean' ? result : Boolean(result?.valid)
  } catch (err) {
    console.error('Failed to decrypt and verify TOTP secret:', err)
    return false
  }
}
