import { httpClient } from "@/shared/services/http/client";

/**
 * Password recovery / account-setup API.
 *
 * Both the onboarding "set up your password" link and the "forgot password" flow land
 * on /reset-password?token=… and call resetPassword(). forgotPassword() always resolves
 * for a valid request — the backend returns a neutral message whether or not the email
 * exists, so we never reveal which addresses are registered.
 */
export const passwordApi = {
  async forgotPassword(email: string): Promise<void> {
    await httpClient.post("/auth/forgot-password", { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await httpClient.post("/auth/reset-password", { token, newPassword });
  },
};
