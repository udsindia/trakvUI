import { Navigate } from "react-router-dom";

/** /applications/commissions, from before Commissions had its own sidebar entry. */
export function CommissionsRedirect() {
  return <Navigate replace to="/commissions" />;
}
