import { useState } from "react";
import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, FileText, Search, BookOpen, Scale, Landmark } from "lucide-react";
import Reveal from "@/components/site/Reveal";
import { toast } from "sonner";

const resourcesData = [
  {
    title: "NCFRMI Constituency/Zonal Projects",
    description: "Official documentation and implementation status report on the Commission's constituency and zonal development interventions across Nigeria.",
    category: "Publications",
    size: "3.5 MB",
    type: "PDF",
    icon: Landmark
  },
  {
    title: "Standard Bidding Document Procurement of Works",
    description: "Standard procurement templates and guidelines for contractors bidding on Resettlement Cities and civil infrastructure works.",
    category: "Procurement",
    size: "2.1 MB",
    type: "PDF",
    icon: FileText
  },
  {
    title: "Standard Bidding Document Procurement of Goods",
    description: "Procurement regulations and bidding templates for the supply of humanitarian relief materials, logistics equipment, and office commodities.",
    category: "Procurement",
    size: "1.9 MB",
    type: "PDF",
    icon: FileText
  },
  {
    title: "NCFRMI Act of 2022 (Amendment)",
    description: "The primary statutory legislation governing the mandate, departments, and authority of the National Commission for Refugees, Migrants and Internally Displaced Persons.",
    category: "Legislation",
    size: "2.4 MB",
    type: "PDF",
    icon: Scale
  },
  {
    title: "National Migration Policy Document",
    description: "Nigeria's official policy guidelines defining migration management protocols, counter-smuggling efforts, and diaspora integration frameworks.",
    category: "Policy",
    size: "4.8 MB",
    type: "PDF",
    icon: Landmark
  },
  {
    title: "Refugee Status Application Guidelines",
    description: "A step-by-step handbook detailing the legal requirements, required evidence, and processes to apply for asylum/refugee status determination (RSD).",
    category: "Manual",
    size: "1.2 MB",
    type: "PDF",
    icon: FileText
  },
  {
    title: "Annual Humanitarian Response Report 2025",
    description: "A comprehensive publication reporting on budget allocation, camp densities, food distributions, and vocational graduates assisted by NCFRMI in 2025.",
    category: "Report",
    size: "8.1 MB",
    type: "PDF",
    icon: BookOpen
  },
  {
    title: "OAU Convention Governing Refugee Problems in Africa (1969)",
    description: "Regional treaty governing refugee definitions, asylum rights, and non-refoulement principles across member states, ratified by Nigeria.",
    category: "International Treaty",
    size: "1.8 MB",
    type: "PDF",
    icon: Scale
  },
  {
    title: "African Union (Kampala) Convention on IDPs",
    description: "The official convention governing the protection, assistance, and rehabilitation of internally displaced persons (IDPs), ratified by the Federal Republic of Nigeria.",
    category: "International Treaty",
    size: "3.2 MB",
    type: "PDF",
    icon: Scale
  }
];

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResources = resourcesData.filter((res) =>
    res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (title: string) => {
    toast.success(`Starting download: ${title}`);
  };

  return (
    <Layout>
      <PageHero
        eyebrow="Resources"
        title="Acts, Policies &amp; Publications"
        description="Access and download official legislation, national policies, handbook manuals, and annual humanitarian reports published by the Commission."
      />

      <section className="container-page py-16">
        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-10 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search acts, policies, reports..."
              className="pl-9 h-10 border-border bg-card text-foreground rounded-md text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="h-10 text-xs px-4">
            Search
          </Button>
        </div>

        {/* Resources Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((res, idx) => {
            const Icon = res.icon;
            return (
              <Reveal key={res.title} delay={idx * 60} variant="scale">
                <Card className="h-full border-border/80 bg-card hover-lift hover-glow flex flex-col justify-between">
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Badge className="bg-primary/10 text-primary border-transparent font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5">
                          {res.category}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                          <span>{res.type}</span>
                          <span>•</span>
                          <span>{res.size}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start pt-2">
                        <div className="rounded-lg bg-muted/65 p-2 text-foreground/80 flex-shrink-0 mt-0.5">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-display font-extrabold text-sm text-foreground leading-snug">{res.title}</h3>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">{res.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t">
                      <Button
                        onClick={() => handleDownload(res.title)}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs hover-lift h-9 font-bold bg-muted/30 border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                      >
                        <Download className="mr-2 h-3.5 w-3.5" /> Download Publication
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}

          {filteredResources.length === 0 && (
            <div className="col-span-full text-center py-12">
              <span className="text-sm text-muted-foreground">No resources matching your search terms.</span>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
