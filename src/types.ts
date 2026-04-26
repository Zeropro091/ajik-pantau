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
  isPublic?: boolean;
  trackingInfo?: {
    fingerprint: string;
    userAgent: string;
  };
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
