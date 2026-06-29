/**
 * Meta WhatsApp Embedded Signup launcher.
 *
 * Loads the Facebook JS SDK and opens Meta's hosted onboarding popup. The popup
 * returns a short-lived OAuth `code` (via FB.login) plus the chosen WABA /
 * phone-number ids (via a window `message` event). We hand all three to the
 * backend, which exchanges the code for a long-lived business token server-side.
 *
 * Requires two build-time env vars:
 *   VITE_META_APP_ID         — your Meta App ID
 *   VITE_META_WA_CONFIG_ID   — the Embedded Signup configuration id from the
 *                              App Dashboard → WhatsApp → Embedded Signup
 */

const APP_ID = import.meta.env.VITE_META_APP_ID as string | undefined;
const CONFIG_ID = import.meta.env.VITE_META_WA_CONFIG_ID as string | undefined;
const GRAPH_VERSION = "v19.0";

declare global {
  interface Window {
    // Facebook SDK globals — typed loosely; the SDK has no official ESM types.
    FB?: {
      init: (params: Record<string, unknown>) => void;
      login: (cb: (response: FbLoginResponse) => void, opts: Record<string, unknown>) => void;
    };
    fbAsyncInit?: () => void;
  }
}

interface FbLoginResponse {
  authResponse?: { code?: string };
  status?: string;
}

export interface EmbeddedSignupResult {
  code: string;
  wabaId?: string;
  phoneNumberId?: string;
}

let sdkPromise: Promise<void> | null = null;

/** True only when both env vars are present — gate the button on this. */
export function isEmbeddedSignupConfigured(): boolean {
  return !!APP_ID && !!CONFIG_ID;
}

function loadSdk(): Promise<void> {
  if (window.FB) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    if (!APP_ID) {
      reject(new Error("VITE_META_APP_ID is not set"));
      return;
    }
    window.fbAsyncInit = () => {
      window.FB!.init({
        appId: APP_ID,
        autoLogAppEvents: true,
        xfbml: false,
        version: GRAPH_VERSION,
      });
      resolve();
    };
    const id = "facebook-jssdk";
    if (document.getElementById(id)) return;
    const js = document.createElement("script");
    js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    js.async = true;
    js.defer = true;
    js.crossOrigin = "anonymous";
    js.onerror = () => reject(new Error("Failed to load the Facebook SDK"));
    document.body.appendChild(js);
  });
  return sdkPromise;
}

/**
 * Opens the Embedded Signup popup and resolves once the user finishes and a code
 * is returned. Rejects on cancel / error / missing config.
 */
export async function launchEmbeddedSignup(): Promise<EmbeddedSignupResult> {
  await loadSdk();
  if (!CONFIG_ID) throw new Error("VITE_META_WA_CONFIG_ID is not set");

  return new Promise<EmbeddedSignupResult>((resolve, reject) => {
    // Session info (waba_id / phone_number_id) arrives via postMessage, usually
    // just before the FB.login callback fires. Capture it in this closure.
    let session: { wabaId?: string; phoneNumberId?: string } = {};

    const messageHandler = (event: MessageEvent) => {
      if (!event.origin.endsWith("facebook.com")) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type !== "WA_EMBEDDED_SIGNUP") return;
        if (data.event === "FINISH") {
          session = {
            wabaId: data.data?.waba_id,
            phoneNumberId: data.data?.phone_number_id,
          };
        } else if (data.event === "CANCEL" || data.event === "ERROR") {
          cleanup();
          reject(new Error(data.data?.error_message ?? "WhatsApp signup was cancelled"));
        }
      } catch {
        // Non-JSON messages are normal noise from the FB iframe — ignore.
      }
    };

    const cleanup = () => window.removeEventListener("message", messageHandler);
    window.addEventListener("message", messageHandler);

    window.FB!.login(
      (response) => {
        cleanup();
        const code = response?.authResponse?.code;
        if (code) {
          resolve({ code, wabaId: session.wabaId, phoneNumberId: session.phoneNumberId });
        } else {
          reject(new Error("WhatsApp signup was not completed"));
        }
      },
      {
        config_id: CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
      },
    );
  });
}
