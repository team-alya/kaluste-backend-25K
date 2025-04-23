// This file defines a custom error class for handling errors in the application.

export class CustomError extends Error {
    status?: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;

        Error.captureStackTrace(this, this.constructor);
    }
}