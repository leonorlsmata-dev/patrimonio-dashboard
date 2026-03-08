import { PageHeader } from "@/components/layout/page-header";
import { PatrimonySummary } from "@/components/dashboard/patrimony-summary";
import { AllocationPie } from "@/components/dashboard/allocation-pie";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { HistoricalChart } from "@/components/dashboard/historical-chart";

export default function Home() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral do teu património"
      />
      <div className="space-y-6">
        <PatrimonySummary />
        <div className="grid gap-6 md:grid-cols-2">
          <AllocationPie />
          <QuickActions />
        </div>
        <HistoricalChart />
      </div>
    </div>
  );
}
