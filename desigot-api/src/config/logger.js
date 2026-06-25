'use strict';
const { createLogger, format, transports } = require('winston');
const config = require('./index');

const { combine, timestamp, errors, json, colorize, printf } = format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) =>
    stack ? `${ts} ${level}: ${message}\n${stack}` : `${ts} ${level}: ${message}`
  )
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = createLogger({
  level: config.log.level,
  format: config.env === 'production' ? prodFormat : devFormat,
  transports: [new transports.Console()],
  exceptionHandlers: [new transports.Console()],
  rejectionHandlers: [new transports.Console()],
});

module.exports = logger;
