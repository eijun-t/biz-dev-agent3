/**
 * Local file-based logging fallback for database errors
 */

import fs from 'fs'
import path from 'path'

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  sessionId?: string
  agentName: string
  message: string
  data?: any
  error?: {
    name: string
    message: string
    stack?: string
  }
}

/**
 * Local file logger for fallback logging
 */
export class LocalLogger {
  private logDir: string
  private maxFileSize: number
  private currentLogFile: string

  constructor(
    logDir: string = './logs',
    maxFileSize: number = 10 * 1024 * 1024 // 10MB
  ) {
    this.logDir = logDir
    this.maxFileSize = maxFileSize
    this.currentLogFile = this.getLogFileName()
    
    // Ensure log directory exists
    this.ensureLogDirectory()
  }

  /**
   * Log an info message
   */
  info(message: string, data?: any): void {
    this.writeLog('info', message, data)
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any): void {
    this.writeLog('warn', message, data)
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, data?: any): void {
    this.writeLog('error', message, data, error)
  }

  /**
   * Log agent execution data
   */
  logAgentExecution(
    sessionId: string,
    agentName: string,
    message: string,
    data: any
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      sessionId,
      agentName,
      message,
      data
    }

    this.writeEntry(entry)
  }

  /**
   * Write log entry
   */
  private writeLog(
    level: LogEntry['level'],
    message: string,
    data?: any,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      agentName: 'broad-researcher',
      message,
      data
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }

    this.writeEntry(entry)
  }

  /**
   * Write log entry to file
   */
  private writeEntry(entry: LogEntry): void {
    try {
      // Check if we need to rotate the log file
      this.rotateIfNeeded()

      // Format log entry as JSON with newline
      const logLine = JSON.stringify(entry) + '\n'

      // Append to log file
      fs.appendFileSync(
        path.join(this.logDir, this.currentLogFile),
        logLine,
        'utf8'
      )

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`
        console.log(`${prefix} ${entry.agentName}: ${entry.message}`)
        if (entry.data) {
          console.log('Data:', entry.data)
        }
        if (entry.error) {
          console.error('Error:', entry.error)
        }
      }
    } catch (writeError) {
      // Last resort - log to console
      console.error('Failed to write to log file:', writeError)
      console.error('Original log entry:', entry)
    }
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true })
      }
    } catch (error) {
      console.error('Failed to create log directory:', error)
    }
  }

  /**
   * Get current log file name
   */
  private getLogFileName(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `broad-researcher-${year}${month}${day}.log`
  }

  /**
   * Rotate log file if needed
   */
  private rotateIfNeeded(): void {
    try {
      const logPath = path.join(this.logDir, this.currentLogFile)
      
      // Check if file exists
      if (!fs.existsSync(logPath)) {
        return
      }

      // Check file size
      const stats = fs.statSync(logPath)
      if (stats.size >= this.maxFileSize) {
        // Rotate the file
        const timestamp = Date.now()
        const rotatedName = `${this.currentLogFile}.${timestamp}`
        
        fs.renameSync(logPath, path.join(this.logDir, rotatedName))
        
        // Clean up old rotated files (keep last 5)
        this.cleanupOldLogs()
      }
    } catch (error) {
      console.error('Failed to rotate log file:', error)
    }
  }

  /**
   * Clean up old rotated log files
   */
  private cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logDir)
      const rotatedFiles = files
        .filter(f => f.includes('.log.'))
        .map(f => ({
          name: f,
          path: path.join(this.logDir, f),
          mtime: fs.statSync(path.join(this.logDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.mtime - a.mtime)

      // Keep only the latest 5 rotated files
      const filesToDelete = rotatedFiles.slice(5)
      filesToDelete.forEach(file => {
        try {
          fs.unlinkSync(file.path)
        } catch (error) {
          console.error(`Failed to delete old log file ${file.name}:`, error)
        }
      })
    } catch (error) {
      console.error('Failed to cleanup old logs:', error)
    }
  }

  /**
   * Read recent logs
   */
  readRecentLogs(lines: number = 100): LogEntry[] {
    const entries: LogEntry[] = []

    try {
      const logPath = path.join(this.logDir, this.currentLogFile)
      
      if (!fs.existsSync(logPath)) {
        return entries
      }

      const content = fs.readFileSync(logPath, 'utf8')
      const logLines = content.trim().split('\n')
      
      // Get the last N lines
      const recentLines = logLines.slice(-lines)
      
      for (const line of recentLines) {
        try {
          const entry = JSON.parse(line) as LogEntry
          entries.push(entry)
        } catch (parseError) {
          // Skip invalid lines
          continue
        }
      }
    } catch (error) {
      console.error('Failed to read recent logs:', error)
    }

    return entries
  }

  /**
   * Search logs by criteria
   */
  searchLogs(criteria: {
    sessionId?: string
    level?: LogEntry['level']
    startDate?: Date
    endDate?: Date
    limit?: number
  }): LogEntry[] {
    const results: LogEntry[] = []
    const limit = criteria.limit || 1000

    try {
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.startsWith('broad-researcher-') && f.endsWith('.log'))
        .sort()
        .reverse() // Most recent first

      for (const file of files) {
        if (results.length >= limit) break

        const content = fs.readFileSync(path.join(this.logDir, file), 'utf8')
        const lines = content.trim().split('\n')

        for (const line of lines) {
          if (results.length >= limit) break

          try {
            const entry = JSON.parse(line) as LogEntry
            
            // Apply filters
            if (criteria.sessionId && entry.sessionId !== criteria.sessionId) {
              continue
            }
            
            if (criteria.level && entry.level !== criteria.level) {
              continue
            }

            const entryDate = new Date(entry.timestamp)
            
            if (criteria.startDate && entryDate < criteria.startDate) {
              continue
            }
            
            if (criteria.endDate && entryDate > criteria.endDate) {
              continue
            }

            results.push(entry)
          } catch (parseError) {
            // Skip invalid lines
            continue
          }
        }
      }
    } catch (error) {
      console.error('Failed to search logs:', error)
    }

    return results
  }
}