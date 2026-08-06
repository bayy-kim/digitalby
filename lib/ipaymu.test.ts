import { generateIPaymuSignature } from './ipaymu'

describe('iPaymu HMAC-SHA256 Signature Verification', () => {
  beforeAll(() => {
    process.env.IPAYMU_VA = '0000001402241926'
    process.env.IPAYMU_API_KEY = 'SANDBOX676579E7-E31F-4B6A-911D-D650B08688E2-20220311105436'
  })

  it('generates consistent signature headers with uppercase method and hex hash', () => {
    const body = { amount: 50000, referenceId: 'order-123' }
    const { signature, timestamp, va } = generateIPaymuSignature('POST', body)

    expect(va).toBe('0000001402241926')
    expect(timestamp).toMatch(/^\d{14}$/)
    expect(signature).toHaveLength(64) // SHA-256 hex string length
  })
})
