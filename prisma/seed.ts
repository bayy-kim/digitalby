import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import argon2 from 'argon2'
import { generateEncryptedTotpSecret, encryptTotpSecret } from '../lib/totp'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL
  const password = process.env.ADMIN_SEED_PASSWORD

  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD environment variables are required.')
  }

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email },
  })

  const passwordHash = await argon2.hash(password)

  if (existingAdmin) {
    // Re-encrypt existing TOTP secret if plain or update password
    let encryptedSecret = existingAdmin.totpSecret
    if (!existingAdmin.totpSecret.includes(':')) {
      encryptedSecret = encryptTotpSecret(existingAdmin.totpSecret)
    }

    await prisma.adminUser.update({
      where: { email },
      data: {
        passwordHash,
        totpSecret: encryptedSecret,
      },
    })
    console.log(`Updated password and encrypted TOTP secret for admin ${email} successfully.`)
    return
  }

  const { plainSecret, encryptedSecret } = generateEncryptedTotpSecret()

  const admin = await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      totpSecret: encryptedSecret, // Encrypted with AES-256-GCM
    },
  })

  const totpUri = `otpauth://totp/Bayu%20Digital%20Store:${encodeURIComponent(email)}?secret=${plainSecret}&issuer=Bayu%20Digital%20Store`

  console.log('=== ADMIN CREATED SUCCESSFULLY ===')
  console.log(`Email: ${admin.email}`)
  console.log(`TOTP Plain Secret Key (2FA): ${plainSecret}`)
  console.log(`TOTP Encrypted DB String: ${encryptedSecret}`)
  console.log(`TOTP Setup URI: ${totpUri}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
