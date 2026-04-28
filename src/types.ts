export type ReportStatus = 'pending' | 'processing' | 'completed';
export type MediaType = 'image' | 'video' | 'none';

export interface Report {
  id: string;
  reporterName: string;
  reporterPhone: string;
  description: string;
  mediaUrl?: string;
  mediaType: MediaType;
  status: ReportStatus;
  priority?: string; // 'Urgent' | 'Tinggi' | 'Sedang' | 'Rendah'
  aiCategory?: string; // Infrastruktur, etc.
  aiSubCategory?: string;
  aiSentiment?: string; // 'Keluhan' | 'Saran' | 'Apresiasi' | 'Pertanyaan'
  tags?: string[];
  aiSummary?: string;
  category?: string; // Legacy
  categories?: string[];
  isPublic?: boolean;
  trackingInfo?: {
    fingerprint: string;
    userAgent: string;
  };
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  hasUnreadAdmin?: boolean;
  hasUnreadReporter?: boolean;
}
