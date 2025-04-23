import { createLogger, transports, format } from "winston";

// This is a custom logger for the application using Winston
const formatTest = format.combine(
    format.timestamp({
        format: "YYYY-MM-DD | HH:mm:ss",
    }),
    format.splat(),
    format.printf((msg) => {
        return `${msg.timestamp} | ${msg.message}`
    })
)
// This logger is used to log messages to a file
const logger = createLogger({
    format: formatTest,
    transports: [
        new transports.File({ filename: './logs/error.log', level: "error" }),
    ]

});

export default logger;