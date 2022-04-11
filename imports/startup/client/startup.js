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

Template.registerHelper('t', (param) => (i18nReady.get() ? t(param) : 'Loading ...'))

Meteor.startup(() => {
  window.BootstrapLoaded = new ReactiveVar(false)
  Meteor.subscribe('globalsettings')
  const extensionHandle = Meteor.subscribe('extensions')
  let language = navigator.language.substring(0, 2)
  import('@fortawesome/fontawesome-free/js/all.js')
  import('bootstrap').then((bs) => {
    window.BootstrapLoaded.set(true)
    new bs.Tooltip(document.body, {
      selector: '[data-bs-toggle="tooltip"]',
      trigger: 'hover focus',
    })
    new bs.Tooltip(document.body, {
      selector: '.js-avatar-tooltip',
      trigger: 'hover focus',
    })
  })
  Tracker.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user()
      && Meteor.user().profile) {
      if (getUserSetting('theme') === 'dark') {
        import('../../ui/styles/dark.scss')
      } else if (getUserSetting('theme') === 'light') {
        import('../../ui/styles/light.scss')
      } else if (isDarkMode()) {
        import('../../ui/styles/dark.scss')
      } else {
        import('../../ui/styles/light.scss')
      }
    } else if (!Meteor.loggingIn() && isDarkMode()) {
      import('../../ui/styles/dark.scss')
    } else {
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
      import('../../utils/oidc_client').then((Oidc) => {
        Oidc.registerOidc();
      });
    }
  })

  hotkeys('command+s,d,w,m', (event, handler) => {
    event.preventDefault()
    switch (handler.key) {
      case 'command+s':
        if (document.querySelector('.js-save')) {
          document.querySelector('.js-save').click()
        }
        break
      case 'd':
        if (document.querySelector('.js-day')) {
          document.querySelector('.js-day').click()
        }
        break
      case 'w':
        if (document.querySelector('.js-week')) {
          document.querySelector('.js-week').click()
        }
        break
      case 'm':
        if (document.querySelector('.js-month')) {
          document.querySelector('.js-month').click()
        }
        break
      default:
        break
    }
  })
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
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
Template.registerHelper('emojify', (text) => {
  if (text) {
    return text.replace(/(:\S*:)/g, emojify)
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
