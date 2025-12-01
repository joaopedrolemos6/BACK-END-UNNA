import winston from "winston";
import { env } from "../config/env";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const transports = [
  // 1. Log no Console (com cores)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}`
      )
    ),
  }),
  // 2. Arquivo de Erros (apenas error/warn)
  new winston.transports.File({
    filename: "logs/error.log",
    level: "warn",
    format: winston.format.json() // Salva em JSON para facilitar análise futura
  }),
  // 3. Arquivo Geral (tudo)
  new winston.transports.File({
    filename: "logs/combined.log",
    format: winston.format.json()
  }),
];

export const logger = winston.createLogger({
  level: env.NODE_ENV === "development" ? "debug" : "warn",
  levels,
  format,
  transports,
});