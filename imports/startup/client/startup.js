import { Template } from 'meteor/templating'
import isDarkMode from 'is-dark'
import hotkeys from 'hotkeys-js'
import { $ } from 'meteor/jquery'
import Projects from '../../api/projects/projects.js'
import Extensions from '../../api/extensions/extensions.js'
import {
  timeInUserUnit,
  emojify,
  getGlobalSetting,
  getUserSetting,
  getUserTimeUnitVerbose,
  getUserTimeUnitAbbreviated,
} from '../../utils/frontend_helpers.js'

import {
  i18nReady, t, getLanguage, loadLanguage,
} from '../../utils/i18n.js'

const i18nextDebugMode = window.location.href.indexOf('localhost') > 0
let lightThemeCSS
let darkThemeCSS
Template.registerHelper('t', (param) => (i18nReady.get() ? t(param) : 'Loading ...'))
Template.registerHelper('prefix', () => window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '')

Meteor.startup(() => {
  import('../../utils/google/google_client.js')
  window.BootstrapLoaded = new ReactiveVar(false)
  Meteor.subscribe('globalsettings')
  const extensionHandle = Meteor.subscribe('extensions')
  let language = navigator.language.substring(0, 2)
  import('@fortawesome/fontawesome-free/js/all.js')
  import('bootstrap').then((bs) => {
    window.BootstrapLoaded.set(true)
    bs.Tooltip.getOrCreateInstance(document.body, {
      selector: '[data-bs-toggle="tooltip"]',
      trigger: 'hover focus',
      container: 'body',
    })
  })
  function cleanupStyles(theme) {
    const darkTheme = []
    const lightTheme = []
    document
      .querySelectorAll('style').forEach((style) => {
        if (style.textContent.indexOf('.is-dark') === 0 || style.textContent.indexOf('.is-dark') === 1) {
          darkTheme.push(style)
          darkThemeCSS = style.cloneNode(true)
        } else if (style.textContent.indexOf('.is-light') === 0) {
          lightThemeCSS = style.cloneNode(true)
          lightTheme.push(style)
        }
      })
    if (theme === 'light') {
      if (darkTheme.length > 0 && lightTheme.length > 0) {
        darkTheme.forEach((element) => element.remove())
      } else if (darkTheme.length > 0 && lightTheme.length <= 0 && lightThemeCSS) {
        darkTheme.forEach((element) => element.remove())
        document.head.append(lightThemeCSS)
      }
    } else if (theme === 'dark') {
      if (lightTheme.length > 0 && darkTheme.length > 0) {
        lightTheme.forEach((element) => element.remove())
      } else if (lightTheme.length > 0 && darkTheme.length <= 0 && darkThemeCSS) {
        lightTheme.forEach((element) => element.remove())
        document.head.append(darkThemeCSS)
      }
    }
  }
  Tracker.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user()
      && Meteor.user().profile) {
      if (getUserSetting('theme') === 'dark') {
        cleanupStyles('dark')
        import('../../ui/styles/dark.scss')
      } else if (getUserSetting('theme') === 'light') {
        cleanupStyles('light')
        import('../../ui/styles/light.scss')
      } else if (isDarkMode()) {
        cleanupStyles('dark')
        import('../../ui/styles/dark.scss')
      } else {
        cleanupStyles('light')
        import('../../ui/styles/light.scss')
      }
    } else if (!Meteor.loggingIn() && isDarkMode()) {
      cleanupStyles('dark')
      import('../../ui/styles/dark.scss')
    } else {
      cleanupStyles('light')
      import('../../ui/styles/light.scss')
    }
  })
  Tracker.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      if (getUserSetting('language')) {
        language = getUserSetting('language') === 'auto' ? navigator.language.substring(0, 2) : getUserSetting('language')
      }
      if (getLanguage() !== language) {
        loadLanguage(language, i18nextDebugMode)
      }
    } else if (!Meteor.user() && !Meteor.loggingIn()) {
      if (getLanguage() !== language) {
        loadLanguage(language, i18nextDebugMode)
      }
    }
  })
  Tracker.autorun(() => {
    if (getGlobalSetting('customCSS')) {
      $('head').append(`<style>${getGlobalSetting('customCSS')}</style>`)
    }
    if (getGlobalSetting('customHTML')) {
      $('body').append(`<div>${getGlobalSetting('customHTML')}</div>`)
    }
  })
  Tracker.autorun(() => {
    if (getGlobalSetting('enableOpenIDConnect')) {
      import('../../utils/oidc/oidc_client.js').then((Oidc) => {
        if(Accounts.oauth.serviceNames().indexOf('oidc') === -1) {
          Oidc.registerOidc()
        }
      })
    }
  })
  Tracker.autorun(() => {
    if (getGlobalSetting('customLogo')) {
      const links = document.querySelectorAll("link[rel*='icon']")
      for (const link of links) {
        link.href = getGlobalSetting('customLogo')
      }
    }
  })
  hotkeys('command+s,d,w,m', (event, handler) => {
    event.preventDefault()
    const mouseEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    })
    switch (handler.key) {
      case 'command+s':
        if (document.querySelector('.js-save')) {
          document.querySelector('.js-save').dispatchEvent(mouseEvent)
        }
        break
      case 'd':
        if (document.querySelector('.js-day')) {
          document.querySelector('.js-day').dispatchEvent(mouseEvent)
        }
        break
      case 'w':
        if (document.querySelector('.js-week')) {
          document.querySelector('.js-week').dispatchEvent(mouseEvent)
        }
        break
      case 'm':
        if (document.querySelector('.js-month')) {
          document.querySelector('.js-month').dispatchEvent(mouseEvent)
        }
        break
      default:
        break
    }
  })
  if ('serviceWorker' in navigator) {
    const prefix = window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || ''
    navigator.serviceWorker.register(`${prefix}/sw.js`)
  }
  Tracker.autorun(() => {
    if (extensionHandle.ready()) {
      for (const extension of Extensions.find({})) {
        if (extension.isActive) {
          eval(extension.client)
        }
      }
    }
  })
})
Template.registerHelper('i18nReady', () => i18nReady.get())
Template.registerHelper('unit', () => {
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
    return getUserSetting('unit')
  }
  return false
})
Template.registerHelper('emojify', async (text) => {
  if (text) {
    return emojify(text)
  }
  return false
})
Template.registerHelper('timeunit', getUserTimeUnitAbbreviated)
Template.registerHelper('timeunitVerbose', getUserTimeUnitVerbose)
Template.registerHelper('timetrackview', () => {
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
    return getUserSetting('timetrackview')
  }
  return false
})
Template.registerHelper('timeInUserUnit', (time) => timeInUserUnit(time))
Template.registerHelper('projectColor', (_id) => {
  if (Projects.findOne({ _id })) {
    return Projects.findOne({ _id }).color ? Projects.findOne({ _id }).color : '#009688'
  }
  return '#d9d9d9'
})
Template.registerHelper('isSandstorm', () => Meteor.settings.public.sandstorm)
Template.registerHelper('getGlobalSetting', (settingName) => getGlobalSetting(settingName))
