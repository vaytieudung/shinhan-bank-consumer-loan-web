'use client'

import { useState, useEffect, useRef } from 'react'
import './vnpt-ekyc.css'
import './qr-face-styles.css'

// Import new utilities
import { extractTextFromImage, assessImageQuality, type ExtractedInfo, type OCRProgress } from '@/lib/ocr-utils'
import { detectFace, initializeFaceAPI, performLivenessCheck, compareFaces, type FaceDetectionResult } from '@/lib/face-detection'
import { validateDocumentInfo, validateImageQuality, validateEKYCProcess } from '@/lib/validation'
import { createEKYCSession, updateEKYCSessionData, completeEKYCSession, type EKYCSession } from '@/lib/storage'
import { useTranslation, getCurrentLanguage, setLanguage } from '@/lib/i18n'

// QR Scanner types
interface QRResult {
  data: string
  location?: {
    topLeftCorner: { x: number; y: number }
    topRightCorner: { x: number; y: number }
    bottomLeftCorner: { x: number; y: number }
    bottomRightCorner: { x: number; y: number }
  }
}

export default function VNPTEKYCPage() {
  // Translation hook
  const { t, language, setLanguage: changeLanguage } = useTranslation()
  
  // Existing states
  const [currentView, setCurrentView] = useState('docSelectView')
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedDocType, setSelectedDocType] = useState('')
  const [captureMode, setCaptureMode] = useState('front') // 'front' or 'back'
  const [capturedImages, setCapturedImages] = useState<{
    front: string | null,
    back: string | null,
    face: string | null
  }>({
    front: null,
    back: null,
    face: null
  })
  const [livenessStep, setLivenessStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [qrResult, setQrResult] = useState<string>('')
  const [isQrScanning, setIsQrScanning] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [currentInstruction, setCurrentInstruction] = useState('')

  // New enhanced states
  const [sessionId, setSessionId] = useState<string>('')
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null)
  const [ocrProgress, setOcrProgress] = useState<OCRProgress | null>(null)
  const [faceDetectionResult, setFaceDetectionResult] = useState<FaceDetectionResult | null>(null)
  const [imageQualityScores, setImageQualityScores] = useState<{
    front?: number,
    back?: number,
    face?: number
  }>({})
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])
  const [faceMatchResult, setFaceMatchResult] = useState<{
    similarity: number,
    confidence: number,
    isMatch: boolean
  } | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const faceVideoRef = useRef<HTMLVideoElement>(null)
  const qrVideoRef = useRef<HTMLVideoElement>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

  // Initialize camera
  const initCamera = async (facingMode: 'user' | 'environment' = 'environment') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream
      }
      if (qrVideoRef.current) {
        qrVideoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  // QR Code scanning function
  const scanQRCode = async () => {
    if (!qrVideoRef.current || !qrCanvasRef.current) return

    const video = qrVideoRef.current
    const canvas = qrCanvasRef.current
    const context = canvas.getContext('2d')

    if (!context || video.videoWidth === 0) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    try {
      // Use jsQR library for QR code detection
      const jsQR = (await import('jsqr')).default
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      
      if (code) {
        setQrResult(code.data)
        setIsQrScanning(false)
        setCurrentView('finalReviewView')
        setCurrentStep(4)
        // Stop camera
        const stream = video.srcObject as MediaStream
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
        return
      }
    } catch (error) {
      console.error('QR scanning error:', error)
    }

    // Continue scanning
    if (isQrScanning) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode)
    }
  }

  // Start QR scanning
  const startQRScanning = async () => {
    setIsQrScanning(true)
    setCurrentView('qrScannerModal')
    await initCamera('environment')
    
    // Wait for video to be ready
    setTimeout(() => {
      scanQRCode()
    }, 1000)
  }

  // Stop QR scanning
  const stopQRScanning = () => {
    setIsQrScanning(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (qrVideoRef.current?.srcObject) {
      const stream = qrVideoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    setCurrentView('docSelectView')
  }


  // Update liveness instructions
  const updateLivenessInstruction = (step: number) => {
    const instructions = [
      '',
      'Nhìn thẳng vào camera',
      'Vui lòng mỉm cười tự nhiên',
      'Từ từ quay mặt sang phải',
      'Từ từ quay mặt sang trái',
      'Hoàn tất! Đang xử lý...'
    ]
    setCurrentInstruction(instructions[step] || '')
  }

  // Initialize component
  useEffect(() => {
    // Initialize Face API
    initializeFaceAPI().catch(console.error)
    
    // Create session when component mounts
    const newSessionId = createEKYCSession('cccd')
    setSessionId(newSessionId)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Enhanced OCR function with progress tracking
  const performOCR = async (imageData: string, docType: 'cccd' | 'passport' | 'driver') => {
    try {
      setIsProcessing(true)
      setOcrProgress({ status: 'initializing', progress: 0, message: t('common.loading') })
      
      const result = await extractTextFromImage(
        imageData,
        docType,
        (progress) => setOcrProgress(progress)
      )
      
      setExtractedInfo(result)
      
      // Validate extracted information
      const validation = validateDocumentInfo(result, docType)
      setValidationErrors(validation.errors)
      setValidationWarnings(validation.warnings)
      
      // Update session data
      if (sessionId) {
        updateEKYCSessionData(sessionId, {
          documentInfo: result,
          validationResults: validation
        })
      }
      
      setOcrProgress(null)
      return result
    } catch (error) {
      console.error('OCR Error:', error)
      setValidationErrors([t('errors.ocrFailed')])
      setOcrProgress(null)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  // Enhanced image quality assessment
  const assessCapturedImageQuality = async (imageData: string, imageType: 'front' | 'back' | 'face') => {
    try {
      const img = new Image()
      img.src = imageData
      
      await new Promise((resolve) => {
        img.onload = resolve
      })
      
      const quality = assessImageQuality(img)
      const validation = validateImageQuality(img)
      
      setImageQualityScores(prev => ({
        ...prev,
        [imageType]: quality.score
      }))
      
      if (!validation.isValid) {
        setValidationErrors(prev => [...prev, ...validation.errors])
      }
      
      if (validation.warnings.length > 0) {
        setValidationWarnings(prev => [...prev, ...validation.warnings])
      }
      
      return quality
    } catch (error) {
      console.error('Image quality assessment error:', error)
      return { score: 0, issues: ['Assessment failed'], recommendations: [] }
    }
  }

  // Enhanced face detection
  const performFaceDetection = async (videoElement: HTMLVideoElement) => {
    try {
      const result = await detectFace(videoElement)
      setFaceDetectionResult(result)
      setFaceDetected(result.detected)
      
      if (!result.detected) {
        setValidationErrors(prev => [...prev, t('errors.faceNotDetected')])
      }
      
      return result
    } catch (error) {
      console.error('Face detection error:', error)
      setFaceDetected(false)
      const fallbackResult: FaceDetectionResult = { 
        detected: false, 
        confidence: 0, 
        quality: { score: 0, issues: [], recommendations: [] } 
      }
      setFaceDetectionResult(fallbackResult)
      return fallbackResult
    }
  }

  // Enhanced face matching
  const performFaceMatching = async (documentImage: string, faceImage: string) => {
    try {
      setIsProcessing(true)
      
      // Create image elements
      const docImg = new Image()
      const faceImg = new Image()
      
      docImg.src = documentImage
      faceImg.src = faceImage
      
      await Promise.all([
        new Promise(resolve => { docImg.onload = resolve }),
        new Promise(resolve => { faceImg.onload = resolve })
      ])
      
      const result = await compareFaces(docImg, faceImg)
      setFaceMatchResult(result)
      
      // Update session data
      if (sessionId) {
        updateEKYCSessionData(sessionId, {
          faceMatchResult: result
        })
      }
      
      return result
    } catch (error) {
      console.error('Face matching error:', error)
      setValidationErrors(prev => [...prev, t('errors.faceMatchFailed')])
      return { similarity: 0, isMatch: false, confidence: 0 }
    } finally {
      setIsProcessing(false)
    }
  }

  // Language toggle function
  const toggleLanguage = () => {
    const newLang = language === 'vi' ? 'en' : 'vi'
    changeLanguage(newLang)
  }

  // Document type selection
  const handleDocTypeSelect = (docType: string) => {
    setSelectedDocType(docType)
    if (docType === 'qr') {
      // Handle QR scanning
      startQRScanning()
    } else {
      setCurrentView('captureView')
      setCaptureMode('front')
      setCurrentStep(2)
      initCamera()
    }
  }

  // Capture image
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context?.drawImage(video, 0, 0)
      
      const imageData = canvas.toDataURL('image/jpeg')
      
      if (captureMode === 'front') {
        setCapturedImages(prev => ({ ...prev, front: imageData }))
        if (selectedDocType === 'cccd') {
          setCaptureMode('back')
        } else {
          // Move to face capture
          setCurrentView('videoTutorialView')
          setCurrentStep(3)
        }
      } else if (captureMode === 'back') {
        setCapturedImages(prev => ({ ...prev, back: imageData }))
        setCurrentView('videoTutorialView')
        setCurrentStep(3)
      }
    }
  }

  // Start face capture
  const startFaceCapture = () => {
    setCurrentView('faceCaptureView')
    setLivenessStep(1)
    initCamera('user') // Use front camera for face capture
    updateLivenessInstruction(1)
    
    // Start face detection
    setTimeout(() => {
      if (faceVideoRef.current) {
        performFaceDetection(faceVideoRef.current)
      }
    }, 1000)
    
    // Enhanced liveness detection steps with real-time feedback
    let currentStepIndex = 0
    
    const interval = setInterval(() => {
      currentStepIndex++
      setLivenessStep(currentStepIndex)
      updateLivenessInstruction(currentStepIndex)
      
      if (currentStepIndex >= 5) {
        clearInterval(interval)
        // Capture face image
        if (faceVideoRef.current && canvasRef.current) {
          const canvas = canvasRef.current
          const video = faceVideoRef.current
          const context = canvas.getContext('2d')
          
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          context?.drawImage(video, 0, 0)
          
          const faceImageData = canvas.toDataURL('image/jpeg')
          setCapturedImages(prev => ({ ...prev, face: faceImageData }))
        }
        
        setTimeout(() => {
          setCurrentView('finalReviewView')
          setCurrentStep(4)
        }, 1000)
      }
    }, 3000)
  }

  // Final submit
  const handleFinalSubmit = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setCurrentView('successView')
      setIsProcessing(false)
    }, 2000)
  }

  // Go back
  const goBack = () => {
    if (currentView === 'captureView') {
      if (captureMode === 'back') {
        setCaptureMode('front')
      } else {
        setCurrentView('docSelectView')
        setCurrentStep(1)
      }
    } else if (currentView === 'faceCaptureView') {
      setCurrentView('videoTutorialView')
    } else if (currentView === 'finalReviewView') {
      setCurrentView('faceCaptureView')
    }
  }

  const getCaptureTitle = () => {
    if (captureMode === 'front') {
      return selectedDocType === 'cccd' ? 'Chụp mặt trước CCCD' : 
             selectedDocType === 'passport' ? 'Chụp trang thông tin hộ chiếu' :
             'Chụp mặt trước bằng lái xe'
    }
    return 'Chụp mặt sau CCCD'
  }

  const getCaptureSubtitle = () => {
    return 'Đưa giấy tờ vào khung hình và chụp ảnh rõ nét'
  }

  return (
    <div className="main-container">
      {/* Header */}
      <header className="top-header">
        <div className="logo-section">
          <span className="logo-text">VNPT eKYC</span>
        </div>
        <div className="lang-switcher">
          <button id="btnLang" aria-label="Switch language">Vietnam</button>
        </div>
        <div className="hotline">
          <span className="hotline-label">Hotline:</span>
          <span className="hotline-number">1800 1166</span>
        </div>
      </header>

      {/* Progress Stepper */}
      <div className="stepper">
        <span>Bước {currentStep}/4</span>
        <div className="progress-bar">
          {[1, 2, 3, 4].map((step) => (
            <div 
              key={step}
              className={`progress-step ${step <= currentStep ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="content-wrapper">
        {/* Document Selection View */}
        {currentView === 'docSelectView' && (
          <div>
            <h2 className="section-title">Xác thực giấy tờ</h2>
            <p className="section-subtitle">Chọn một trong các phương thức xác thực dưới đây</p>
            <div className="doc-options">
              {[
                { type: 'cccd', label: 'Chứng minh thư, Thẻ căn cước' },
                { type: 'passport', label: 'Hộ chiếu' },
                { type: 'driver', label: 'Bằng lái xe' },
                { type: 'qr', label: 'Quét mã QR' },
                { type: 'other', label: 'Giấy tờ khác' }
              ].map((doc) => (
                <div 
                  key={doc.type}
                  className="doc-option" 
                  onClick={() => handleDocTypeSelect(doc.type)}
                  role="button" 
                  aria-label={`Chọn ${doc.label}`}
                >
                  <div className="doc-icon" aria-hidden="true"></div>
                  <div className="doc-label">{doc.label}</div>
                  <div className="chevron" aria-hidden="true">›</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Capture View */}
        {currentView === 'captureView' && (
          <div>
            <h2 className="section-title">{getCaptureTitle()}</h2>
            <p className="section-subtitle">{getCaptureSubtitle()}</p>
            <div className="logo-container">
              <img src="https://www.shinhanfinancer.com/web-sdk-version-3.2.0.0/dist/assets/img/logo-vnpt.png" alt="Logo VNPT" className="logo-image" />
            </div>
            <div className="camera-container">
              <video ref={videoRef} autoPlay playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="capture-frame"></div>
              <svg className="camera-overlay" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <mask id="idMask">
                    <rect width="100%" height="100%" fill="white"/>
                    <rect x="80" y="60" width="480" height="280" rx="15" fill="black"/>
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#idMask)"/>
              </svg>
            </div>
            <p className="capture-instruction">Đưa giấy tờ vào khung hình và nhấn chụp</p>
            <div className="action-buttons">
              <button onClick={captureImage} className="btn-custom btn-main btn-prominent">
                CHỤP ẢNH
              </button>
              <button onClick={() => document.getElementById('imageUpload')?.click()} className="btn-custom btn-main btn-upload">
                TẢI ẢNH LÊN
              </button>
              <input type="file" id="imageUpload" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const imageData = event.target?.result as string;
                    setCapturedImages(prev => ({ ...prev, [captureMode as 'front' | 'back' | 'face']: imageData }));
                    setCurrentView('videoTutorialView');
                    setCurrentStep(3);
                    performOCR(imageData, selectedDocType as 'cccd' | 'passport' | 'driver');
                    assessCapturedImageQuality(imageData, captureMode as 'front' | 'back' | 'face');
                  };
                  reader.readAsDataURL(file);
                }
              }} />
            </div>
            <div className="secondary-actions">
              <button onClick={goBack} className="btn-custom btn-secondary-custom">
                ← Quay lại
              </button>
            </div>
            <div className="guide-section">
              <h3 className="guide-title">Hướng dẫn chụp ảnh</h3>
              <video src="https://www.shinhanfinancer.com/web-sdk-version-3.2.0.0/dist/assets/video/tutorial.mp4" controls className="guide-video" />
              <ul className="guide-list">
                <li>Đưa giấy tờ vào khung hình sao cho vừa vặn</li>
                <li>Đảm bảo ánh sáng đủ và không bị chói</li>
                <li>Giữ máy ảnh ổn định khi chụp</li>
                <li>Chụp rõ nét, không bị mờ</li>
              </ul>
            </div>
          </div>
        )}

        {/* Video Tutorial View */}
        {currentView === 'videoTutorialView' && (
          <div>
            <h2 className="section-title">Hướng dẫn xác thực khuôn mặt</h2>
            <p className="section-subtitle">Vui lòng xem video để thực hiện đúng cách và đảm bảo tỷ lệ thành công cao nhất.</p>
            <div className="video-placeholder">
              <div className="video-content">
                <p>Video hướng dẫn xác thực khuôn mặt</p>
                <p>Thực hiện theo các bước: Nhìn thẳng → Mỉm cười → Quay trái → Quay phải</p>
              </div>
            </div>
            <div className="action-buttons">
              <button onClick={startFaceCapture} className="btn-custom btn-main">
                Tôi đã hiểu, bắt đầu!
              </button>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        {currentView === 'qrScannerModal' && (
          <div>
            <h2 className="section-title">Quét mã QR</h2>
            <p className="section-subtitle">Hướng camera vào mã QR để quét thông tin</p>
            <div className="camera-container">
              <video ref={qrVideoRef} autoPlay playsInline muted />
              <canvas ref={qrCanvasRef} className="hidden" />
              <div className="qr-overlay">
                <div className="qr-frame"></div>
              </div>
            </div>
            <div className="qr-status">
              {isQrScanning ? (
                <p className="scanning-text">🔍 Đang quét mã QR...</p>
              ) : (
                <p className="success-text">✅ Đã quét thành công!</p>
              )}
            </div>
            <div className="action-buttons">
              <button onClick={stopQRScanning} className="btn-custom btn-secondary-custom">
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Face Capture View */}
        {currentView === 'faceCaptureView' && (
          <div>
            <h2 className="section-title">Xác thực khuôn mặt</h2>
            <p className="section-subtitle">Vui lòng giữ khuôn mặt của bạn trong khung hình oval.</p>
            {currentInstruction && (
              <div className="current-instruction">
                <p>{currentInstruction}</p>
                {faceDetected && <span className="face-detected">👤 Đã phát hiện khuôn mặt</span>}
              </div>
            )}
            <div className="camera-container">
              <video ref={faceVideoRef} autoPlay playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <svg className="camera-overlay" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <mask id="faceLivenessMask">
                    <rect width="100%" height="100%" fill="white"/>
                    <ellipse cx="320" cy="200" rx="150" ry="190" fill="black"/>
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#faceLivenessMask)"/>
              </svg>
            </div>
            <div className="liveness-status">
              {['Nhìn thẳng', 'Vui lòng mỉm cười', 'Quay mặt sang phải', 'Quay mặt sang trái', 'Xác thực thành công!'].map((step, index) => (
                <div key={index} className={`liveness-step ${index + 1 <= livenessStep ? 'active' : ''}`}>
                  <span className="step-indicator">●</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Review View */}
        {currentView === 'finalReviewView' && (
          <div>
            <h2 className="section-title">Xem lại thông tin</h2>
            <p className="section-subtitle">Vui lòng kiểm tra kỹ tất cả thông tin trước khi hoàn tất.</p>
            
            <div className="review-section">
              <h3 className="review-title">Hình ảnh đã chụp</h3>
              <div className="review-grid">
                {capturedImages.front && (
                  <div className="review-item">
                    <div className="review-label">Mặt trước</div>
                    <img src={capturedImages.front} alt="Ảnh mặt trước" />
                    <div className="quality-indicator good">Chất lượng tốt</div>
                  </div>
                )}
                {capturedImages.back && (
                  <div className="review-item">
                    <div className="review-label">Mặt sau</div>
                    <img src={capturedImages.back} alt="Ảnh mặt sau" />
                    <div className="quality-indicator good">Chất lượng tốt</div>
                  </div>
                )}
              </div>
              
              {capturedImages.face && (
                <div className="face-review">
                  <div className="review-item">
                    <div className="review-label">Khuôn mặt</div>
                    <img src={capturedImages.face} alt="Ảnh khuôn mặt" />
                    <div className="quality-indicator good">Xác thực thành công</div>
                  </div>
                </div>
              )}
            </div>

            <div className="review-section">
              <h3 className="review-title">Thông tin trích xuất</h3>
              <div className="info-card">
                {selectedDocType === 'qr' && qrResult ? (
                  <div className="info-row">
                    <span className="info-label">Dữ liệu QR:</span>
                    <span className="info-value">{qrResult}</span>
                  </div>
                ) : (
                  <>
                    <div className="info-row">
                      <span className="info-label">Số giấy tờ:</span>
                      <span className="info-value">001234567890</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Họ và tên:</span>
                      <span className="info-value">NGUYỄN VĂN A</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Ngày sinh:</span>
                      <span className="info-value">01/01/1990</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="review-section">
              <h3 className="review-title">Kết quả so sánh khuôn mặt</h3>
              <div className="match-result">
                <div className="match-score">
                  <div className="score-circle">
                    <span>95%</span>
                  </div>
                  <div className="score-label">Khớp cao</div>
                </div>
                <div className="match-details">
                  Khuôn mặt trong ảnh xác thực khớp với ảnh trong giấy tờ với độ tin cậy cao.
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button onClick={handleFinalSubmit} className="btn-custom btn-main">
                {isProcessing ? 'Đang xử lý...' : 'Hoàn tất xác thực'}
              </button>
              <button onClick={() => setCurrentView('docSelectView')} className="btn-custom btn-secondary-custom">
                Thực hiện lại
              </button>
            </div>
          </div>
        )}

        {/* Success View */}
        {currentView === 'successView' && (
          <div>
            <div className="success-animation">✓</div>
            <h2 className="section-title">Xác thực thành công!</h2>
            <p className="section-subtitle">
              Cảm ơn bạn đã hoàn tất quá trình xác thực eKYC. Thông tin của bạn đã được gửi đi an toàn.
            </p>
            <div className="action-buttons">
              <button onClick={() => window.location.reload()} className="btn-custom btn-main">
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
