import { CalendarViewLoader } from "@/components/calendar/calendar-view-loader";
import { PageShell } from "@/components/layout/page-shell";
import {
  getAgreementsByProjectId,
  getCalendarEventsByProjectId,
  getClientPortalView,
  getInvoicesByProjectId,
} from "@/lib/portal/server";

export const metadata = {
  title: "Calendar | Strat X Advisory Portal",
};

export default async function CalendarPage() {
  const { project, context } = await getClientPortalView();
  const [events, invoices, agreements] = await Promise.all([
    getCalendarEventsByProjectId(project.id),
    getInvoicesByProjectId(project.id),
    getAgreementsByProjectId(project.id),
  ]);
  const now = new Date();

  return (
    <PageShell title="Calendar">
      <CalendarViewLoader
        events={events}
        invoices={invoices.map((invoice) => ({ id: invoice.id, label: `${invoice.invoiceNumber} - ${invoice.title}` }))}
        agreements={agreements.map((agreement) => ({ id: agreement.id, label: agreement.title }))}
        viewerRole={context.role}
        viewerUserId={context.userId}
        projectId={project.id}
        year={now.getFullYear()}
        month={now.getMonth()}
      />
    </PageShell>
  );
}
