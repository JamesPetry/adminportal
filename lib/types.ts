export type ProjectStatus = "Not Started" | "In Progress" | "Under Review" | "Complete";
export type UserRole = "admin" | "client";
export type InvitationStatus = "invited" | "active";

export type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Upcoming";

export type ConceptStatus = "Draft" | "Ready for Review" | "Approved" | "Needs Feedback";

export type FeedbackStatus = "Open" | "In Review" | "Implemented" | "Closed";

export interface ProjectOverview {
  projectName: string;
  clientName: string;
  projectStatus: ProjectStatus;
  completionPercent: number;
  estimatedCompletionDate: string;
  lastUpdated: string;
  weeklySummary: string;
  nextActionRequired: string;
}

export interface WeekTimeline {
  id: string;
  weekLabel: string;
  title: string;
  status: ProjectStatus;
  progress: number;
  dateRange: string;
  startDate?: string | null;
  endDate?: string | null;
  weekColor?: "sand" | "rose" | "mint" | "sky" | "lavender";
  checklist: Array<{ id: string; label: string; completed: boolean }>;
  notes: string;
  details: string;
  linkedAssets?: string[];
  imagePath?: string;
  imageUrl?: string;
}

export interface DesignConceptDetail {
  heroNotes: string;
  layoutRationale: string;
  typographyRationale: string;
  colorNotes: string;
  uxNotes: string;
  mobileConsiderations: string;
  fitReason: string;
}

export interface DesignConcept {
  id: string;
  title: string;
  version: "V1" | "V2" | "V3";
  status: ConceptStatus;
  shortDescription: string;
  thumbnailLabel: string;
  heroImagePath?: string;
  heroImageUrl?: string;
  details: DesignConceptDetail;
}

export interface InvoiceItem {
  id: string;
  title: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
}

export interface FeedbackItem {
  id: string;
  author: string;
  role: "Client" | "Designer" | "Project Lead";
  createdAt: string;
  conceptTag: string;
  pageTag: string;
  status: FeedbackStatus;
  comment: string;
}

export interface PortalFile {
  id: string;
  fileName: string;
  category: "Brand Assets" | "Wireframes" | "Design Exports" | "Content Docs" | "Final Deliverables";
  uploadedAt: string;
  fileType: string;
}

export interface ProjectDetails {
  scopeSummary: string;
  includedItems: string[];
  redesignGoals: string[];
  keyContacts: Array<{ name: string; role: string; email: string }>;
  stagingUrl: string;
  proposalSections?: Array<{
    id: string;
    title: string;
    body: string;
    imagePath?: string;
    imageUrl?: string;
  }>;
  faq: Array<{ question: string; answer: string }>;
}

export interface ClientActionItem {
  id: string;
  title: string;
  category: "Approval" | "Content Needed" | "Decision Needed" | "Finance";
  dueDate: string;
  blocker?: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  slug: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  slug: string;
  clientName: string;
  businessSignatoryName?: string | null;
  status: ProjectStatus;
  completionPercent: number;
  estimatedCompletionDate: string | null;
  lastUpdated: string;
  weeklySummary: string;
  nextActionRequired: string;
}

export interface UserContext {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  client: ClientRecord | null;
}

export interface ViewerContext {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  email: string;
  role: UserRole;
  invitationStatus: InvitationStatus;
}

export interface PortalPayload {
  overview: ProjectOverview;
  timeline: WeekTimeline[];
  designs: DesignConcept[];
  invoices: InvoiceItem[]; // legacy cards (still used for dashboard summary)
  feedback: FeedbackItem[];
  files: PortalFile[]; // legacy cards (canonical files come from project_files table)
  projectDetails: ProjectDetails;
  clientActions: ClientActionItem[];
  includedRevisions: number;
}

export type CalendarEventKind =
  | "invoice_issue"
  | "invoice_due"
  | "timeline"
  | "client_action"
  | "manual";

export type CalendarEventColorToken = "finance" | "timeline" | "approvals" | "custom";
export type CalendarEntryType = "image" | "invoice" | "agreement" | "note" | "file";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string | null;
  kind: CalendarEventKind;
  sourceRef: string;
  colorToken: CalendarEventColorToken;
  status?: string | null;
  entryType?: CalendarEntryType;
  notes?: string | null;
  downloadUrl?: string | null;
  linkedFileName?: string | null;
  previewUrl?: string | null;
  createdBy?: string | null;
}

export interface CalendarEventRecord {
  id: string;
  projectId: string;
  title: string;
  startDate: string;
  endDate: string | null;
  colorToken: CalendarEventColorToken;
  notes: string | null;
  entryType: CalendarEntryType;
  invoiceId?: string | null;
  agreementId?: string | null;
  projectFileId?: string | null;
  storagePath?: string | null;
  sourceRef?: string | null;
  createdBy?: string | null;
}

export interface ProjectFileRecord {
  id: string;
  projectId: string;
  category: string;
  fileName: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

export type AgreementStatus =
  | "draft"
  | "sent"
  | "pending_client_signature"
  | "pending_admin_signature"
  | "fully_signed";
export type AgreementWorkflowState = "pending_review" | "actioned";

export interface AgreementRecord {
  id: string;
  projectId: string;
  title: string;
  status: AgreementStatus;
  workflowState: AgreementWorkflowState;
  content: string;
  clientSigName: string | null;
  clientSignedAt: string | null;
  adminSigName: string | null;
  adminSignedAt: string | null;
  sentAt: string | null;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoicePaymentDetails {
  name: string;
  abn: string;
  payId: string;
  reference: string;
  amount: number;
}

export interface InvoiceRecord {
  id: string;
  projectId: string;
  invoiceNumber: string;
  title: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  taxEnabled: boolean;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  paymentDetails: InvoicePaymentDetails;
  lineItems: InvoiceLineItem[];
}
