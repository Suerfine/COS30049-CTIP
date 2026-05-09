/**
 * Simple logger utility for terminal output
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private formatLog(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    let output = `[${timestamp}] [${levelUpper}] ${message}`;

    if (data !== undefined) {
      output += ` ${JSON.stringify(data)}`;
    }

    return output;
  }

  info(message: string, data?: unknown): void {
    console.log(this.formatLog("info", message, data));
  }

  warn(message: string, data?: unknown): void {
    console.warn(this.formatLog("warn", message, data));
  }

  error(message: string, data?: unknown): void {
    console.error(this.formatLog("error", message, data));
  }

  debug(message: string, data?: unknown): void {
    if (process.env.DEBUG === "true") {
      console.debug(this.formatLog("debug", message, data));
    }
  }
}

export const logger = new Logger();
