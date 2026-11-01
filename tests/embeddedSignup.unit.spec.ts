import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { launchEmbeddedSignup } from "../src/shared/services/meta/whatsappEmbeddedSignup";

/**
 * Meta answers Embedded Signup in two parts, in either order: the code through the
 * FB.login callback and the chosen account and number through a window message. The
 * launcher used to resolve on the callback alone, so whenever the message came second the
 * backend got a code with no number. These cases pin the order-independence, the FINISH
 * variants, and the ways a person can leave part-way.
 */

type Listener = (event: { origin: string; data: string }) => void;

let listeners: Set<Listener>;
let loginCallback: (response: { authResponse?: { code?: string } }) => void;
let loginOptions: { extras: { setup: { business?: Record<string, string> }; featureType: string } };
let popup: { closed: boolean };

function message(event: string, data: Record<string, string> = {}) {
  for (const listener of [...listeners]) {
    listener({ origin: "https://www.facebook.com", data: JSON.stringify({ type: "WA_EMBEDDED_SIGNUP", event, data }) });
  }
}

/** Starts the launcher and lets loadSdk's resolution reach FB.login. */
async function start(prefill?: { businessName?: string; email?: string }, coexistence = false) {
  const result = launchEmbeddedSignup({ appId: "app", configId: "cfg" }, prefill, { coexistence });
  await vi.advanceTimersByTimeAsync(0);
  return result;
}

beforeEach(() => {
  vi.useFakeTimers();
  listeners = new Set();
  popup = { closed: false };
  const fakeWindow = {
    open: vi.fn(() => popup),
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
    FB: {
      init: vi.fn(),
      login: vi.fn((cb: typeof loginCallback, opts: typeof loginOptions) => {
        loginCallback = cb;
        loginOptions = opts;
        fakeWindow.open("https://www.facebook.com/dialog/oauth");
      }),
    },
  };
  vi.stubGlobal("window", fakeWindow);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("launchEmbeddedSignup", () => {
  test("resolves when the account arrives before the code", async () => {
    const result = start();
    await vi.advanceTimersByTimeAsync(0);
    message("FINISH", { waba_id: "W1", phone_number_id: "P1" });
    loginCallback({ authResponse: { code: "C1" } });
    await expect(result).resolves.toEqual({ code: "C1", wabaId: "W1", phoneNumberId: "P1", coexistence: false });
  });

  test("resolves when the code arrives before the account", async () => {
    const result = start();
    await vi.advanceTimersByTimeAsync(0);
    loginCallback({ authResponse: { code: "C1" } });
    await vi.advanceTimersByTimeAsync(2_000);
    message("FINISH", { waba_id: "W1", phone_number_id: "P1" });
    await expect(result).resolves.toEqual({ code: "C1", wabaId: "W1", phoneNumberId: "P1", coexistence: false });
  });

  test("accepts FINISH_ONLY_WABA, which has no number", async () => {
    const result = start();
    await vi.advanceTimersByTimeAsync(0);
    message("FINISH_ONLY_WABA", { waba_id: "W1" });
    loginCallback({ authResponse: { code: "C1" } });
    await expect(result).resolves.toEqual({ code: "C1", wabaId: "W1", phoneNumberId: undefined, coexistence: false });
  });

  test("rejects when the person cancels part-way", async () => {
    const result = start();
    await vi.advanceTimersByTimeAsync(0);
    const assertion = expect(result).rejects.toThrow(/closed before it finished/);
    message("CANCEL", { current_step: "PHONE_NUMBER_SETUP" });
    await assertion;
  });

  test("rejects when the popup window is closed without finishing", async () => {
    const result = start();
    await vi.advanceTimersByTimeAsync(0);
    const assertion = expect(result).rejects.toThrow(/closed before it finished/);
    popup.closed = true;
    await vi.advanceTimersByTimeAsync(2_500);
    await assertion;
  });

  test("gives up if the account never follows the code", async () => {
    const result = start();
    await vi.advanceTimersByTimeAsync(0);
    const assertion = expect(result).rejects.toThrow(/did not finish reporting/);
    loginCallback({ authResponse: { code: "C1" } });
    await vi.advanceTimersByTimeAsync(16_000);
    await assertion;
  });

  test("pre-fills the agency's name and email in Meta's form", async () => {
    const result = start({ businessName: "VUTrak Demo Agency", email: "meta.review@vutrak.com" });
    await vi.advanceTimersByTimeAsync(0);
    expect(loginOptions.extras.setup).toEqual({
      business: { name: "VUTrak Demo Agency", email: "meta.review@vutrak.com" },
    });
    message("FINISH", { waba_id: "W1", phone_number_id: "P1" });
    loginCallback({ authResponse: { code: "C1" } });
    await result;
  });

  test("asks Meta for the standard flow unless coexistence is chosen", async () => {
    const result = start();
    await vi.advanceTimersByTimeAsync(0);
    expect(loginOptions.extras.featureType).toBe("");
    message("FINISH", { waba_id: "W1", phone_number_id: "P1" });
    loginCallback({ authResponse: { code: "C1" } });
    await result;
  });

  test("connects a WhatsApp Business app number and reports it as coexistence", async () => {
    const result = start(undefined, true);
    await vi.advanceTimersByTimeAsync(0);
    expect(loginOptions.extras.featureType).toBe("whatsapp_business_app_onboarding");
    message("FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING", { waba_id: "W1" });
    loginCallback({ authResponse: { code: "C1" } });
    await expect(result).resolves.toEqual({ code: "C1", wabaId: "W1", phoneNumberId: undefined, coexistence: true });
  });
});
