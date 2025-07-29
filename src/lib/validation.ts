// Validation utilities for VNPT eKYC

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DocumentValidation extends ValidationResult {
  documentType?: 'cccd' | 'passport' | 'driver';
  extractedData?: any;
}

// Vietnamese ID validation patterns
const VALIDATION_PATTERNS = {
  cccd: {
    idNumber: /^[0-9]{12}$/,
    name: /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ\s]+$/,
    dateFormat: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/
  },
  passport: {
    idNumber: /^[A-Z][0-9]{7,8}$/,
    name: /^[A-Z\s]+$/,
    dateFormat: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/
  },
  driver: {
    idNumber: /^[0-9]{12}$/,
    name: /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ\s]+$/,
    dateFormat: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
    licenseClass: /^[A-E][0-9]?$/
  }
};

// Validate extracted document information
export function validateDocumentInfo(
  data: any,
  documentType: 'cccd' | 'passport' | 'driver'
): DocumentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const patterns = VALIDATION_PATTERNS[documentType];

  // Validate ID number
  if (!data.idNumber) {
    errors.push('Thiếu số giấy tờ');
  } else if (!patterns.idNumber.test(data.idNumber)) {
    errors.push('Số giấy tờ không hợp lệ');
  } else if (documentType === 'cccd' && !validateVietnameseIDChecksum(data.idNumber)) {
    warnings.push('Số CCCD có thể không chính xác (checksum không khớp)');
  }

  // Validate name
  if (!data.name) {
    errors.push('Thiếu họ và tên');
  } else if (!patterns.name.test(data.name)) {
    errors.push('Họ và tên chứa ký tự không hợp lệ');
  } else if (data.name.length < 2) {
    errors.push('Họ và tên quá ngắn');
  } else if (data.name.length > 50) {
    warnings.push('Họ và tên có thể quá dài');
  }

  // Validate date of birth
  if (!data.dob) {
    errors.push('Thiếu ngày sinh');
  } else if (!patterns.dateFormat.test(data.dob)) {
    errors.push('Định dạng ngày sinh không hợp lệ');
  } else {
    const dobValidation = validateDate(data.dob, 'dob');
    if (!dobValidation.isValid) {
      errors.push(...dobValidation.errors);
    }
    warnings.push(...dobValidation.warnings);
  }

  // Validate issue date
  if (data.issueDate) {
    if (!patterns.dateFormat.test(data.issueDate)) {
      errors.push('Định dạng ngày cấp không hợp lệ');
    } else {
      const issueDateValidation = validateDate(data.issueDate, 'issueDate');
      if (!issueDateValidation.isValid) {
        errors.push(...issueDateValidation.errors);
      }
      warnings.push(...issueDateValidation.warnings);
    }
  }

  // Validate expiry date
  if (data.expiry) {
    if (!patterns.dateFormat.test(data.expiry)) {
      errors.push('Định dạng ngày hết hạn không hợp lệ');
    } else {
      const expiryValidation = validateDate(data.expiry, 'expiry');
      if (!expiryValidation.isValid) {
        errors.push(...expiryValidation.errors);
      }
      warnings.push(...expiryValidation.warnings);
    }
  }

  // Document-specific validations
  if (documentType === 'driver' && data.class) {
    const driverPatterns = VALIDATION_PATTERNS.driver;
    if (!driverPatterns.licenseClass.test(data.class)) {
      warnings.push('Hạng bằng lái có thể không chính xác');
    }
  }

  // Cross-field validations
  if (data.dob && data.issueDate) {
    const dobDate = parseDate(data.dob);
    const issueDate = parseDate(data.issueDate);
    if (dobDate && issueDate) {
      const ageAtIssue = issueDate.getFullYear() - dobDate.getFullYear();
      if (ageAtIssue < 14) {
        errors.push('Tuổi khi cấp giấy tờ không hợp lệ (dưới 14 tuổi)');
      }
    }
  }

  if (data.issueDate && data.expiry) {
    const issueDate = parseDate(data.issueDate);
    const expiryDate = parseDate(data.expiry);
    if (issueDate && expiryDate && expiryDate <= issueDate) {
      errors.push('Ngày hết hạn phải sau ngày cấp');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    documentType,
    extractedData: data
  };
}

// Validate individual date
function validateDate(dateStr: string, type: 'dob' | 'issueDate' | 'expiry'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const date = parseDate(dateStr);
  if (!date) {
    errors.push(`Ngày ${getDateTypeLabel(type)} không hợp lệ`);
    return { isValid: false, errors, warnings };
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  switch (type) {
    case 'dob':
      if (date > now) {
        errors.push('Ngày sinh không thể trong tương lai');
      } else if (date.getFullYear() < 1900) {
        errors.push('Ngày sinh quá xa trong quá khứ');
      } else if (now.getFullYear() - date.getFullYear() > 120) {
        warnings.push('Tuổi có thể quá cao');
      } else if (now.getFullYear() - date.getFullYear() < 14) {
        warnings.push('Tuổi có thể quá nhỏ để có giấy tờ');
      }
      break;

    case 'issueDate':
      if (date > now) {
        errors.push('Ngày cấp không thể trong tương lai');
      } else if (date.getFullYear() < 1975) {
        warnings.push('Ngày cấp có thể quá xa trong quá khứ');
      }
      break;

    case 'expiry':
      if (date < now) {
        warnings.push('Giấy tờ đã hết hạn');
      } else if (date.getFullYear() > currentYear + 50) {
        warnings.push('Ngày hết hạn có thể quá xa trong tương lai');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Parse date string to Date object
function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  const date = new Date(year, month - 1, day);
  
  // Check if the date is valid
  if (date.getDate() !== day || 
      date.getMonth() !== month - 1 || 
      date.getFullYear() !== year) {
    return null;
  }

  return date;
}

// Get date type label in Vietnamese
function getDateTypeLabel(type: 'dob' | 'issueDate' | 'expiry'): string {
  const labels = {
    dob: 'sinh',
    issueDate: 'cấp',
    expiry: 'hết hạn'
  };
  return labels[type];
}

// Validate Vietnamese ID checksum
function validateVietnameseIDChecksum(idNumber: string): boolean {
  if (idNumber.length !== 12) return false;

  const digits = idNumber.split('').map(Number);
  let sum = 0;

  // Calculate checksum
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * (i + 1);
  }

  const checkDigit = sum % 11;
  const expectedCheckDigit = checkDigit === 10 ? 0 : checkDigit;

  return expectedCheckDigit === digits[11];
}

// Validate image quality
export function validateImageQuality(
  imageElement: HTMLImageElement,
  requirements: {
    minWidth?: number;
    minHeight?: number;
    maxFileSize?: number;
    minBrightness?: number;
    maxBrightness?: number;
    minContrast?: number;
  } = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Default requirements
  const reqs = {
    minWidth: 800,
    minHeight: 600,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    minBrightness: 30,
    maxBrightness: 220,
    minContrast: 50,
    ...requirements
  };

  // Check dimensions
  if (imageElement.naturalWidth < reqs.minWidth) {
    errors.push(`Chiều rộng ảnh tối thiểu ${reqs.minWidth}px`);
  }
  if (imageElement.naturalHeight < reqs.minHeight) {
    errors.push(`Chiều cao ảnh tối thiểu ${reqs.minHeight}px`);
  }

  // Analyze image content
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  ctx.drawImage(imageElement, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Calculate brightness
  let totalBrightness = 0;
  let minBrightness = 255;
  let maxBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    totalBrightness += brightness;
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
  }

  const avgBrightness = totalBrightness / (data.length / 4);
  const contrast = maxBrightness - minBrightness;

  // Check brightness
  if (avgBrightness < reqs.minBrightness) {
    errors.push('Ảnh quá tối');
  } else if (avgBrightness > reqs.maxBrightness) {
    errors.push('Ảnh quá sáng');
  }

  // Check contrast
  if (contrast < reqs.minContrast) {
    warnings.push('Độ tương phản thấp, có thể ảnh hưởng đến chất lượng OCR');
  }

  // Check for blur (simplified)
  const blurScore = calculateBlurScore(imageData);
  if (blurScore < 0.3) {
    warnings.push('Ảnh có thể bị mờ');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Calculate blur score (simplified Laplacian variance)
function calculateBlurScore(imageData: ImageData): number {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  let sum = 0;
  let count = 0;

  // Convert to grayscale and calculate Laplacian
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      // Simple Laplacian kernel
      const neighbors = [
        (data[((y-1) * width + x) * 4] + data[((y-1) * width + x) * 4 + 1] + data[((y-1) * width + x) * 4 + 2]) / 3,
        (data[(y * width + (x-1)) * 4] + data[(y * width + (x-1)) * 4 + 1] + data[(y * width + (x-1)) * 4 + 2]) / 3,
        (data[(y * width + (x+1)) * 4] + data[(y * width + (x+1)) * 4 + 1] + data[(y * width + (x+1)) * 4 + 2]) / 3,
        (data[((y+1) * width + x) * 4] + data[((y+1) * width + x) * 4 + 1] + data[((y+1) * width + x) * 4 + 2]) / 3
      ];
      
      const laplacian = Math.abs(4 * gray - neighbors.reduce((a, b) => a + b, 0));
      sum += laplacian * laplacian;
      count++;
    }
  }

  return Math.sqrt(sum / count) / 255; // Normalize to 0-1
}

// Validate QR code data
export function validateQRData(qrData: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!qrData || qrData.trim().length === 0) {
    errors.push('Dữ liệu QR trống');
    return { isValid: false, errors, warnings };
  }

  // Check for common QR data formats
  if (qrData.length < 10) {
    warnings.push('Dữ liệu QR có thể quá ngắn');
  } else if (qrData.length > 1000) {
    warnings.push('Dữ liệu QR có thể quá dài');
  }

  // Check for Vietnamese ID QR format (if applicable)
  if (qrData.includes('|')) {
    const parts = qrData.split('|');
    if (parts.length < 6) {
      warnings.push('Định dạng QR CCCD có thể không đầy đủ');
    }
  }

  // Check for URL format
  if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
    try {
      new URL(qrData);
    } catch {
      errors.push('URL trong QR không hợp lệ');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Validate face matching result
export function validateFaceMatch(
  similarity: number,
  confidence: number,
  threshold: number = 0.7
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (similarity < threshold) {
    errors.push(`Độ tương đồng khuôn mặt thấp (${Math.round(similarity * 100)}%)`);
  } else if (similarity < threshold + 0.1) {
    warnings.push('Độ tương đồng khuôn mặt ở mức ngưỡng');
  }

  if (confidence < 0.5) {
    warnings.push('Độ tin cậy của việc so sánh khuôn mặt thấp');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Comprehensive validation for complete eKYC process
export function validateEKYCProcess(data: {
  documentInfo: any;
  documentType: 'cccd' | 'passport' | 'driver';
  frontImage?: HTMLImageElement;
  backImage?: HTMLImageElement;
  faceImage?: HTMLImageElement;
  faceMatchResult?: { similarity: number; confidence: number };
  qrData?: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate document information
  const docValidation = validateDocumentInfo(data.documentInfo, data.documentType);
  errors.push(...docValidation.errors);
  warnings.push(...docValidation.warnings);

  // Validate images
  if (data.frontImage) {
    const frontValidation = validateImageQuality(data.frontImage);
    if (!frontValidation.isValid) {
      errors.push('Ảnh mặt trước: ' + frontValidation.errors.join(', '));
    }
    warnings.push(...frontValidation.warnings.map(w => 'Ảnh mặt trước: ' + w));
  } else {
    errors.push('Thiếu ảnh mặt trước');
  }

  if (data.documentType === 'cccd' && !data.backImage) {
    errors.push('Thiếu ảnh mặt sau CCCD');
  } else if (data.backImage) {
    const backValidation = validateImageQuality(data.backImage);
    if (!backValidation.isValid) {
      errors.push('Ảnh mặt sau: ' + backValidation.errors.join(', '));
    }
    warnings.push(...backValidation.warnings.map(w => 'Ảnh mặt sau: ' + w));
  }

  if (!data.faceImage) {
    errors.push('Thiếu ảnh khuôn mặt');
  }

  // Validate face matching
  if (data.faceMatchResult) {
    const faceValidation = validateFaceMatch(
      data.faceMatchResult.similarity,
      data.faceMatchResult.confidence
    );
    errors.push(...faceValidation.errors);
    warnings.push(...faceValidation.warnings);
  } else {
    errors.push('Chưa thực hiện so sánh khuôn mặt');
  }

  // Validate QR data if present
  if (data.qrData) {
    const qrValidation = validateQRData(data.qrData);
    errors.push(...qrValidation.errors);
    warnings.push(...qrValidation.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
