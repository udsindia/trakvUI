import { useParams } from "react-router-dom";
import { SaUniversityDetailPage } from "@/modules/sa-team/pages/SaUniversitiesPage";

export function SaUniversityDetailRoutePage() {
  const { universityId } = useParams<{ universityId: string }>();

  if (!universityId) {
    return null;
  }

  return <SaUniversityDetailPage universityId={universityId} />;
}
