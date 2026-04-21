export type ProjectStatus = "Not Started" | "In Progress" | "Under Review" | "Complete";
export type UserRole = "admin" | "client";

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
  checklist: string[];
  notes: string;
  details: string;
  linkedAssets?: string[];
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

export interface UserContext {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  client: ClientRecord | null;
}

export interface PortalPayload {
  overview: ProjectOverview;
  timeline: WeekTimeline[];
  designs: DesignConcept[];
  invoices: InvoiceItem[];
  feedback: FeedbackItem[];
  files: PortalFile[];
  projectDetails: ProjectDetails;
  clientActions: ClientActionItem[];
  includedRevisions: number;
}
