import { NextFunction, Request, Response } from "express";
import { CustomError } from "@/types/customError";
import logger from "@/utils/logger";

// Custom error handler middleware
// This middleware handles errors thrown in the application
export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {

  const errorTypes: Record<number, string> = {
    400: "Bad Request;",
    401: "Unauthorized;",
    403: "Forbidden;",
    404: "Not Found;",
    500: "Internal Server Error;",
    502: "Bad Gateway;",
    503: "Service Unavailable;",
    504: "Gateway Timeout;",
  }

  const errorCode = err.status || 500;
  const errorType = errorTypes[errorCode];
  console.error("Server error:", err.status, errorType, err.stack);
  res.status(errorCode).json({
    error: err.message || "Internal server error",
  });
  const logMsg = `Server error: ${err.status} ${errorType} | ${err.stack}`;
  logger.error(logMsg);
};
