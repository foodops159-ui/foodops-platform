import { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({ onScan }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animRef = useRef(null)
  const [status, setStatus] = useState('جاري تشغيل الكاميرا...')
  const [manualCode, setManualCode] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setScanning(true)
        setStatus('🔍 جاري المسح...')
        requestAnimationFrame(scanFrame)
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setStatus('❌ يجب السماح بالوصول للكاميرا')
      } else {
        setStatus('❌ ' + err.message)
      }
    }
  }

  const stopCamera = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
  }

  const scanFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scanFrame)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // jsQR — works on ALL browsers
    if (typeof window !== 'undefined' && window.jsQR) {
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      })
      if (code) {
        stopCamera()
        onScan(code.data)
        return
      }
    }

    animRef.current = requestAnimationFrame(scanFrame)
  }

  const handleManual = () => {
    if (!manualCode.trim()) return
    stopCamera()
    onScan(manualCode.trim())
  }

  return (
    <div className="scanner-container">
      {/* Camera View */}
      <div className="scanner-viewport">
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Scan frame overlay */}
        <div className="scan-overlay">
          <div className="scan-frame">
            <div className="corner tl" /><div className="corner tr" />
            <div className="corner bl" /><div className="corner br" />
            {scanning && <div className="scan-line" />}
          </div>
        </div>

        {/* Status */}
        <div className="scan-status">{status}</div>
      </div>

      {/* Manual entry */}
      <div className="manual-entry">
        <p style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
          أو أدخل الكود يدوياً:
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManual()}
            placeholder="باركود أو اسم الصنف"
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}
          />
          <button onClick={handleManual} style={{ padding: '8px 16px', background: '#C9A84C', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            ✓
          </button>
        </div>
      </div>

      <style jsx>{`
        .scanner-container { padding: 12px; }
        .scanner-viewport { position: relative; background: #000; border-radius: 10px; overflow: hidden; aspect-ratio: 4/3; max-height: 260px; }
        .scan-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
        .scan-frame { width: 200px; height: 120px; position: relative; }
        .corner { position: absolute; width: 20px; height: 20px; border-color: #C9A84C; border-style: solid; }
        .corner.tl { top: 0; left: 0; border-width: 3px 0 0 3px; }
        .corner.tr { top: 0; right: 0; border-width: 3px 3px 0 0; }
        .corner.bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; }
        .corner.br { bottom: 0; right: 0; border-width: 0 3px 3px 0; }
        .scan-line { position: absolute; left: 0; right: 0; height: 2px; background: rgba(201,168,76,.8); animation: scanMove 2s infinite; }
        @keyframes scanMove { 0%,100% { top: 10%; } 50% { top: 85%; } }
        .scan-status { position: absolute; bottom: 8px; left: 0; right: 0; text-align: center; font-size: 11px; color: rgba(255,255,255,.8); }
        .manual-entry { padding: 12px 0 0; }
      `}</style>
    </div>
  )
}
