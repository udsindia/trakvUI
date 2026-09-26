import axios from "axios";

type ErrorBody = {
  message?: unknown;
  errors?: unknown;
};

/** "tuitionAmount" -> "Tuition amount". */
function fieldLabel(field: string): string {
  const words = field.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * One server field error, readable.
 *
 * The backend reports "field: message", and the message often repeats the field:
 * "tuitionAmount: tuitionAmount must be a positive number". That becomes
 * "Tuition amount must be a positive number".
 */
function humaniseFieldError(raw: string): string {
  const split = raw.indexOf(": ");
  if (split < 0) return raw;

  const field = raw.slice(0, split);
  const message = raw.slice(split + 2).trim();
  const label = fieldLabel(field);

  return message.startsWith(field)
    ? label + message.slice(field.length)
    : `${label} ${message}`;
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (!axios.isAxiosError<ErrorBody>(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  if (error.code === "ECONNABORTED" || error.message.toLowerCase().includes("timeout")) {
    return "The server took too long to respond. Please try again.";
  }

  if (!error.response) {
    return "Unable to reach the server. Check your connection and try again.";
  }

  // Checked before `message`: for a validation failure the message is only "Request
  // validation failed", and the list is what says which field and why. Without this a
  // course that would not save said "Request failed with status code 400" or at best the
  // generic line, while the server was naming the exact field the whole time.
  const fieldErrors = error.response.data?.errors;
  if (Array.isArray(fieldErrors)) {
    const messages = fieldErrors
      .filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "")
      .map(humaniseFieldError);
    if (messages.length > 0) {
      return messages.join(". ");
    }
  }

  const serverMessage = error.response.data?.message;
  if (typeof serverMessage === "string" && serverMessage.trim()) {
    return serverMessage;
  }

  switch (error.response.status) {
    case 400:
      return "Some information is invalid. Please review the form and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested record could not be found.";
    case 405:
      return "This action is not supported by the server.";
    case 500:
      return "The server hit an unexpected error. Please try again.";
    default:
      return fallback;
  }
}

/** True for a 409 — the server refused because the record is still referenced. */
export function isConflictError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 409;
}
