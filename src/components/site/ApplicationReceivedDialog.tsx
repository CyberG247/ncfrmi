import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import logo from "@/assets/ncfrmi-logo.png";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
  reference?: string;
  onContinue?: () => void;
  continueLabel?: string;
}

export default function ApplicationReceivedDialog({
  open,
  onOpenChange,
  title = "Application Acknowledged",
  message = "Your application has been received successfully. You will be notified regarding the progress of your application via email, SMS, and in-app notifications.",
  reference,
  onContinue,
  continueLabel = "Continue",
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-md p-4 sm:p-6">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="NCFRMI seal" className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow" />
          <div className="mt-2 font-display text-xs sm:text-sm font-bold uppercase tracking-wide text-primary">
            National Commission for Refugees, Migrants & IDPs
          </div>
          <div className="text-[11px] text-muted-foreground">Federal Republic of Nigeria</div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" /> Acknowledged
          </div>
        </div>
        <DialogHeader className="mt-2">
          <DialogTitle className="text-center font-display text-xl sm:text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base leading-relaxed">
            {message}
            {reference && (
              <span className="mt-3 block rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-2 font-mono text-sm text-primary">
                Reference: <strong>{reference}</strong>
              </span>
            )}
            <span className="mt-4 block text-xs italic text-muted-foreground">
              Issued under the leadership of the Hon. Federal Commissioner/CEO,
              National Commission for Refugees, Migrants and Internally Displaced Persons.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={() => { onContinue?.(); onOpenChange(false); }} size="lg" className="w-full sm:w-auto">
            {continueLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
