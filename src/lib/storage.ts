// Storage utilities for VNPT eKYC data management

export interface EKYCSession {
  id: string;
  timestamp: number;
  documentType: 'cccd' | 'passport' | 'driver' | 'qr';
  currentStep: number;
  maxStep: number;
  status: 'in_progress' | 'completed' | 'failed' | 'expired';
  data: {
    documentInfo?: any;
    images?: {
      front?: string;
      back?: string;
      face?: string;
    };
    qrData?: string;
    faceMatchResult?: {
      similarity: number;
      confidence: number;
      isMatch: boolean;
    };
    validationResults?: any;
  };
  metadata: {
    userAgent: string;
    ipAddress?: string;
    deviceInfo?: any;
    startTime: number;
    lastActivity: number;
  };
}

export interface StorageConfig {
  maxSessions: number;
  sessionTimeout: number; // in milliseconds
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

const DEFAULT_CONFIG: StorageConfig = {
  maxSessions: 10,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  compressionEnabled: true,
  encryptionEnabled: false
};

class EKYCStorage {
  private config: StorageConfig;
  private storageKey = 'vnpt_ekyc_sessions';

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Create new session
  createSession(documentType: 'cccd' | 'passport' | 'driver' | 'qr'): string {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    const session: EKYCSession = {
      id: sessionId,
      timestamp: now,
      documentType,
      currentStep: 1,
      maxStep: 4,
      status: 'in_progress',
      data: {},
      metadata: {
        userAgent: navigator.userAgent,
        deviceInfo: this.getDeviceInfo(),
        startTime: now,
        lastActivity: now
      }
    };

    this.saveSession(session);
    this.cleanupExpiredSessions();
    
    return sessionId;
  }

  // Get session by ID
  getSession(sessionId: string): EKYCSession | null {
    const sessions = this.getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) return null;
    
    // Check if session is expired
    if (this.isSessionExpired(session)) {
      this.deleteSession(sessionId);
      return null;
    }
    
    return session;
  }

  // Update session data
  updateSession(sessionId: string, updates: Partial<EKYCSession>): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    const updatedSession: EKYCSession = {
      ...session,
      ...updates,
      metadata: {
        ...session.metadata,
        lastActivity: Date.now()
      }
    };

    this.saveSession(updatedSession);
    return true;
  }

  // Update session step
  updateSessionStep(sessionId: string, step: number): boolean {
    return this.updateSession(sessionId, { 
      currentStep: step,
      metadata: {
        lastActivity: Date.now()
      } as any
    });
  }

  // Update session data
  updateSessionData(sessionId: string, data: Partial<EKYCSession['data']>): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    const updatedData = {
      ...session.data,
      ...data
    };

    return this.updateSession(sessionId, { data: updatedData });
  }

  // Complete session
  completeSession(sessionId: string): boolean {
    return this.updateSession(sessionId, { 
      status: 'completed',
      currentStep: 4
    });
  }

  // Fail session
  failSession(sessionId: string, reason?: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    return this.updateSession(sessionId, { 
      status: 'failed',
      data: {
        ...session.data,
        ...(reason && { failureReason: reason })
      } as any
    });
  }

  // Delete session
  deleteSession(sessionId: string): boolean {
    const sessions = this.getAllSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    
    if (sessions.length === filteredSessions.length) return false;
    
    this.saveSessions(filteredSessions);
    return true;
  }

  // Get all sessions
  getAllSessions(): EKYCSession[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      
      const sessions = JSON.parse(data) as EKYCSession[];
      return sessions.filter(session => !this.isSessionExpired(session));
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  // Get active sessions
  getActiveSessions(): EKYCSession[] {
    return this.getAllSessions().filter(s => s.status === 'in_progress');
  }

  // Get completed sessions
  getCompletedSessions(): EKYCSession[] {
    return this.getAllSessions().filter(s => s.status === 'completed');
  }

  // Export session data
  exportSession(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    // Remove sensitive data for export
    const exportData = {
      ...session,
      data: {
        ...session.data,
        images: session.data.images ? {
          front: session.data.images.front ? '[IMAGE_DATA]' : undefined,
          back: session.data.images.back ? '[IMAGE_DATA]' : undefined,
          face: session.data.images.face ? '[IMAGE_DATA]' : undefined
        } : undefined
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import session data
  importSession(sessionData: string): string | null {
    try {
      const session = JSON.parse(sessionData) as EKYCSession;
      
      // Validate session structure
      if (!this.validateSessionStructure(session)) {
        throw new Error('Invalid session structure');
      }

      // Generate new ID to avoid conflicts
      session.id = this.generateSessionId();
      session.timestamp = Date.now();
      session.metadata.lastActivity = Date.now();

      this.saveSession(session);
      return session.id;
    } catch (error) {
      console.error('Error importing session:', error);
      return null;
    }
  }

  // Clear all sessions
  clearAllSessions(): void {
    localStorage.removeItem(this.storageKey);
  }

  // Get storage statistics
  getStorageStats(): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    failedSessions: number;
    storageSize: number;
    oldestSession?: Date;
    newestSession?: Date;
  } {
    const sessions = this.getAllSessions();
    const storageData = localStorage.getItem(this.storageKey) || '';
    
    const stats = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'in_progress').length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      failedSessions: sessions.filter(s => s.status === 'failed').length,
      storageSize: new Blob([storageData]).size,
      oldestSession: undefined as Date | undefined,
      newestSession: undefined as Date | undefined
    };

    if (sessions.length > 0) {
      const timestamps = sessions.map(s => s.timestamp);
      stats.oldestSession = new Date(Math.min(...timestamps));
      stats.newestSession = new Date(Math.max(...timestamps));
    }

    return stats;
  }

  // Private methods
  private generateSessionId(): string {
    return 'ekyc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private saveSession(session: EKYCSession): void {
    const sessions = this.getAllSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }

    // Limit number of sessions
    if (sessions.length > this.config.maxSessions) {
      sessions.sort((a, b) => b.timestamp - a.timestamp);
      sessions.splice(this.config.maxSessions);
    }

    this.saveSessions(sessions);
  }

  private saveSessions(sessions: EKYCSession[]): void {
    try {
      const data = JSON.stringify(sessions);
      localStorage.setItem(this.storageKey, data);
    } catch (error) {
      console.error('Error saving sessions:', error);
      // Handle storage quota exceeded
      if (error instanceof DOMException && error.code === 22) {
        this.handleStorageQuotaExceeded();
      }
    }
  }

  private isSessionExpired(session: EKYCSession): boolean {
    const now = Date.now();
    return (now - session.metadata.lastActivity) > this.config.sessionTimeout;
  }

  private cleanupExpiredSessions(): void {
    const sessions = this.getAllSessions();
    const activeSessions = sessions.filter(session => !this.isSessionExpired(session));
    
    if (activeSessions.length !== sessions.length) {
      this.saveSessions(activeSessions);
    }
  }

  private handleStorageQuotaExceeded(): void {
    // Remove oldest sessions to free up space
    const sessions = this.getAllSessions();
    sessions.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest 50% of sessions
    const keepCount = Math.floor(sessions.length / 2);
    const sessionsToKeep = sessions.slice(-keepCount);
    
    this.saveSessions(sessionsToKeep);
  }

  private getDeviceInfo(): any {
    return {
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  private validateSessionStructure(session: any): boolean {
    return (
      typeof session === 'object' &&
      typeof session.id === 'string' &&
      typeof session.timestamp === 'number' &&
      typeof session.documentType === 'string' &&
      typeof session.currentStep === 'number' &&
      typeof session.status === 'string' &&
      typeof session.data === 'object' &&
      typeof session.metadata === 'object'
    );
  }
}

// Create singleton instance
export const ekycStorage = new EKYCStorage();

// Utility functions for easy access
export function createEKYCSession(documentType: 'cccd' | 'passport' | 'driver' | 'qr'): string {
  return ekycStorage.createSession(documentType);
}

export function getEKYCSession(sessionId: string): EKYCSession | null {
  return ekycStorage.getSession(sessionId);
}

export function updateEKYCSession(sessionId: string, updates: Partial<EKYCSession>): boolean {
  return ekycStorage.updateSession(sessionId, updates);
}

export function updateEKYCSessionData(sessionId: string, data: Partial<EKYCSession['data']>): boolean {
  return ekycStorage.updateSessionData(sessionId, data);
}

export function completeEKYCSession(sessionId: string): boolean {
  return ekycStorage.completeSession(sessionId);
}

export function deleteEKYCSession(sessionId: string): boolean {
  return ekycStorage.deleteSession(sessionId);
}

// Data compression utilities
export function compressImageData(imageData: string): string {
  // Simple compression by reducing quality
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    return new Promise<string>((resolve) => {
      img.onload = () => {
        // Reduce size for storage
        const maxWidth = 800;
        const maxHeight = 600;
        
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress with lower quality
        const compressedData = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedData);
      };
      
      img.src = imageData;
    }) as any;
  } catch (error) {
    console.error('Image compression error:', error);
    return imageData; // Return original if compression fails
  }
}

// Data encryption utilities (basic implementation)
export function encryptData(data: string, key: string = 'vnpt_ekyc_key'): string {
  // Simple XOR encryption (not secure for production)
  let encrypted = '';
  for (let i = 0; i < data.length; i++) {
    encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted);
}

export function decryptData(encryptedData: string, key: string = 'vnpt_ekyc_key'): string {
  try {
    const data = atob(encryptedData);
    let decrypted = '';
    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

// Export utilities
export function exportEKYCData(sessionId: string, format: 'json' | 'csv' = 'json'): string | null {
  const session = ekycStorage.getSession(sessionId);
  if (!session) return null;

  if (format === 'json') {
    return ekycStorage.exportSession(sessionId);
  } else if (format === 'csv') {
    return convertSessionToCSV(session);
  }

  return null;
}

function convertSessionToCSV(session: EKYCSession): string {
  const headers = [
    'Session ID',
    'Document Type',
    'Status',
    'Current Step',
    'Start Time',
    'Last Activity',
    'ID Number',
    'Name',
    'Date of Birth',
    'Face Match Similarity',
    'Face Match Confidence'
  ];

  const values = [
    session.id,
    session.documentType,
    session.status,
    session.currentStep.toString(),
    new Date(session.metadata.startTime).toISOString(),
    new Date(session.metadata.lastActivity).toISOString(),
    session.data.documentInfo?.idNumber || '',
    session.data.documentInfo?.name || '',
    session.data.documentInfo?.dob || '',
    session.data.faceMatchResult?.similarity?.toString() || '',
    session.data.faceMatchResult?.confidence?.toString() || ''
  ];

  return headers.join(',') + '\n' + values.join(',');
}
