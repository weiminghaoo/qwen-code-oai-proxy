const fs = require('fs').promises;
const path = require('path');
const config = require('../config.js');

// Ensure debug directory exists
const debugDir = path.join(__dirname, '..', '..', 'debug');

class DebugLogger {
  constructor() {
    // Ensure debug directory exists
    this.ensureDebugDir();
  }

  async ensureDebugDir() {
    try {
      await fs.access(debugDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(debugDir, { recursive: true });
    }
  }

  /**
   * Enforce log file limit by removing oldest files when limit is exceeded
   * @param {number} limit - Maximum number of log files to keep
   */
  async enforceLogFileLimit(limit) {
    try {
      // Get all debug files in the directory
      const files = await fs.readdir(debugDir);
      
      // Filter for debug files only (starting with 'debug-' and ending with '.txt')
      const debugFiles = files.filter(file => 
        file.startsWith('debug-') && file.endsWith('.txt')
      );
      
      // If we have more files than the limit, remove the oldest ones
      if (debugFiles.length > limit) {
        // Get file stats to sort by creation time
        const fileStats = await Promise.all(
          debugFiles.map(async (file) => {
            const filePath = path.join(debugDir, file);
            const stats = await fs.stat(filePath);
            return { file, mtime: stats.mtime };
          })
        );
        
        // Sort by modification time (oldest first)
        fileStats.sort((a, b) => a.mtime - b.mtime);
        
        // Calculate how many files to remove
        const filesToRemove = fileStats.length - limit;
        
        // Remove the oldest files
        for (let i = 0; i < filesToRemove; i++) {
          const filePath = path.join(debugDir, fileStats[i].file);
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      // Silently handle errors to avoid breaking the application
      // Log file limit enforcement is not critical to the main functionality
    }
  }

  /**
   * Format current date/time for filename
   * @returns {string} Formatted timestamp like '2023-12-06-14:30:45'
   */
  getTimestampForFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}-${hours}:${minutes}:${seconds}`;
  }

  /**
   * Format current date/time for log entries
   * @returns {string} Formatted timestamp like '2023-12-06 14:30:45.123'
   */
  getTimestampForLog() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * Log API request and response to a file
   * @param {string} endpoint - API endpoint being called
   * @param {object} request - Request data
   * @param {object} response - Response data
   * @param {object} error - Error object if request failed
   * @returns {string} The name of the debug file created
   */
  async logApiCall(endpoint, request, response, error = null) {
    // Check if debug logging is enabled
    if (!config.debugLog) {
      // If debug logging is disabled, just return without creating log files
      return null;
    }
    
    try {
      const timestamp = this.getTimestampForFilename();
      const logFilePath = path.join(debugDir, `debug-${timestamp}.txt`);
      const debugFileName = `debug-${timestamp}.txt`;
      
      // Extract only the relevant parts of the request
      const logRequest = {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
        query: request.query
      };
      
      const logEntry = {
        timestamp: this.getTimestampForLog(),
        endpoint: endpoint,
        request: this.sanitizeRequest(logRequest),
        response: error ? { 
          error: error.message, 
          stack: error.stack,
          name: error.name
        } : response
      };
      
      // Handle circular references and non-serializable objects
      const logContent = JSON.stringify(logEntry, (key, value) => {
        if (key === 'stack' && typeof value === 'string') {
          // Limit stack trace length
          return value.split('\n').slice(0, 10).join('\n');
        }
        return value;
      }, 2);
      
      await fs.writeFile(logFilePath, logContent);
      
      // Enforce log file limit
      await this.enforceLogFileLimit(config.logFileLimit);
      
      // Print the debug file name to terminal in green
      console.log('\x1b[32m%s\x1b[0m', `Debug log saved to: ${debugFileName}`);
      
      return debugFileName;
    } catch (err) {
      // Don't let logging errors break the application
      // Silently handle logging errors to avoid cluttering the terminal
      return null;
    }
  }

  /**
   * Sanitize request data to remove sensitive information
   * @param {object} request - Request data to sanitize
   * @returns {object} Sanitized request data
   */
  sanitizeRequest(request) {
    if (!request) return request;
    
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(request));
    
    // Remove sensitive headers if they exist
    if (sanitized.headers) {
      if (sanitized.headers.Authorization) {
        sanitized.headers.Authorization = '[REDACTED]';
      }
      if (sanitized.headers.authorization) {
        sanitized.headers.authorization = '[REDACTED]';
      }
    }
    
    // Remove sensitive body fields if they exist
    if (sanitized.body) {
      // If body contains access tokens or credentials, redact them
      if (sanitized.body.access_token) {
        sanitized.body.access_token = '[REDACTED]';
      }
      if (sanitized.body.refresh_token) {
        sanitized.body.refresh_token = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}

module.exports = { DebugLogger };