import crypto from 'crypto'

export interface IPaymuQRISRequest {
  name: string
  email?: string
  phone?: string
  amount: number
  referenceId: string
  notifyUrl: string
  returnUrl: string
  cancelUrl: string
  productName: string
}

export interface IPaymuQRISResponse {
  Status: number
  Success: boolean
  Message: string
  Data?: {
    SessionID: string
    TransactionId: number
    ReferenceId: string
    Via: string
    Channel: string
    PaymentNo: string
    QrImage?: string
    QrString?: string
    Url?: string
  }
}

export interface IPaymuCheckStatusResponse {
  Status: number
  Success: boolean
  Message: string
  Data?: {
    TransactionId: number
    ReferenceId: string
    Amount: number
    Status: number // 1: Success/Paid, 0: Pending, 2: Canceled/Expired, -1: Failed
    StatusName: string
    Via: string
    Channel: string
    PaidDate?: string
  }
}

const getIPaymuConfig = () => {
  const va = process.env.IPAYMU_VA || ''
  const apiKey = process.env.IPAYMU_API_KEY || ''
  const mode = process.env.IPAYMU_MODE || 'sandbox'
  const baseUrl = mode === 'production' 
    ? 'https://my.ipaymu.com/api/v2' 
    : 'https://sandbox.ipaymu.com/api/v2'

  return { va, apiKey, baseUrl, mode }
}

/**
 * Generate iPaymu HMAC-SHA256 Signature
 * Signature = HMAC-SHA256(UPPERCASE(HttpMethod) + ":" + VA + ":" + Lowercase(SHA256(Body)) + ":" + ApiKey, ApiKey)
 */
export function generateIPaymuSignature(method: string, bodyObj: any): { signature: string; timestamp: string; va: string } {
  const { va, apiKey } = getIPaymuConfig()

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`

  const bodyJson = bodyObj && Object.keys(bodyObj).length > 0 ? JSON.stringify(bodyObj) : '{}'
  const bodyHash = crypto.createHash('sha256').update(bodyJson).digest('hex').toLowerCase()

  const stringToSign = `${method.toUpperCase()}:${va}:${bodyHash}:${apiKey}`
  const signature = crypto.createHmac('sha256', apiKey).update(stringToSign).digest('hex')

  return { signature, timestamp, va }
}

/**
 * Request QRIS Transaction via iPaymu Payment Direct API
 */
export async function createIPaymuQRIS(reqData: IPaymuQRISRequest): Promise<IPaymuQRISResponse> {
  const { baseUrl } = getIPaymuConfig()
  const endpoint = `${baseUrl}/payment/direct`

  const bodyObj = {
    name: reqData.name || 'Pelanggan Digital Store',
    email: reqData.email || 'customer@example.com',
    phone: reqData.phone || '08123456789',
    amount: reqData.amount,
    notifyUrl: reqData.notifyUrl,
    returnUrl: reqData.returnUrl,
    cancelUrl: reqData.cancelUrl,
    referenceId: reqData.referenceId,
    paymentMethod: 'qris',
    paymentChannel: 'qris',
    product: [reqData.productName],
    qty: [1],
    price: [reqData.amount]
  }

  const { signature, timestamp, va } = generateIPaymuSignature('POST', bodyObj)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'va': va,
      'signature': signature,
      'timestamp': timestamp
    },
    body: JSON.stringify(bodyObj),
    cache: 'no-store'
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`iPaymu API HTTP Error ${response.status}: ${errorText}`)
  }

  const data: IPaymuQRISResponse = await response.json()
  return data
}

/**
 * Double-check iPaymu Transaction Status directly to server
 */
export async function checkIPaymuTransactionStatus(trxId: string | number): Promise<IPaymuCheckStatusResponse> {
  const { baseUrl } = getIPaymuConfig()
  const endpoint = `${baseUrl}/transaction`

  const bodyObj = {
    transactionId: String(trxId)
  }

  const { signature, timestamp, va } = generateIPaymuSignature('POST', bodyObj)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'va': va,
      'signature': signature,
      'timestamp': timestamp
    },
    body: JSON.stringify(bodyObj),
    cache: 'no-store'
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`iPaymu Check Status HTTP Error ${response.status}: ${errorText}`)
  }

  const data: IPaymuCheckStatusResponse = await response.json()
  return data
}
