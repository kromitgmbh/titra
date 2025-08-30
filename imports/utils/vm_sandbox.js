import { createContext, runInContext } from 'vm'
import { setTimeout as nodeSetTimeout } from 'timers'

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
