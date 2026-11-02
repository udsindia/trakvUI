/**
 * Meta WhatsApp Embedded Signup launcher.
 *
 * Loads the Facebook JS SDK and opens Meta's hosted onboarding popup. The popup
 * returns a short-lived OAuth `code` (via FB.login) plus the chosen WABA /
 * phone-number ids (via a window `message` event). We hand all three to the
 * backend, which exchanges the code for a long-lived business token server-side.
 *
 * Needs the Meta App ID and the Embedded Signup configuration id. Callers pass the
 * ones the backend serves (GET /whatsapp/embedded-signup/settings), so setting them on
 * the backend is enough; the build-time env vars are only a fallback:
 *   VITE_META_APP_ID         — your Meta App ID
 *   VITE_META_WA_CONFIG_ID   — the Embedded Signup configuration id from the
 *                              App Dashboard → Facebook Login for Business → Configurations
 */

const ENV_APP_ID = import.meta.env.VITE_META_APP_ID as string | undefined;
const ENV_CONFIG_ID = import.meta.env.VITE_META_WA_CONFIG_ID as string | undefined;
// Kept in step with whatsapp.meta.graph-api-base-url on the backend.
const GRAPH_VERSION = "v24.0";

/** The two ids, as served by the backend; either may be missing. */
export interface EmbeddedSignupIds {
  appId?: string | null;
  configId?: string | null;
}

function resolveIds(ids?: EmbeddedSignupIds) {
  return {
    appId: ids?.appId || ENV_APP_ID,
    configId: ids?.configId || ENV_CONFIG_ID,
  };
}

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

/** True only when both ids are known (passed in, or from the env) — gate the button on this. */
export function isEmbeddedSignupConfigured(ids?: EmbeddedSignupIds): boolean {
  const { appId, configId } = resolveIds(ids);
  return !!appId && !!configId;
}

function loadSdk(appId: string | undefined): Promise<void> {
  if (window.FB) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    if (!appId) {
      sdkPromise = null;
      reject(new Error("The Meta App ID is not set"));
      return;
    }
    window.fbAsyncInit = () => {
      window.FB!.init({
        appId,
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

/** What VUTrak already knows about the agency, filled into Meta's form for it. */
export interface EmbeddedSignupPrefill {
  businessName?: string;
  email?: string;
}

/** How long to wait for the second half of the result once the first has arrived. */
const SESSION_WAIT_MS = 15_000;
/** Grace after the popup closes, for a login callback already on its way. */
const CLOSE_GRACE_MS = 1_500;

/**
 * Opens the Embedded Signup popup and resolves once the user finishes.
 *
 * Meta answers in two parts that arrive in either order: the `code` through the FB.login
 * callback, and the chosen account and number through a `WA_EMBEDDED_SIGNUP` message.
 * Resolving on the first of them — as this used to — sent the backend a code with no
 * number whenever the message came second. So both are awaited, as Meta's sample app does.
 *
 * Rejects when the person cancels or closes the popup part-way, when Meta reports an
 * error, or when the second half never comes.
 */
export async function launchEmbeddedSignup(
  ids?: EmbeddedSignupIds,
  prefill?: EmbeddedSignupPrefill,
): Promise<EmbeddedSignupResult> {
  const { appId, configId } = resolveIds(ids);
  await loadSdk(appId);
  if (!configId) throw new Error("The Embedded Signup configuration id is not set");

  return new Promise<EmbeddedSignupResult>((resolve, reject) => {
    let code: string | undefined;
    let session: { wabaId?: string; phoneNumberId?: string } | undefined;
    let settled = false;
    let popup: Window | null = null;
    let sessionTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    const originalOpen = window.open;

    const cleanup = () => {
      settled = true;
      window.removeEventListener("message", messageHandler);
      clearInterval(pollTimer);
      clearTimeout(sessionTimer);
      clearTimeout(closeTimer);
      if (window.open !== originalOpen) window.open = originalOpen;
    };
    const fail = (message: string) => {
      if (settled) return;
      cleanup();
      reject(new Error(message));
    };
    const finishIfComplete = () => {
      if (settled || !code || !session) return;
      cleanup();
      resolve({ code, wabaId: session.wabaId, phoneNumberId: session.phoneNumberId });
    };
    const awaitOtherHalf = () => {
      clearTimeout(sessionTimer);
      sessionTimer = setTimeout(
        () => fail("Meta did not finish reporting the connection. Please try connecting again."),
        SESSION_WAIT_MS,
      );
    };

    const messageHandler = (event: MessageEvent) => {
      if (!event.origin.endsWith("facebook.com")) return;
      let data: { type?: string; event?: string; data?: Record<string, string | undefined> };
      try {
        data = JSON.parse(event.data);
      } catch {
        return; // Non-JSON messages are normal noise from the FB iframe.
      }
      if (data.type !== "WA_EMBEDDED_SIGNUP") return;

      // A cancel carries the step the person left at; an error carries Meta's message.
      if (data.event === "CANCEL" || data.data?.current_step) {
        fail("WhatsApp signup was closed before it finished.");
      } else if (data.event === "ERROR") {
        fail(data.data?.error_message ?? "Meta reported an error during WhatsApp signup.");
      } else if (String(data.event ?? "").startsWith("FINISH")) {
        // FINISH, FINISH_ONLY_WABA, FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING, ...
        // FINISH_ONLY_WABA has no number; the backend reads it from the account.
        session = { wabaId: data.data?.waba_id, phoneNumberId: data.data?.phone_number_id };
        if (code) finishIfComplete();
        else awaitOtherHalf();
      }
    };
    window.addEventListener("message", messageHandler);

    // FB.login opens the popup with window.open; catch that window so a close by the
    // person (the window's X, not Meta's Cancel) does not leave the button spinning.
    window.open = function (...args: Parameters<typeof window.open>) {
      const opened = originalOpen.apply(window, args);
      if (opened) popup = opened;
      window.open = originalOpen;
      return opened;
    };
    const pollTimer = setInterval(() => {
      if (settled || code || !popup?.closed || closeTimer) return;
      closeTimer = setTimeout(() => {
        // A finished signup closes the popup itself; its code is then still on the way
        // and the session wait already bounds that.
        if (!code && !session) fail("WhatsApp signup was closed before it finished.");
      }, CLOSE_GRACE_MS);
    }, 500);

    const business: Record<string, string> = {};
    if (prefill?.businessName) business.name = prefill.businessName;
    if (prefill?.email) business.email = prefill.email;

    window.FB!.login(
      (response) => {
        const returned = response?.authResponse?.code;
        if (!returned) {
          fail("WhatsApp signup was not completed.");
          return;
        }
        code = returned;
        if (session) finishIfComplete();
        else awaitOtherHalf();
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: Object.keys(business).length ? { business } : {},
          featureType: "",
          sessionInfoVersion: "3",
        },
      },
    );
    if (window.open !== originalOpen) window.open = originalOpen; // no popup was opened
  });
}
