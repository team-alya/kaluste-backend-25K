import { createLogger, transports, format } from "winston";

const formatTest = format.combine(
    format.timestamp({
        format: "YYYY-MM-DD | HH:mm:ss",
    }),
    format.splat(),
    format.printf((msg) => {
        return `${msg.timestamp} | ${msg.message}`
    })
)

const logger = createLogger({
    format: formatTest,
    transports: [
        new transports.File({ filename: './logs/error.log', level: "error" }),
    ]

});

export default logger;