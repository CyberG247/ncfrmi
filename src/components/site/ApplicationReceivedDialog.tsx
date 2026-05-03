import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import logo from "@/assets/ncfrmi-logo.png";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
  onContinue?: () => void;
  continueLabel?: string;
}

export default function ApplicationReceivedDialog({
  open,
  onOpenChange,
  title = "Application Received",
  message = "Your application has been received successfully. You will be notified regarding the progress of your application via email, SMS, and in-app notifications.",
  onContinue,
  continueLabel = "Continue",
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="NCFRMI" className="h-16 w-16 object-contain" />
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" /> NCFRMI
          </div>
        </div>
        <DialogHeader className="mt-2">
          <DialogTitle className="text-center font-display text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-center text-base leading-relaxed">
            {message}
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
