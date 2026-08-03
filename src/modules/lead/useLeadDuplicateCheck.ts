import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { BackendLead } from "@/modules/lead/leadApi";
import { leadService } from "@/modules/lead/leadService";
import type { LeadFormValues } from "@/modules/lead/leadForm.types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strip country code + grouping to the national digits the backend stores/matches on. */
function nationalPhone(phone: string): string {
  const clean = (phone ?? "").replace(/\s/g, "");
  const match = clean.match(/^(\+\d{1,3})(.+)$/);
  return (match?.[2] ?? clean).replace(/\D/g, "");
}

/**
 * Watches the lead form's email + phone and asks the backend whether a matching
 * (non-archived) lead already exists in the tenant. Debounced so we don't fire on
 * every keystroke. Non-blocking: it surfaces matches; the caller decides what to do.
 */
export function useLeadDuplicateCheck(form: UseFormReturn<LeadFormValues>) {
  const email = form.watch("email");
  const phone = form.watch("phone");
  const [matches, setMatches] = useState<BackendLead[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const trimmedEmail = (email ?? "").trim();
    const natPhone = nationalPhone(phone ?? "");
    const emailUsable = EMAIL_RE.test(trimmedEmail);
    const phoneUsable = natPhone.length >= 7;

    if (!emailUsable && !phoneUsable) {
      setMatches([]);
      setIsChecking(false);
      return;
    }

    let cancelled = false;
    setIsChecking(true);
    const timer = setTimeout(async () => {
      try {
        const result = await leadService.checkDuplicate({
          email: emailUsable ? trimmedEmail : undefined,
          phone: phoneUsable ? natPhone : undefined,
        });
        if (!cancelled) setMatches(result.isDuplicate ? result.matches : []);
      } catch {
        if (!cancelled) setMatches([]);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [email, phone]);

  return { matches, isDuplicate: matches.length > 0, isChecking };
}
