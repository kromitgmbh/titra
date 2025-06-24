import { defineConfig } from 'eslint/config'
import meteor from 'eslint-plugin-meteor'
import i18Next from 'eslint-plugin-i18next'
import globals from 'globals'
import babelParser from '@babel/eslint-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import { configs } from 'eslint-config-airbnb-extended/legacy'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  // ESLint Recommended Rules
  {
    name: 'js/config',
    ...js.configs.recommended,
  },
  // Airbnb Base Recommended Config
  ...configs.base.recommended,
  {
    extends: compat.extends('plugin:meteor/recommended'),

    plugins: {
      meteor,
      i18next: i18Next,
    },

    languageOptions: {
      globals: {
        ...globals.meteor,
        ...globals.browser,
        ...globals.node,
      },

      parser: babelParser,
      ecmaVersion: 8,
      sourceType: 'module',

      parserOptions: {
        requireConfigFile: false,
        allowImportExportEverywhere: true,
      },
    },

    settings: {
      'import/resolver': 'meteor',
    },

    rules: {
      semi: [2, 'never'],
      'no-unexpected-multiline': 2,

      'no-underscore-dangle': ['error', {
        allow: ['_id', '_loginStyle', '_redirectUri', '_stateParam'],
      }],

      'no-throw-literal': 0,
      'new-cap': 1,
      'object-shorthand': 1,
      'import/no-extraneous-dependencies': 0,
      'import/no-cycle': 'off',
      'import/no-unresolved': [2, {
        ignore: ['^meteor'],
      }],

      'no-console': [2, {
        allow: ['warn', 'error'],
      }],

      'no-restricted-syntax': [2, 'DebuggerStatement', 'LabeledStatement', 'WithStatement'],

      'i18next/no-literal-string': [1, {
        ignoreCallee: [
          '*.$',
          '$',
          'get',
          'set',
          'add',
          'added',
          'changed',
          'children',
          'html',
          'prop',
          'call',
          'on',
          'is',
          'tab',
          'addClass',
          'removeClass',
          'toggle',
          'querySelector',
          'querySelectorAll',
          'go',
          'remove',
          'getParam',
          'getQueryParam',
          'moment',
          'format',
          'subscribe',
          'publish',
          'setParams',
          'setQueryParams',
          'startOf',
          'endOf',
          'Collection',
          'subtract',
          'find',
          'data',
          'getGlobalSetting',
          'getUserSetting',
        ],
      }],

      'import/extensions': 0,
    },
  }])
