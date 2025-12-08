export enum Screen {
  DASHBOARD = 'DASHBOARD',
  CLAIM_DETAIL = 'CLAIM_DETAIL',
  API_DOCS = 'API_DOCS',
  FEATURES = 'FEATURES',
  ACCOUNT_SETTINGS = 'ACCOUNT_SETTINGS',
  COMPLIANCE = 'COMPLIANCE',
  TRAINING = 'TRAINING',
}

export enum ClaimStatus {
  NEW_FROM_MYARK = 'New from MyARK',
  READY_TO_SYNC = 'Ready to Sync',
  SYNCED_TO_CMS = 'Synced to CMS',
  FLAGGED_FOR_REVIEW = 'Flagged for Review',
}

export enum AssetStatus {
  VERIFIED = 'Verified',
  PENDING = 'Pending',
  FLAGGED = 'Flagged',
  UNVERIFIED = 'Unverified',
  DENIED = 'Denied',
  APPROVED = 'Approved',
}

export enum FraudRiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  UNKNOWN = 'Unknown',
}

export type AssetOrigin = 'PRE_LOSS' | 'POST_LOSS';

export interface FraudAnalysis {
  riskLevel: FraudRiskLevel;
  reason: string;
}

export interface MarketValueSource {
  title: string;
  uri: string;
}

export interface MarketValueAnalysis {
  estimatedValue: number;
  currency: string;
  reasoning: string;
  sources: MarketValueSource[];
}

export interface ImageAnalysis {
  isConsistent: boolean;
  discrepancies: string[];
  visualCondition: string;
}

export interface ReceiptMatch {
  assetId: string;
  receiptItemName: string;
  receiptPrice: number;
  receiptDate: string;
  confidence: number;
}

export interface LKQAnalysis {
  originalSpecs: string;
  modernModel: string;
  modernPrice: number;
  reasoning: string;
  savings: number;
}

export interface WeatherAnalysis {
  isEventVerified: boolean;
  conditions: string;
  temperature?: string;
  reasoning: string;
}

export interface DuplicateAnalysis {
  hasDuplicates: boolean;
  duplicateGroups: { itemIds: string[], reason: string }[];
}

export interface BundleComponent {
  name: string;
  estimatedValue: number;
}

export interface BundleAnalysis {
  isBundle: boolean;
  components: BundleComponent[];
  reasoning: string;
}

export interface PolicyCheck {
  isExcluded: boolean;
  exclusionCategory?: string; // e.g., "Motorized Vehicle", "Business Property"
  warningMessage: string;
}

export interface DepreciationAnalysis {
  lifeExpectancyYears: number;
  ageYears: number;
  depreciationPct: number;
  actualCashValue: number; // ACV
  reasoning: string;
}

export interface CategoryAnalysis {
  isCorrect: boolean;
  suggestedCategory: string;
  reasoning: string;
}

export interface SpecialtyAnalysis {
  isSpecialty: boolean;
  reasoning: string;
  recommendation: string; // e.g. "Refer to Fine Art Appraiser"
}

export interface NegotiationScript {
  script: string;
  tone: string;
}

export interface SubrogationAnalysis {
  potentialLiability: boolean;
  liableParty?: string; // Manufacturer, Contractor, etc.
  reasoning: string;
  suggestedAction: string;
}

export interface PaddingAnalysis {
  isPadded: boolean;
  fluffScore: number; // 0-100
  lowValueCount: number;
  suspiciousCategories: string[];
  reasoning: string;
}

export interface StateRegulation {
  state: string;
  regulationName: string;
  summary: string;
  complianceStatus: 'Compliant' | 'At Risk' | 'Non-Compliant';
  lastUpdated: string;
}

export interface FilingReport {
  filingId: string;
  state: string;
  generatedDate: string;
  content: string;
  status: 'Draft' | 'Filed';
}

export interface RegulatoryCheck {
  state: string;
  status: 'Compliant' | 'At Risk' | 'Non-Compliant';
  message: string;
  deadline?: string;
}

export interface ExifData {
  dateTaken: string;
  gpsLocation?: string;
  deviceModel?: string;
  isMetadataConsistent: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  hash?: string; // Mock cryptographic hash for "Immutability"
}

// --- NEW TYPES FOR WOW FEATURES ---

export interface LiveFNOLTranscriptEntry {
  speaker: 'AI' | 'Policyholder' | 'Adjuster';
  text: string;
}

export interface LiveFNOLIntelligenceCard {
  type: 'alert' | 'info' | 'action';
  text: string;
}

export interface LiveFNOLAnalysis {
  status: 'idle' | 'active' | 'complete';
  transcript: LiveFNOLTranscriptEntry[];
  summary?: string;
  extractedEntities?: { type: string; value: string }[];
  intelligenceCards?: LiveFNOLIntelligenceCard[];
}

export interface DigitalFieldAdjusterAnalysis {
  objectIdentified: string;
  damageType: string;
  severityScore: number; // Out of 10
  repairabilityIndex: number; // Out of 100
  recommendation: 'Repair' | 'Replace';
  costEstimate: { min: number; max: number };
  reasoning: string;
  suggestedActionPlan: { item: string; cost: number }[];
}

// --- NEW TYPES FOR CORE SYSTEM FEATURES ---

export interface MyArkPreLossMetadata {
  preLossItemCount: number;
  preLossTotalValue: number;
  documentedPhotosCount: number;
  vaultId: string;
  lastUpdated: string;
}

export interface MyArkFastTrackResult {
  riskScore: number; // 0-100
  verdict: 'low-risk' | 'medium-risk' | 'high-risk';
  summary: string;
  discrepancies: { item: string; issue: string; severity: 'low' | 'high' }[];
  recommendations: string[];
}

export interface ClaimActivity {
  id: string;
  title: string;
  dueDate: string;
  assignee: string;
  status: 'Open' | 'Completed';
}

export interface ClaimNote {
  id: string;
  timestamp: string;
  author: string;
  content: string;
  type: 'log' | 'email' | 'sms';
}

export interface ClaimDocument {
  id: string;
  name: string;
  type: 'PDF' | 'Image' | 'Word' | 'Other';
  uploadedDate: string;
  size: string;
}

export interface Financials {
  reserves: number;
  paymentsMade: number;
  totalIncurred: number;
}

export interface ClaimPayment {
  id: string;
  amount: number;
  payee: string;
  method: 'ACH' | 'Virtual Card' | 'Check';
  date: string;
  status: 'Sent' | 'Processing' | 'Cleared';
}

export interface GeneratedLetter {
  id: string;
  assetId: string;
  type: 'Denial' | 'ROR';
  content: string;
  date: string;
}

export interface ClaimSummary {
  summary: string;
  redFlags: string[];
  suggestedActions: { title: string; reasoning: string }[];
}

export interface PlaybookStep {
  id: string;
  label: string;
  description: string;
  required: boolean;
  completed: boolean;
}

export interface ClaimHealthCheckResult {
  score: number; // 0-100
  criticalMissingFields: string[];
  warnings: string[];
  readyForExport: boolean;
}

export interface ArkiveManifest {
  id: string;
  createdDate: string;
  assets: Asset[];
  totalEstimatedRecovery: number;
  pickupLocation: string;
  status: 'Draft' | 'Sent_to_Auction' | 'Sold';
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  claimedValue: number;
  purchaseDate: string;
  status: AssetStatus;
  imageUrl: string;
  damageImageUrl?: string; // For Digital Field Adjuster
  videoUrl?: string; // For Digital Field Adjuster
  origin: AssetOrigin; // Pre-loss or Post-loss
  serialNumber?: string;
  exifData?: ExifData;
  fraudAnalysis?: FraudAnalysis;
  marketValueAnalysis?: MarketValueAnalysis;
  imageAnalysis?: ImageAnalysis;
  receiptMatch?: ReceiptMatch;
  lkqAnalysis?: LKQAnalysis;
  linkedDocuments?: string[];
  bundleAnalysis?: BundleAnalysis;
  policyCheck?: PolicyCheck;
  depreciationAnalysis?: DepreciationAnalysis;
  categoryAnalysis?: CategoryAnalysis;
  specialtyAnalysis?: SpecialtyAnalysis;
  negotiationScript?: NegotiationScript;
  subrogationAnalysis?: SubrogationAnalysis;
  digitalFieldAdjusterAnalysis?: DigitalFieldAdjusterAnalysis; // New
  // Salvage / Arkive Fields
  salvageDisposition?: 'Sold' | 'Scrap' | 'Hold' | 'Donate' | null;
  salvageNotes?: string;
  salvageEstimatedRecovery?: number;
}

export interface Claim {
  id: string;
  policyholderName: string;
  policyNumber: string;
  policyStartDate: string;
  coverageLimit: number;
  deductible: number;
  claimDate: string;
  location: string;
  status: ClaimStatus;
  totalClaimedValue: number;
  touchTime: number; // Total time spent in milliseconds (Efficiency Metric)
  auditTrail: AuditLogEntry[]; // Security Log
  assets: Asset[];
  paddingAnalysis?: PaddingAnalysis;
  liveFNOLAnalysis?: LiveFNOLAnalysis; // New
  claimSummary?: ClaimSummary; // New for AI Briefing
  suggestedActivities?: ClaimActivity[]; // New for AI Action Plan
  // NEW Guidewire-like features
  activities?: ClaimActivity[];
  notes?: ClaimNote[];
  documents?: ClaimDocument[];
  financials?: Financials;
  preLossMetadata?: MyArkPreLossMetadata; // New for MyARK Intake
  myArkFastTrackResult?: MyArkFastTrackResult; // New for MyARK Fast-Track
  currentPlaybookStepId?: string;
  payments?: ClaimPayment[];
  generatedLetters?: GeneratedLetter[];
}

export interface SettlementReport {
  grossRCV: number;
  totalDepreciation: number;
  deductible: number;
  netPayment: number;
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}