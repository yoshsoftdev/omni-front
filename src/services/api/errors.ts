export type ApiErrorCode =
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "quota_exceeded"
  | "feature_not_available"
  | "payment_required"
  | "internal_error"
  | string;

export class ApiClientError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
  }
}

export function formatApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === "quota_exceeded") {
      return "Team member limit reached for your current plan. Upgrade your workspace to invite more members.";
    }
    if (error.code === "forbidden") {
      return "You do not have permission to perform this action.";
    }
    if (error.code === "not_found") {
      return "The requested resource was not found.";
    }
    if (error.code === "conflict") {
      return error.message || "This action conflicts with existing data.";
    }
    if (error.code === "validation_error") {
      return error.message || "Please check the form and try again.";
    }
    if (error.code === "feature_not_available") {
      return "This feature is not available yet.";
    }
    if (error.code === "payment_required") {
      return "Marketing campaigns require a Meta payment method.";
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
