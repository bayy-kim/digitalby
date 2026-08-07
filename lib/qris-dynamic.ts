import QRCode from 'qrcode'

/**
 * CRC16-CCITT (Polynomial 0x1021, Initial 0xFFFF)
 * Standard EMVCo / ASPI QRIS checksum algorithm
 */
export function crc16Ccitt(str: string): string {
  let crc = 0xffff
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Base EMVCo String for Bayu shop QRIS (NMID: ID1026543062693)
const BASE_STATIC_QRIS = '00020101021126650014id.co.qrindo.www01189360091500000000000215ID10265430626930303A0151440014id.co.qrindo.www0215ID10265430626935204581253033605802ID5909Bayu shop6007BANDUNG61054011162070703A016304'

/**
 * Generate Dynamic QRIS Payload & Data URL Image
 * Inject Tag 54 (Amount), change Tag 01 to '12' (Dynamic), recalculate CRC16
 */
export function generateDynamicQRISPayload(amount: number, customBaseQris?: string): string {
  let qrisStr = customBaseQris || process.env.BASE_QRIS_STRING || BASE_STATIC_QRIS

  // Remove existing CRC if present at the end (Tag 63)
  if (qrisStr.includes('6304')) {
    const idx = qrisStr.lastIndexOf('6304')
    qrisStr = qrisStr.substring(0, idx)
  }

  // Change Tag 01 from 11 (Static) to 12 (Dynamic)
  qrisStr = qrisStr.replace('010211', '010212')

  // Prepare Tag 54 (Transaction Amount)
  const amountStr = String(amount)
  const tag54Len = String(amountStr.length).padStart(2, '0')
  const tag54 = `54${tag54Len}${amountStr}`

  // Inject Tag 54 before Tag 58 (Country Code '5802ID') or Tag 53 ('5303360')
  if (qrisStr.includes('5802ID')) {
    const splitIdx = qrisStr.indexOf('5802ID')
    qrisStr = qrisStr.substring(0, splitIdx) + tag54 + qrisStr.substring(splitIdx)
  } else if (qrisStr.includes('5303360')) {
    const splitIdx = qrisStr.indexOf('5303360') + 7
    qrisStr = qrisStr.substring(0, splitIdx) + tag54 + qrisStr.substring(splitIdx)
  } else {
    qrisStr += tag54
  }

  // Append Tag 6304 and compute CRC16
  qrisStr += '6304'
  const checksum = crc16Ccitt(qrisStr)
  return qrisStr + checksum
}

/**
 * Generate Data URL QR Code image from dynamic payload
 */
export async function generateDynamicQRISImage(amount: number, customBaseQris?: string): Promise<string> {
  try {
    const payload = generateDynamicQRISPayload(amount, customBaseQris)
    const dataUrl = await QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      color: {
        dark: '#121212',
        light: '#FFFFFF',
      },
    })
    return dataUrl
  } catch (error) {
    console.error('Error generating dynamic QRIS image:', error)
    return ''
  }
}
