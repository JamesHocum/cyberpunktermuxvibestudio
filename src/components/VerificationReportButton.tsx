import { FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { downloadVerificationPDF, type VerificationInput } from "@/lib/verificationReport";

interface Props {
  input: VerificationInput;
  size?: "sm" | "icon";
}

/**
 * Per-message export button. Generates a deterministic PDF audit
 * (consensus, trust score, hallucination risk, governance stream).
 */
export const VerificationReportButton = ({ input, size = "sm" }: Props) => {
  const handle = () => {
    try {
      downloadVerificationPDF(input);
      toast.success("Verification report generated");
    } catch (e: any) {
      toast.error(`Report failed: ${e?.message ?? "unknown"}`);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size === "icon" ? "icon" : "sm"}
      className="h-6 px-2 neon-purple hover:neon-glow"
      onClick={handle}
      title="Export verification PDF (consensus · trust · hallucination · governance)"
    >
      <FileCheck2 className="h-3 w-3" />
      {size === "sm" && <span className="ml-1 text-[10px] font-terminal">VERIFY</span>}
    </Button>
  );
};

export default VerificationReportButton;
