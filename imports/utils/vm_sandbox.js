import { createContext, runInContext } from 'vm'
import { setTimeout as nodeSetTimeout } from 'timers'
import { Meteor } from 'meteor/meteor'

/**
 * Validates code to prevent malicious code execution
 * @param {string} code - The code to validate
 * @throws {Meteor.Error} If the code contains potentially malicious patterns
 */
export function validateSandboxCode(code) {
  if (typeof code !== 'string') {
    throw new Meteor.Error('invalid-code', 'Code must be a string')
  }
  // Check code length to prevent excessively large payloads
  if (code.length > 50000) {
    throw new Meteor.Error('code-too-long', 'Code exceeds maximum allowed length of 50KB')
  }
  // Define dangerous patterns that should not be allowed
  const dangerousPatterns = [
    // Process and system access
    { pattern: /\bprocess\s*\.\s*(?:exit|kill|abort|env|cwd|chdir|platform|version|execPath|argv|execArgv|mainModule|dlopen)\b/gi, description: 'process object manipulation' },
    { pattern: /\bprocess\s*\[\s*['"`](?:exit|kill|abort|env|cwd|chdir)\s*['"`]\s*\]/gi, description: 'process object bracket access' },
    { pattern: /\bglobal\s*\.\s*process\b/gi, description: 'global.process access' },
    { pattern: /\bglobal\s*\[\s*['"`]process['"`]\s*\]/gi, description: 'global process bracket access' },
    // File system and dangerous Node.js modules
    { pattern: /\brequire\s*\(\s*['"`](?:fs|child_process|cluster|worker_threads|vm|repl)\s*['"`]\s*\)/gi, description: 'dangerous module require' },
    { pattern: /\bimport\s+.*\s+from\s+['"`](?:fs|child_process|cluster|worker_threads|vm|repl)['"`]/gi, description: 'dangerous module import' },
    { pattern: /\b(?:readFileSync|writeFileSync|unlinkSync|rmdirSync|mkdirSync|existsSync|readdirSync)\b/gi, description: 'synchronous file system operations' },
    { pattern: /\b(?:readFile|writeFile|unlink|rmdir|mkdir|exists|readdir|appendFile|chmod|chown)\s*\(/gi, description: 'file system operations' },
    { pattern: /\bexec(?:Sync|File|FileSync)?\s*\(/gi, description: 'code execution functions' },
    { pattern: /\bspawn(?:Sync)?\s*\(/gi, description: 'process spawning' },
    { pattern: /\bfork\s*\(/gi, description: 'process forking' },
    // Constructor and prototype manipulation
    { pattern: /\bconstructor\s*\.\s*constructor\b/gi, description: 'constructor chain access' },
    { pattern: /\b__proto__\b/gi, description: 'prototype manipulation' },
    { pattern: /\bObject\s*\.\s*setPrototypeOf\b/gi, description: 'prototype manipulation' },
    { pattern: /\bFunction\s*\(\s*['"`]/gi, description: 'Function constructor' },
    { pattern: /\bnew\s+Function\s*\(/gi, description: 'new Function constructor' },
    // Eval and code injection
    { pattern: /\beval\s*\(/gi, description: 'eval function' },
    { pattern: /\bsetTimeout\s*\(\s*['"`]/gi, description: 'setTimeout with string code' },
    { pattern: /\bsetInterval\s*\(\s*['"`]/gi, description: 'setInterval with string code' },
    // Global object access attempts
    { pattern: /\bglobalThis\b/gi, description: 'globalThis access' },
    { pattern: /\bthis\s*\.\s*constructor\s*\.\s*constructor\b/gi, description: 'constructor escape attempt' },
    // Attempts to access Node.js internals
    { pattern: /\bMeteor\s*\.\s*(?:users|call|apply|methods|publish|subscribe|startup)\b/gi, description: 'Meteor internal access' },
    { pattern: /\bAccounts\s*\./gi, description: 'Accounts object access' },
    { pattern: /\bDDP\s*\./gi, description: 'DDP object access' },
    { pattern: /\bMongoInternals\b/gi, description: 'MongoInternals access' },
    // Obfuscation attempts
    { pattern: /\\u0065\\u0076\\u0061\\u006c/gi, description: 'unicode obfuscated eval' },
    { pattern: /\\x65\\x76\\x61\\x6c/gi, description: 'hex obfuscated eval' },
    { pattern: /String\s*\.\s*fromCharCode\s*\(/gi, description: 'character code obfuscation' },
    // Buffer and binary manipulation
    { pattern: /\bBuffer\s*\.\s*(?:from|alloc|allocUnsafe)\b/gi, description: 'Buffer manipulation' },
    // Module system manipulation
    { pattern: /\bmodule\s*\.\s*(?:require|exports|loaded|parent|children)\b/gi, description: 'module object manipulation' },
    { pattern: /\brequire\s*\.\s*(?:cache|main|resolve)\b/gi, description: 'require object manipulation' },
    { pattern: /\b__dirname\b/gi, description: '__dirname access' },
    { pattern: /\b__filename\b/gi, description: '__filename access' },
  ]
  // Check for dangerous patterns
  const violations = []
  for (const { pattern, description } of dangerousPatterns) {
    const matches = code.match(pattern)
    if (matches) {
      violations.push({
        description,
        examples: matches.slice(0, 3), // Show up to 3 examples
      })
    }
  }
  if (violations.length > 0) {
    const errorMessage = violations.map((v) => `- ${v.description}: ${v.examples.join(', ')}`).join('\n')
    throw new Meteor.Error(
      'malicious-code-detected',
      `Potentially malicious code patterns detected:\n${errorMessage}`,
    )
  }
  // Validate the code can be parsed as valid JavaScript
  try {
    // Use Function constructor in a safe way just for syntax validation
    // We're not executing this, just checking if it parses
    // eslint-disable-next-line no-new, no-new-func
    new Function(code)
  } catch (syntaxError) {
    throw new Meteor.Error(
      'syntax-error',
      `Code contains invalid JavaScript syntax: ${syntaxError.message}`,
    )
  }
}

/**
 * A native Node.js vm-based sandbox that replaces vm2's NodeVM functionality.
 * Provides secure execution of untrusted code with controlled context and timeouts.
 */
export class NodeSandbox {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 5000,
      console: options.console || 'off',
      wrapper: options.wrapper || 'commonjs',
      sandbox: options.sandbox || {},
      require: options.require || { external: false, builtin: [] },
      ...options,
    }

    this.context = this.createSandboxContext()
  }

  createSandboxContext() {
    // Create base sandbox with controlled globals
    const sandbox = {
      // Basic JavaScript globals needed for code execution
      Object,
      Array,
      String,
      Number,
      Boolean,
      Date,
      Math,
      JSON,
      Promise,
      setTimeout: nodeSetTimeout,
      clearTimeout,
      setInterval,
      clearInterval,

      // CommonJS-like exports and module for compatibility
      exports: {},
      module: { exports: {} },
      __filename: '<sandbox>',
      __dirname: '<sandbox>',

      // Add user-provided sandbox objects
      ...this.options.sandbox,
    }

    // Handle console option
    if (this.options.console === 'inherit') {
      sandbox.console = console
    } else if (this.options.console !== 'off') {
      // Create a limited console
      sandbox.console = {
        // eslint-disable-next-line no-console
        log: (...args) => console.log('[SANDBOX]', ...args),
        error: (...args) => console.error('[SANDBOX]', ...args),
        warn: (...args) => console.warn('[SANDBOX]', ...args),
        // eslint-disable-next-line no-console
        info: (...args) => console.info('[SANDBOX]', ...args),
      }
    }

    // Handle require functionality
    if (this.options.require && this.options.require.builtin) {
      const builtinModules = this.options.require.builtin
      if (builtinModules.includes('*') || builtinModules.length > 0) {
        sandbox.require = this.createRequireFunction(builtinModules)
      }
    }

    return createContext(sandbox)
  }

  // eslint-disable-next-line class-methods-use-this
  createRequireFunction(allowedBuiltins) {
    return (moduleName) => {
      // Allow the most commonly used and safe builtin modules
      const safeBuiltins = [
        'util', 'crypto', 'url', 'querystring', 'path', 'fs', 'buffer',
        'stream', 'events', 'os', 'http', 'https', 'zlib', 'net',
      ]

      if (allowedBuiltins.includes('*')) {
        // When '*' is specified, allow all safe builtins
        if (safeBuiltins.includes(moduleName)) {
          // eslint-disable-next-line import/no-dynamic-require, global-require
          return require(moduleName)
        }
      } else if (allowedBuiltins.includes(moduleName)) {
        if (safeBuiltins.includes(moduleName)) {
          // eslint-disable-next-line import/no-dynamic-require, global-require
          return require(moduleName)
        }
      }

      throw new Error(`Module '${moduleName}' is not allowed`)
    }
  }

  async run(code) {
    // Validate code before execution
    validateSandboxCode(code)

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new Error('Script execution timed out'))
      }, this.options.timeout)

      try {
        let wrappedCode = code

        // Wrap the code in a function to allow return statements
        // This makes it compatible with vm2's behavior where return statements work
        if (this.options.wrapper === 'none') {
          // Even with wrapper 'none', we need to wrap in a function to allow returns
          // Use call() to bind the sandbox data as 'this' context
          wrappedCode = `(function() { ${code} }).call(this)`
        } else {
          // For other wrapper types, also wrap in a function
          wrappedCode = `(function() { ${code} }).call(this)`
        }

        // Execute the code in the sandbox
        const result = runInContext(wrappedCode, this.context, {
          timeout: this.options.timeout,
          displayErrors: true,
        })

        clearTimeout(timeoutId)
        resolve(result)
      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }
}

// For backward compatibility, export as NodeVM
export { NodeSandbox as NodeVM }
