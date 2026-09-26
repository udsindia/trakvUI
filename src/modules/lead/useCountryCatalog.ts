import { useQuery } from "@tanstack/react-query";
import { leadApi } from "@/modules/lead/leadApi";

/**
 * The countries a lead may be saved with.
 *
 * The list is the same for every tenant and changes only when the backend does, so it is
 * cached for the session rather than refetched per page. Falls back to whatever static
 * options the caller already had if the request fails — a picker with four countries is a
 * poor experience, but an empty one blocks the form entirely.
 */
export function useCountryCatalog() {
  return useQuery({
    queryKey: ["countries", "catalog"],
    queryFn: leadApi.getCountryCatalog,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
