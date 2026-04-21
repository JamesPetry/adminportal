import type { PortalPayload, ProjectOverview } from "@/lib/types";

export function buildEmptyOverview(clientName: string): ProjectOverview {
  return {
    projectName: `${clientName} Website Redesign`,
    clientName,
    projectStatus: "Not Started",
    completionPercent: 0,
    estimatedCompletionDate: "TBD",
    lastUpdated: "Not yet updated",
    weeklySummary: "",
    nextActionRequired: "",
  };
}

export function buildEmptyPortalPayload(clientName: string): PortalPayload {
  return {
    overview: buildEmptyOverview(clientName),
    timeline: [],
    designs: [],
    invoices: [],
    feedback: [],
    files: [],
    projectDetails: {
      scopeSummary: "",
      includedItems: [],
      redesignGoals: [],
      keyContacts: [],
      stagingUrl: "",
      faq: [],
    },
    clientActions: [],
    includedRevisions: 2,
  };
}
