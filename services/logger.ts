type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
    context?: string;
}

class Logger {
    private static instance: Logger;
    // Assume generic environment check if import.meta not available, but Vite supports it.
    private isProduction = import.meta.env.PROD;

    private constructor() { }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private log(level: LogLevel, message: string, data?: any, context?: string) {
        // In a real app, you might batch these or send to an API
        if (this.isProduction && level === 'debug') {
            return;
        }

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]${context ? ` [${context}]` : ''}:`;

        switch (level) {
            case 'error':
                console.error(prefix, message, data || '');
                break;
            case 'warn':
                console.warn(prefix, message, data || '');
                break;
            case 'info':
                console.info(prefix, message, data || '');
                break;
            case 'debug':
                console.debug(prefix, message, data || '');
                break;
        }
    }

    public info(message: string, data?: any, context?: string) {
        this.log('info', message, data, context);
    }

    public warn(message: string, data?: any, context?: string) {
        this.log('warn', message, data, context);
    }

    public error(message: string, data?: any, context?: string) {
        this.log('error', message, data, context);
    }

    public debug(message: string, data?: any, context?: string) {
        this.log('debug', message, data, context);
    }
}

export const logger = Logger.getInstance();
