import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import { generateSecret } from 'otplib'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL || 'muhamadaibayu@gmail.com'
  const password = process.env.ADMIN_SEED_PASSWORD || 'BayuDigitalStore2026!'

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email },
  })

  if (existingAdmin) {
    console.log(`Admin account ${email} already exists.`)
    return
  }

  const passwordHash = await argon2.hash(password)
  const totpSecret = generateSecret()

  const admin = await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      totpSecret,
    },
  })

  const totpUri = `otpauth://totp/Bayu%20Digital%20Store:${encodeURIComponent(email)}?secret=${totpSecret}&issuer=Bayu%20Digital%20Store`

  console.log('=== ADMIN CREATED SUCCESSFULLY ===')
  console.log(`Email: ${admin.email}`)
  console.log(`TOTP Secret Key (2FA): ${totpSecret}`)
  console.log(`TOTP Setup URI: ${totpUri}`)
  console.log('Use Google Authenticator or Authy to add this TOTP Secret key.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
