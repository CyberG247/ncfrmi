import Layout from "@/components/site/Layout";
import PageHero from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn } from "lucide-react";
import organogramImg from "@/assets/ncfrmi-organogram.png";
import Reveal from "@/components/site/Reveal";

export default function Organogram() {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = organogramImg;
    link.download = "NCFRMI-Organogram.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <PageHero
        eyebrow="Structure"
        title="Organogram"
        description="The statutory administrative and operational structure of the National Commission for Refugees, Migrants and Internally Displaced Persons."
      />

      <section className="container-page py-16">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <Reveal>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="font-display text-2xl font-bold">Organizational Chart</h2>
                <p className="text-xs text-muted-foreground mt-1">Official structure of NCFRMI directorates, divisions, and advisory units.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => window.open(organogramImg, "_blank")} className="hover-lift">
                  <ZoomIn className="mr-2 h-4 w-4" /> View Fullscreen
                </Button>
                <Button size="sm" onClick={handleDownload} className="bg-primary hover:bg-primary/95 hover-lift">
                  <Download className="mr-2 h-4 w-4" /> Download Chart
                </Button>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100} variant="scale">
            <Card className="overflow-hidden border border-border shadow-elegant">
              <CardContent className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/40 flex justify-center">
                <div className="relative w-full overflow-x-auto rounded-lg border bg-white p-2 sm:p-4">
                  <img
                    src={organogramImg}
                    alt="NCFRMI Official Organogram Chart"
                    className="w-full min-w-[768px] h-auto object-contain mx-auto"
                  />
                </div>
              </CardContent>
            </Card>
          </Reveal>
          
        </div>
      </section>
    </Layout>
  );
}
