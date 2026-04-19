export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const maybeResponse = (error as { response?: { data?: { error?: string } } }).response;
    const message = maybeResponse?.data?.error;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return fallback;
}

