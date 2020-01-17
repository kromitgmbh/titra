import { Template } from 'meteor/templating'
import emoji from 'node-emoji'
import isDarkMode from 'is-dark'
import i18next from 'i18next'
import * as bs4notify from 'bootstrap4-notify'
import Projects from '../../api/projects/projects.js'
import { timeInUserUnit } from '../../utils/frontend_helpers.js'

$.notifyDefaults({
  type: 'success',
  delay: 2000,
  placement: {
    from: 'top',
    align: 'right',
  },
})
const i18nextReady = new ReactiveVar(false)
const i18nextDebugMode = window.location.href.indexOf('localhost') > 0
let globalT

Template.registerHelper('t', (param) => (i18nextReady.get() ? globalT(param) : 'Loading ...'))

function loadLanguage(language) {
  switch (language) {
    default:
      import('../../ui/translations/en.json').then((en) => {
        i18next.init({
          lng: 'en',
          debug: i18nextDebugMode,
          resources: {
            en: {
              translation: en.default,
            },
          },
        }).then((t) => {
          globalT = t
          i18nextReady.set(true)
        })
      })
      break
    case 'en':
      import('../../ui/translations/en.json').then((en) => {
        i18next.init({
          lng: 'en',
          debug: i18nextDebugMode,
          resources: {
            en: {
              translation: en.default,
            },
          },
        }).then((t) => {
          globalT = t
          i18nextReady.set(true)
        })
      })
      break
    case 'de':
      import('../../ui/translations/de.json').then((de) => {
        i18next.init({
          lng: 'de',
          debug: i18nextDebugMode,
          resources: {
            de: {
              translation: de.default,
            },
          },
        }).then((t) => {
          globalT = t
          i18nextReady.set(true)
        })
      })
      break
  }
}
Meteor.startup(() => {
  window.BootstrapLoaded = new ReactiveVar(false)
  let language = navigator.language.substring(0, 2)
  Tracker.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user()
      && Meteor.user().profile) {
      if (Meteor.user().profile.theme === 'dark') {
        import('../../ui/styles/dark.scss')
      } else if (Meteor.user().profile.theme === 'light') {
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
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      if (Meteor.user().profile.language) {
        language = Meteor.user().profile.language === 'auto' ? navigator.language.substring(0, 2) : Meteor.user().profile.language
      }
      loadLanguage(language)
      import('popper.js').then((Popper) => {
        // window.Tether = Tether.default
        window.Popper = Popper.default
        import('bootstrap').then(() => {
          window.BootstrapLoaded.set(true)
          $('[data-toggle="tooltip"]').tooltip()
        })
      })
    } else if (!Meteor.user() && !Meteor.loggingIn()) {
      loadLanguage(language)
    }
  })
  // Global keyboard Shortcuts - check https://keycode.info/ for keycodes
  document.onkeyup = (e) => {
    if (e.which === 83 && e.ctrlKey && e.shiftKey) {
      if (document.querySelector('.js-save')) {
        document.querySelector('.js-save').click()
      }
    } else if (e.which === 68 && e.ctrlKey && e.shiftKey) {
      if (document.querySelector('.js-day')) {
        document.querySelector('.js-day').click()
      }
    } else if (e.which === 87 && e.ctrlKey && e.shiftKey) {
      if (document.querySelector('.js-week')) {
        document.querySelector('.js-week').click()
      }
    } else if (e.which === 77 && e.ctrlKey && e.shiftKey) {
      if (document.querySelector('.js-month')) {
        document.querySelector('.js-month').click()
      }
    }
  }
})
Template.registerHelper('i18nextReady', () => i18nextReady.get())
Template.registerHelper('unit', () => {
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
    return Meteor.user().profile.unit ? Meteor.user().profile.unit : '$'
  }
  return false
})
Template.registerHelper('emojify', (text) => {
  if (text) {
    const replacer = (match) => emoji.emojify(match)
    return text.replace(/(:.*:)/g, replacer)
  }
  return false
})
Template.registerHelper('timeunit', () => {
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile && i18nextReady.get()) {
    switch (Meteor.user().profile.timeunit) {
      case 'h':
        return i18next.t('globals.unit_hour_short')
      case 'd':
        return i18next.t('globals.unit_day_short')
      default:
        return i18next.t('globals.unit_hour_short')
    }
  }
  return false
})
Template.registerHelper('timetrackview', () => {
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
    return Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : 'd'
  }
  return false
})
Template.registerHelper('timeInUserUnit', (time) => {
  return timeInUserUnit(time)
})
Template.registerHelper('projectColor', (_id) => {
  if (Projects.findOne({ _id })) {
    return Projects.findOne({ _id }).color ? Projects.findOne({ _id }).color : '#009688'
  }
  return '#d9d9d9'
})
Template.registerHelper('isSandstorm', () => Meteor.settings.public.sandstorm)

export default i18nextReady
