export type LeadStatus = 'New' | 'Reviewed' | 'Contacted' | 'Invalid';
export type DataConfidence = 'High' | 'Medium' | 'Low';
export type EmailStatus = 'Validated' | 'Guessed' | 'Tested';

export interface CallAnalysis {
  callScore: number; // 0-100
  scriptAdherence: number; // 0-100 %
  confidence: 'High' | 'Medium' | 'Low';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  keyTakeaways?: string[];
}

export interface CallLog {
  id: string;
  timestamp: string;
  outcome: string; // e.g. "No Answer", "Appointment Set", etc.
  notes?: string;
  recordingUrl?: string; // Blob URL for the audio recording
  recordingStatus?: 'Uploaded' | 'Pending' | 'Local';
  appointmentDate?: string; // ISO string if appointment was set
  analysis?: CallAnalysis;
}

export interface Lead {
  id: string;
  name: string;
  category: string;
  address: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  emailStatus?: EmailStatus;
  ceo: string | null;
  companyDescription?: string;
  status: LeadStatus;
  confidence: DataConfidence;
  leadScore?: number; // 0-100 quality score
  sourceUrl: string | null;
  notes: string;
  rating?: number;
  reviewCount?: number;
  isEnriching?: boolean;
  callLogs?: CallLog[];
  lastCallResult?: string;
  appointmentDate?: string; // The date of the upcoming appointment
}

export interface Project {
  id: string;
  name: string;
  industry: string;
  location: string;
  radius: number;
  filters: {
    minRating: number;
    minReviews: number;
    mustHaveWebsite: boolean;
  };
  leads: Lead[];
  status: 'Draft' | 'Fetching' | 'Enriching' | 'Completed';
  createdAt: string;
  limit?: number;
}

export type PipelineStage = 'Cold' | 'Qualified' | 'Proposal' | 'Closing' | 'Closed';

export interface ContactList {
  id: string;
  name: string;
  createdAt: string;
  leads: Lead[];
  stage?: PipelineStage;
}

export interface SearchParams {
  industry: string;
  location: string;
  radius: number;
  minRating: number;
  minReviews: number;
  mustHaveWebsite: boolean;
  limit: number;
}

export interface Script {
  id: string;
  name: string;
  content: string; // HTML content
  category?: string; // e.g. "Gatekeeper", "Pitch", "Follow-up"
  isDefault?: boolean;
  themeColor?: 'blue' | 'green' | 'purple' | 'amber' | 'slate';
}