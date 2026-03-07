import { PageHeader } from "@/components/layout/page-header";

export default function Home() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral do teu património"
      />
      <p className="text-muted-foreground">
        Dashboard em construção — os componentes serão adicionados em breve.
      </p>
    </div>
  );
}
