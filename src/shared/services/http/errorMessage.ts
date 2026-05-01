import axios from "axios";

type ErrorBody = {
  message?: unknown;
};

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
