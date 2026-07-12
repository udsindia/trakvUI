import { useQuery } from "@tanstack/react-query";
import {
  universitiesCatalogQueryKey,
  universitiesCatalogService,
} from "@/modules/universities/universitiesCatalogService";

export function useUniversitiesCatalog() {
  return useQuery({
    queryKey: universitiesCatalogQueryKey,
    queryFn: () => universitiesCatalogService.getCatalog(),
  });
}
