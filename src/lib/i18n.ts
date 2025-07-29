// Internationalization utilities for VNPT eKYC
import { useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

export interface TranslationKeys {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    back: string;
    next: string;
    retry: string;
    close: string;
    save: string;
    delete: string;
    edit: string;
    view: string;
  };

  // Header
  header: {
    title: string;
    hotline: string;
    language: string;
  };

  // Steps
  steps: {
    step: string;
    of: string;
    documentSelection: string;
    documentCapture: string;
    faceVerification: string;
    review: string;
  };

  // Document Selection
  documentSelection: {
    title: string;
    subtitle: string;
    cccd: string;
    passport: string;
    driver: string;
    qr: string;
    other: string;
  };

  // Document Capture
  documentCapture: {
    frontTitle: {
      cccd: string;
      passport: string;
      driver: string;
    };
    backTitle: string;
    subtitle: string;
    instruction: string;
    captureButton: string;
    uploadButton: string;
    guide: string;
  };

  // QR Scanner
  qrScanner: {
    title: string;
    subtitle: string;
    scanning: string;
    success: string;
    error: string;
  };

  // Face Verification
  faceVerification: {
    tutorialTitle: string;
    tutorialSubtitle: string;
    tutorialContent: string;
    startButton: string;
    captureTitle: string;
    captureSubtitle: string;
    instructions: {
      lookStraight: string;
      smile: string;
      turnRight: string;
      turnLeft: string;
      complete: string;
    };
    faceDetected: string;
  };

  // Review
  review: {
    title: string;
    subtitle: string;
    imagesTitle: string;
    frontLabel: string;
    backLabel: string;
    faceLabel: string;
    qualityGood: string;
    qualityPoor: string;
    infoTitle: string;
    idNumber: string;
    fullName: string;
    dateOfBirth: string;
    address: string;
    issueDate: string;
    expiry: string;
    faceMatchTitle: string;
    faceMatchHigh: string;
    faceMatchMedium: string;
    faceMatchLow: string;
    submitButton: string;
    retryButton: string;
  };

  // Success
  success: {
    title: string;
    subtitle: string;
    confirmButton: string;
  };

  // Errors
  errors: {
    cameraAccess: string;
    ocrFailed: string;
    faceNotDetected: string;
    qrNotFound: string;
    validationFailed: string;
    networkError: string;
    sessionExpired: string;
    imageQuality: string;
    faceMatchFailed: string;
  };

  // Validation
  validation: {
    required: string;
    invalidFormat: string;
    invalidDate: string;
    invalidId: string;
    imageTooSmall: string;
    imageTooLarge: string;
    imageTooDark: string;
    imageTooLight: string;
    lowContrast: string;
    blurryImage: string;
  };

  // Quality Assessment
  quality: {
    excellent: string;
    good: string;
    fair: string;
    poor: string;
    recommendations: {
      improveLight: string;
      avoidGlare: string;
      moveCloser: string;
      moveFarther: string;
      centerDocument: string;
      holdSteady: string;
    };
  };
}

const translations: Record<Language, TranslationKeys> = {
  vi: {
    common: {
      loading: 'Đang tải...',
      error: 'Lỗi',
      success: 'Thành công',
      cancel: 'Hủy',
      confirm: 'Xác nhận',
      back: 'Quay lại',
      next: 'Tiếp theo',
      retry: 'Thử lại',
      close: 'Đóng',
      save: 'Lưu',
      delete: 'Xóa',
      edit: 'Sửa',
      view: 'Xem'
    },
    header: {
      title: 'VNPT eKYC',
      hotline: 'Hotline: 1800 1166',
      language: 'Tiếng Việt'
    },
    steps: {
      step: 'Bước',
      of: '/',
      documentSelection: 'Chọn giấy tờ',
      documentCapture: 'Chụp giấy tờ',
      faceVerification: 'Xác thực khuôn mặt',
      review: 'Xem lại thông tin'
    },
    documentSelection: {
      title: 'Xác thực giấy tờ',
      subtitle: 'Chọn một trong các phương thức xác thực dưới đây',
      cccd: 'Chứng minh thư, Thẻ căn cước',
      passport: 'Hộ chiếu',
      driver: 'Bằng lái xe',
      qr: 'Quét mã QR',
      other: 'Giấy tờ khác'
    },
    documentCapture: {
      frontTitle: {
        cccd: 'Chụp mặt trước CCCD',
        passport: 'Chụp trang thông tin hộ chiếu',
        driver: 'Chụp mặt trước bằng lái xe'
      },
      backTitle: 'Chụp mặt sau CCCD',
      subtitle: 'Đưa giấy tờ vào khung hình và chụp ảnh rõ nét',
      instruction: 'Đưa giấy tờ vào khung hình và nhấn chụp',
      captureButton: 'CHỤP ẢNH',
      uploadButton: 'TẢI ẢNH LÊN',
      guide: 'Hướng dẫn'
    },
    qrScanner: {
      title: 'Quét mã QR',
      subtitle: 'Hướng camera vào mã QR để quét thông tin',
      scanning: '🔍 Đang quét mã QR...',
      success: '✅ Đã quét thành công!',
      error: '❌ Không thể quét mã QR'
    },
    faceVerification: {
      tutorialTitle: 'Hướng dẫn xác thực khuôn mặt',
      tutorialSubtitle: 'Vui lòng xem video để thực hiện đúng cách và đảm bảo tỷ lệ thành công cao nhất.',
      tutorialContent: 'Thực hiện theo các bước: Nhìn thẳng → Mỉm cười → Quay trái → Quay phải',
      startButton: 'Tôi đã hiểu, bắt đầu!',
      captureTitle: 'Xác thực khuôn mặt',
      captureSubtitle: 'Vui lòng giữ khuôn mặt của bạn trong khung hình oval.',
      instructions: {
        lookStraight: 'Nhìn thẳng vào camera',
        smile: 'Vui lòng mỉm cười tự nhiên',
        turnRight: 'Từ từ quay mặt sang phải',
        turnLeft: 'Từ từ quay mặt sang trái',
        complete: 'Hoàn tất! Đang xử lý...'
      },
      faceDetected: '👤 Đã phát hiện khuôn mặt'
    },
    review: {
      title: 'Xem lại thông tin',
      subtitle: 'Vui lòng kiểm tra kỹ tất cả thông tin trước khi hoàn tất.',
      imagesTitle: 'Hình ảnh đã chụp',
      frontLabel: 'Mặt trước',
      backLabel: 'Mặt sau',
      faceLabel: 'Khuôn mặt',
      qualityGood: 'Chất lượng tốt',
      qualityPoor: 'Chất lượng kém',
      infoTitle: 'Thông tin trích xuất',
      idNumber: 'Số giấy tờ',
      fullName: 'Họ và tên',
      dateOfBirth: 'Ngày sinh',
      address: 'Địa chỉ',
      issueDate: 'Ngày cấp',
      expiry: 'Ngày hết hạn',
      faceMatchTitle: 'Kết quả so sánh khuôn mặt',
      faceMatchHigh: 'Khớp cao',
      faceMatchMedium: 'Khớp trung bình',
      faceMatchLow: 'Khớp thấp',
      submitButton: 'Hoàn tất xác thực',
      retryButton: 'Thực hiện lại'
    },
    success: {
      title: 'Xác thực thành công!',
      subtitle: 'Cảm ơn bạn đã hoàn tất quá trình xác thực eKYC. Thông tin của bạn đã được gửi đi an toàn.',
      confirmButton: 'Xác nhận'
    },
    errors: {
      cameraAccess: 'Không thể truy cập camera. Vui lòng cho phép truy cập camera.',
      ocrFailed: 'Không thể trích xuất thông tin từ ảnh. Vui lòng thử lại với ảnh rõ nét hơn.',
      faceNotDetected: 'Không phát hiện khuôn mặt. Vui lòng đảm bảo khuôn mặt nằm trong khung hình.',
      qrNotFound: 'Không tìm thấy mã QR. Vui lòng đảm bảo mã QR rõ nét và trong khung hình.',
      validationFailed: 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.',
      networkError: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
      sessionExpired: 'Phiên làm việc đã hết hạn. Vui lòng bắt đầu lại.',
      imageQuality: 'Chất lượng ảnh không đạt yêu cầu.',
      faceMatchFailed: 'Khuôn mặt không khớp với ảnh trong giấy tờ.'
    },
    validation: {
      required: 'Trường này là bắt buộc',
      invalidFormat: 'Định dạng không hợp lệ',
      invalidDate: 'Ngày không hợp lệ',
      invalidId: 'Số giấy tờ không hợp lệ',
      imageTooSmall: 'Ảnh quá nhỏ',
      imageTooLarge: 'Ảnh quá lớn',
      imageTooDark: 'Ảnh quá tối',
      imageTooLight: 'Ảnh quá sáng',
      lowContrast: 'Độ tương phản thấp',
      blurryImage: 'Ảnh bị mờ'
    },
    quality: {
      excellent: 'Xuất sắc',
      good: 'Tốt',
      fair: 'Khá',
      poor: 'Kém',
      recommendations: {
        improveLight: 'Cải thiện ánh sáng',
        avoidGlare: 'Tránh ánh sáng chói',
        moveCloser: 'Di chuyển gần hơn',
        moveFarther: 'Di chuyển xa hơn',
        centerDocument: 'Căn giữa giấy tờ',
        holdSteady: 'Giữ máy ảnh ổn định'
      }
    }
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      retry: 'Retry',
      close: 'Close',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View'
    },
    header: {
      title: 'VNPT eKYC',
      hotline: 'Hotline: 1800 1166',
      language: 'English'
    },
    steps: {
      step: 'Step',
      of: ' of ',
      documentSelection: 'Select Document',
      documentCapture: 'Capture Document',
      faceVerification: 'Face Verification',
      review: 'Review Information'
    },
    documentSelection: {
      title: 'Document Verification',
      subtitle: 'Choose one of the verification methods below',
      cccd: 'ID Card, Citizen ID',
      passport: 'Passport',
      driver: 'Driver License',
      qr: 'QR Code Scan',
      other: 'Other Documents'
    },
    documentCapture: {
      frontTitle: {
        cccd: 'Capture Front of ID Card',
        passport: 'Capture Passport Information Page',
        driver: 'Capture Front of Driver License'
      },
      backTitle: 'Capture Back of ID Card',
      subtitle: 'Place document in frame and take a clear photo',
      instruction: 'Place document in frame and press capture',
      captureButton: 'CAPTURE PHOTO',
      uploadButton: 'UPLOAD IMAGE',
      guide: 'Guide'
    },
    qrScanner: {
      title: 'QR Code Scanner',
      subtitle: 'Point camera at QR code to scan information',
      scanning: '🔍 Scanning QR code...',
      success: '✅ Successfully scanned!',
      error: '❌ Unable to scan QR code'
    },
    faceVerification: {
      tutorialTitle: 'Face Verification Guide',
      tutorialSubtitle: 'Please watch the video to perform correctly and ensure the highest success rate.',
      tutorialContent: 'Follow these steps: Look straight → Smile → Turn left → Turn right',
      startButton: 'I understand, let\'s start!',
      captureTitle: 'Face Verification',
      captureSubtitle: 'Please keep your face within the oval frame.',
      instructions: {
        lookStraight: 'Look straight at the camera',
        smile: 'Please smile naturally',
        turnRight: 'Slowly turn face to the right',
        turnLeft: 'Slowly turn face to the left',
        complete: 'Complete! Processing...'
      },
      faceDetected: '👤 Face detected'
    },
    review: {
      title: 'Review Information',
      subtitle: 'Please carefully check all information before completing.',
      imagesTitle: 'Captured Images',
      frontLabel: 'Front',
      backLabel: 'Back',
      faceLabel: 'Face',
      qualityGood: 'Good Quality',
      qualityPoor: 'Poor Quality',
      infoTitle: 'Extracted Information',
      idNumber: 'ID Number',
      fullName: 'Full Name',
      dateOfBirth: 'Date of Birth',
      address: 'Address',
      issueDate: 'Issue Date',
      expiry: 'Expiry Date',
      faceMatchTitle: 'Face Matching Result',
      faceMatchHigh: 'High Match',
      faceMatchMedium: 'Medium Match',
      faceMatchLow: 'Low Match',
      submitButton: 'Complete Verification',
      retryButton: 'Try Again'
    },
    success: {
      title: 'Verification Successful!',
      subtitle: 'Thank you for completing the eKYC verification process. Your information has been securely submitted.',
      confirmButton: 'Confirm'
    },
    errors: {
      cameraAccess: 'Unable to access camera. Please allow camera access.',
      ocrFailed: 'Unable to extract information from image. Please try again with a clearer image.',
      faceNotDetected: 'Face not detected. Please ensure your face is within the frame.',
      qrNotFound: 'QR code not found. Please ensure QR code is clear and within frame.',
      validationFailed: 'Information is invalid. Please check again.',
      networkError: 'Network connection error. Please check your internet connection.',
      sessionExpired: 'Session has expired. Please start again.',
      imageQuality: 'Image quality does not meet requirements.',
      faceMatchFailed: 'Face does not match the photo in the document.'
    },
    validation: {
      required: 'This field is required',
      invalidFormat: 'Invalid format',
      invalidDate: 'Invalid date',
      invalidId: 'Invalid ID number',
      imageTooSmall: 'Image too small',
      imageTooLarge: 'Image too large',
      imageTooDark: 'Image too dark',
      imageTooLight: 'Image too bright',
      lowContrast: 'Low contrast',
      blurryImage: 'Blurry image'
    },
    quality: {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor',
      recommendations: {
        improveLight: 'Improve lighting',
        avoidGlare: 'Avoid glare',
        moveCloser: 'Move closer',
        moveFarther: 'Move farther',
        centerDocument: 'Center document',
        holdSteady: 'Hold camera steady'
      }
    }
  }
};

// Current language state
let currentLanguage: Language = 'vi';

// Get current language
export function getCurrentLanguage(): Language {
  return currentLanguage;
}

// Set language
export function setLanguage(language: Language): void {
  currentLanguage = language;
  // Save to localStorage
  localStorage.setItem('vnpt_ekyc_language', language);
  
  // Dispatch custom event for components to listen
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
}

// Initialize language from localStorage
export function initializeLanguage(): void {
  const savedLanguage = localStorage.getItem('vnpt_ekyc_language') as Language;
  if (savedLanguage && (savedLanguage === 'vi' || savedLanguage === 'en')) {
    currentLanguage = savedLanguage;
  } else {
    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('vi')) {
      currentLanguage = 'vi';
    } else {
      currentLanguage = 'en';
    }
  }
}

// Get translation
export function t(key: string): string {
  const keys = key.split('.');
  let value: any = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key; // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key;
}

// Get translation with parameters
export function tp(key: string, params: Record<string, string | number>): string {
  let translation = t(key);
  
  // Replace parameters in format {paramName}
  for (const [paramKey, paramValue] of Object.entries(params)) {
    translation = translation.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
  }
  
  return translation;
}

// Get all translations for current language
export function getAllTranslations(): TranslationKeys {
  return translations[currentLanguage];
}

// Get available languages
export function getAvailableLanguages(): { code: Language; name: string }[] {
  return [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' }
  ];
}

// Format date according to current language
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (currentLanguage === 'vi') {
    return dateObj.toLocaleDateString('vi-VN');
  } else {
    return dateObj.toLocaleDateString('en-US');
  }
}

// Format number according to current language
export function formatNumber(number: number): string {
  if (currentLanguage === 'vi') {
    return number.toLocaleString('vi-VN');
  } else {
    return number.toLocaleString('en-US');
  }
}

// Format currency (Vietnamese Dong)
export function formatCurrency(amount: number): string {
  if (currentLanguage === 'vi') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
}

// Get relative time (e.g., "2 minutes ago")
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (currentLanguage === 'vi') {
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return formatDate(dateObj);
  } else {
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateObj);
  }
}

// React hook for translations
export function useTranslation() {
  const [language, setCurrentLang] = useState(currentLanguage);

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLang(event.detail);
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  return {
    t,
    tp,
    language,
    setLanguage,
    formatDate,
    formatNumber,
    formatCurrency,
    getRelativeTime
  };
}

// Initialize language on module load
if (typeof window !== 'undefined') {
  initializeLanguage();
}
