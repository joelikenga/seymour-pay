import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode'
import { computeScanQrBox } from '../pages/pay/payFlowShared'

export const PAY_SCANNER_REGION_ID = 'pay-ticket-scanner-host'

export type PayScannerInstance = Html5Qrcode

export async function waitForScannerHostLayout(
  el: HTMLElement,
  maxAttempts = 60,
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i += 1) {
    const { width, height } = el.getBoundingClientRect()
    if (width > 0 && height > 0) return true
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  return false
}

export function createPayScanner(): Html5Qrcode {
  return new Html5Qrcode(PAY_SCANNER_REGION_ID, {
    verbose: false,
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    // ZXing on canvas is more reliable than native BarcodeDetector when video is styled for fullscreen.
    useBarCodeDetectorIfSupported: false,
  })
}

/** Playback + visibility only - do not resize scan_region/canvas (breaks decode crop math). */
export function ensureScannerVideoPlaying(hostId: string): void {
  const host = document.getElementById(hostId)
  if (!host) return
  const video = host.querySelector('video')
  if (!video) return
  video.setAttribute('playsinline', 'true')
  video.setAttribute('webkit-playsinline', 'true')
  video.muted = true
  void video.play().catch(() => {})
}

export function createDebouncedScanHandler(
  onSuccess: (decoded: string) => void,
  cooldownMs = 1500,
): (decoded: string) => void {
  let lastText = ''
  let lastAt = 0
  return (decoded: string) => {
    const text = decoded.trim()
    if (!text) return
    const now = Date.now()
    if (text === lastText && now - lastAt < cooldownMs) return
    lastText = text
    lastAt = now
    onSuccess(text)
  }
}

export type PayScannerCameraDevice = {
  id: string
  label: string
}

const ULTRA_WIDE_CAMERA =
  /ultra\s*wide|0\.5\s*[×x]?|0,5|wide\s*angle|\buw\b|超広|grand\s*angle/i

const TELEPHOTO_CAMERA =
  /telephoto|\btele\b|\b2x\b|\b3x\b|\b5x\b| téléobjectif/i

const REAR_CAMERA =
  /back|rear|environment|trás|arrière|後置|arrière/i

const FRONT_CAMERA = /front|user|selfie|face|前置|self/i

export function isUltraWideCameraLabel(label: string): boolean {
  return ULTRA_WIDE_CAMERA.test(label)
}

export function isTelephotoCameraLabel(label: string): boolean {
  return TELEPHOTO_CAMERA.test(label)
}

export function isMainRearCameraLabel(label: string): boolean {
  if (isUltraWideCameraLabel(label) || isTelephotoCameraLabel(label)) {
    return false
  }
  if (/^back camera$/i.test(label.trim())) return true
  return REAR_CAMERA.test(label)
}

/** Prefer the standard rear lens — not ultra-wide (0.5×) or telephoto. */
export function pickDefaultCameraId(
  cameras: ReadonlyArray<PayScannerCameraDevice>,
): string | undefined {
  if (cameras.length === 0) return undefined
  if (cameras.length === 1) return cameras[0].id

  const mainRear = cameras.find((c) => isMainRearCameraLabel(c.label))
  if (mainRear) return mainRear.id

  const rearNotUltra = cameras.find(
    (c) => REAR_CAMERA.test(c.label) && !isUltraWideCameraLabel(c.label),
  )
  if (rearNotUltra) return rearNotUltra.id

  const notUltra = cameras.find((c) => !isUltraWideCameraLabel(c.label))
  if (notUltra) return notUltra.id

  return cameras[0].id
}

export function formatPayScannerCameraLabel(
  label: string,
  index: number,
): string {
  const trimmed = label.trim()
  if (!trimmed) return `Camera ${index + 1}`
  if (isUltraWideCameraLabel(trimmed)) return '0.5× Ultra wide'
  if (isTelephotoCameraLabel(trimmed)) return 'Telephoto'
  if (FRONT_CAMERA.test(trimmed)) return 'Front camera'
  if (isMainRearCameraLabel(trimmed)) return 'Main camera'
  if (REAR_CAMERA.test(trimmed)) return 'Back camera'
  return trimmed
}

export async function listPayScannerCameras(): Promise<PayScannerCameraDevice[]> {
  try {
    return await Html5Qrcode.getCameras()
  } catch {
    return []
  }
}

export async function startPayScanner(
  html5: Html5Qrcode,
  onSuccess: (decoded: string) => void,
  options?: { deviceId?: string },
): Promise<PayScannerCameraDevice[]> {
  const onScan = createDebouncedScanHandler(onSuccess)

  const config = {
    fps: 15,
    qrbox: computeScanQrBox,
    disableFlip: false,
  }

  const cameras = await listPayScannerCameras()
  const deviceId = options?.deviceId ?? pickDefaultCameraId(cameras)

  if (deviceId) {
    await html5.start(deviceId, config, onScan, () => {})
  } else {
    try {
      await html5.start({ facingMode: 'environment' }, config, onScan, () => {})
    } catch {
      await html5.start({ facingMode: 'user' }, config, onScan, () => {})
    }
  }

  ensureScannerVideoPlaying(PAY_SCANNER_REGION_ID)
  window.setTimeout(() => ensureScannerVideoPlaying(PAY_SCANNER_REGION_ID), 300)

  return cameras.length > 0 ? cameras : await listPayScannerCameras()
}

export async function stopPayScanner(html5: Html5Qrcode | null): Promise<void> {
  if (!html5) return
  try {
    await html5.stop()
  } catch {
    /* already stopped */
  }
  try {
    html5.clear()
  } catch {
    /* ignore */
  }
}
