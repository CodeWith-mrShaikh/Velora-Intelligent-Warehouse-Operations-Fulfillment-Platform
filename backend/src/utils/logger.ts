import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, printf, colorize, json } = winston.format;

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message} `;
  if (Object.keys(metadata).length > 0) {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    timestamp(),
    config.nodeEnv === 'production' ? json() : combine(colorize(), myFormat)
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export default logger;
