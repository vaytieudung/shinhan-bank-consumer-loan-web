import Tesseract from 'tesseract.js';

// OCR Configuration for Vietnamese documents
const OCR_CONFIG = {
  lang: 'vie+eng',
  options: {
    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ /.-,',
    tessedit_pageseg_mode: 6 as any,
    preserve_interword_spaces: '1'
  }
};

// Document patterns for different ID types
const DOCUMENT_PATTERNS = {
  cccd: {
    idNumber: /(?:Số|No\.?)\s*:?\s*([0-9]{12})/i,
    name: /(?:Họ và tên|Full name)\s*:?\s*([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂ\s]+)/i,
    dob: /(?:Ngày sinh|Date of birth)\s*:?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i,
    address: /(?:Nơi thường trú|Address)\s*:?\s*([^:]+?)(?=\n|$)/i,
    issueDate: /(?:Ngày cấp|Date of issue)\s*:?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i
  },
  passport: {
    idNumber: /(?:Passport No\.?|Số hộ chiếu)\s*:?\s*([A-Z0-9]{8,9})/i,
    name: /(?:Surname|Họ)\s*:?\s*([A-Z\s]+)/i,
    givenName: /(?:Given names?|Tên)\s*:?\s*([A-Z\s]+)/i,
    dob: /(?:Date of birth|Ngày sinh)\s*:?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i,
    issueDate: /(?:Date of issue|Ngày cấp)\s*:?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i,
    expiry: /(?:Date of expiry|Ngày hết hạn)\s*:?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i
  },
  driver: {
    idNumber: /(?:Số|No\.?)\s*:?\s*([0-9]{12})/i,
    name: /(?:Họ và tên|Full name)\s*:?\s*([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂ\s]+)/i,
    dob: /(?:Ngày sinh|Date of birth)\s*:?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i,
    class: /(?:Hạng|Class)\s*:?\s*([A-Z0-9,\s]+)/i,
    issueDate: /(?:Ngày cấp|Date of issue)\s*:?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i,
    expiry: /(?:Có giá trị đến|Valid until)\s*:?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i
  }
};

export interface ExtractedInfo {
  idNumber?: string;
  name?: string;
  givenName?: string;
  dob?: string;
  address?: string;
  issueDate?: string;
  expiry?: string;
  class?: string;
  confidence: number;
  rawText: string;
}

export interface OCRProgress {
  status: string;
  progress: number;
  message: string;
}

// Main OCR function
export async function extractTextFromImage(
  imageData: string | File | HTMLImageElement,
  documentType: 'cccd' | 'passport' | 'driver' = 'cccd',
  onProgress?: (progress: OCRProgress) => void
): Promise<ExtractedInfo> {
  try {
    // Initialize Tesseract worker
    const worker = await Tesseract.createWorker(OCR_CONFIG.lang, 1, {
      logger: (m) => {
        if (onProgress) {
          onProgress({
            status: m.status,
            progress: m.progress || 0,
            message: getProgressMessage(m.status, m.progress)
          });
        }
      }
    });

    // Set parameters
    await worker.setParameters(OCR_CONFIG.options);

    // Perform OCR
    const { data } = await worker.recognize(imageData);
    
    // Clean up worker
    await worker.terminate();

    // Extract structured information
    const extractedInfo = extractStructuredInfo(data.text, documentType);
    
    return {
      ...extractedInfo,
      confidence: data.confidence,
      rawText: data.text
    };

  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Không thể trích xuất thông tin từ ảnh. Vui lòng thử lại với ảnh rõ nét hơn.');
  }
}

// Extract structured information based on document type
function extractStructuredInfo(text: string, documentType: 'cccd' | 'passport' | 'driver'): Partial<ExtractedInfo> {
  const patterns = DOCUMENT_PATTERNS[documentType];
  const result: Partial<ExtractedInfo> = {};

  // Clean text
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // Extract information based on patterns
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      (result as any)[key] = match[1].trim();
    }
  }

  // Post-process extracted data
  return postProcessExtractedData(result, documentType);
}

// Post-process and validate extracted data
function postProcessExtractedData(data: Partial<ExtractedInfo>, documentType: string): Partial<ExtractedInfo> {
  const processed = { ...data };

  // Clean and validate ID number
  if (processed.idNumber) {
    processed.idNumber = processed.idNumber.replace(/\D/g, '');
    if (documentType === 'cccd' && processed.idNumber.length !== 12) {
      delete processed.idNumber;
    }
  }

  // Clean name
  if (processed.name) {
    processed.name = processed.name
      .replace(/[^a-zA-ZÀ-ỹ\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  // Validate and format dates
  ['dob', 'issueDate', 'expiry'].forEach(dateField => {
    if ((processed as any)[dateField]) {
      const formatted = formatDate((processed as any)[dateField] as string);
      if (formatted) {
        (processed as any)[dateField] = formatted;
      } else {
        delete (processed as any)[dateField];
      }
    }
  });

  return processed;
}

// Format date to DD/MM/YYYY
function formatDate(dateStr: string): string | null {
  const cleaned = dateStr.replace(/\D/g, '');
  if (cleaned.length === 8) {
    const day = cleaned.substring(0, 2);
    const month = cleaned.substring(2, 4);
    const year = cleaned.substring(4, 8);
    
    // Basic validation
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (dayNum >= 1 && dayNum <= 31 && 
        monthNum >= 1 && monthNum <= 12 && 
        yearNum >= 1900 && yearNum <= new Date().getFullYear()) {
      return `${day}/${month}/${year}`;
    }
  }
  return null;
}

// Get user-friendly progress messages
function getProgressMessage(status: string, progress?: number): string {
  const messages: { [key: string]: string } = {
    'loading tesseract core': 'Đang tải engine OCR...',
    'initializing tesseract': 'Đang khởi tạo OCR...',
    'loading language traineddata': 'Đang tải dữ liệu ngôn ngữ...',
    'initializing api': 'Đang khởi tạo API...',
    'recognizing text': `Đang nhận dạng văn bản... ${progress ? Math.round(progress * 100) : 0}%`
  };

  return messages[status] || `Đang xử lý... ${progress ? Math.round(progress * 100) : 0}%`;
}

// Image quality assessment
export function assessImageQuality(imageElement: HTMLImageElement): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  ctx.drawImage(imageElement, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check brightness
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    totalBrightness += brightness;
  }
  const avgBrightness = totalBrightness / (data.length / 4);
  
  if (avgBrightness < 50) {
    score -= 30;
    issues.push('Ảnh quá tối');
    recommendations.push('Chụp ảnh ở nơi có ánh sáng tốt hơn');
  } else if (avgBrightness > 200) {
    score -= 25;
    issues.push('Ảnh quá sáng');
    recommendations.push('Tránh ánh sáng trực tiếp khi chụp');
  }
  
  // Check contrast (simplified)
  let minBrightness = 255;
  let maxBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
  }
  const contrast = maxBrightness - minBrightness;
  
  if (contrast < 50) {
    score -= 20;
    issues.push('Độ tương phản thấp');
    recommendations.push('Đảm bảo giấy tờ nổi bật so với nền');
  }
  
  // Check resolution
  const totalPixels = canvas.width * canvas.height;
  if (totalPixels < 300000) { // Less than ~0.3MP
    score -= 25;
    issues.push('Độ phân giải thấp');
    recommendations.push('Chụp ảnh với độ phân giải cao hơn');
  }
  
  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
}

// Validate Vietnamese ID number
export function validateVietnameseID(idNumber: string): boolean {
  if (!idNumber || idNumber.length !== 12) return false;
  
  // Check if all characters are digits
  if (!/^\d{12}$/.test(idNumber)) return false;
  
  // Basic checksum validation (simplified)
  const digits = idNumber.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * (i + 1);
  }
  const checkDigit = sum % 11;
  
  return checkDigit === digits[11] || (checkDigit === 10 && digits[11] === 0);
}
