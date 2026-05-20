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

export async function pickRearCameraId(): Promise<string | undefined> {
  try {
    const cameras = await Html5Qrcode.getCameras()
    if (cameras.length === 0) return undefined
    const rear = cameras.find((c) =>
      /back|rear|environment|trás|arrière/i.test(c.label),
    )
    return rear?.id ?? cameras[cameras.length - 1]?.id
  } catch {
    return undefined
  }
}

export async function startPayScanner(
  html5: Html5Qrcode,
  onSuccess: (decoded: string) => void,
): Promise<void> {
  const onScan = createDebouncedScanHandler(onSuccess)

  const config = {
    fps: 15,
    qrbox: computeScanQrBox,
    disableFlip: false,
  }

  const deviceId = await pickRearCameraId()
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
