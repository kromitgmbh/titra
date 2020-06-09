import { Template } from 'meteor/templating'
import isDarkMode from 'is-dark'
import i18next from 'i18next'
import hotkeys from 'hotkeys-js'
import { $ } from 'meteor/jquery'
import Projects from '../../api/projects/projects.js'
import {
  timeInUserUnit,
  emojify,
  getGlobalSetting,
  getUserSetting,
} from '../../utils/frontend_helpers.js'

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
      $('html').attr('lang', 'en')
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
      $('html').attr('lang', 'en')
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
      $('html').attr('lang', 'de')
      break
  }
}
Meteor.startup(() => {
  window.BootstrapLoaded = new ReactiveVar(false)
  Meteor.subscribe('globalsettings')
  let language = navigator.language.substring(0, 2)
  import('@fortawesome/fontawesome-free/js/all.js')
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
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      if (getUserSetting('language')) {
        language = getUserSetting('language') === 'auto' ? navigator.language.substring(0, 2) : getUserSetting('language')
      }
      if (!i18nextReady.get() || i18next.language !== language) {
        loadLanguage(language)
      }
      import('popper.js').then((Popper) => {
        window.Popper = Popper.default
        import('bootstrap').then(() => {
          window.BootstrapLoaded.set(true)
          // $('[data-toggle="tooltip"]').tooltip()
        })
      })
    } else if (!Meteor.user() && !Meteor.loggingIn()) {
      if (!i18nextReady.get()) {
        loadLanguage(language)
      }
    }
    if (i18nextReady.get()) {
      import('sweetalert2/dist/sweetalert2.js').then((Swal) => {
        $.ConfirmBox = Swal.default.mixin({
          showCancelButton: true,
          cancelButtonText: i18next.t('navigation.cancel'),
          reverseButtons: true,
          buttonsStyling: false,
          backdrop: 'rgba(0, 0, 0, 0.5)',
          customClass: {
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-secondary border mr-3',
          },
          showClass: {
            popup: '',
            backdrop: '',
            icon: '',
          },
          hideClass: {
            popup: '',
            backdrop: '',
            icon: '',
          },
        })
        $.Toast = Swal.default.mixin({
          toast: true,
          icon: 'success',
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          onOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
          },
          showClass: {
            popup: '',
            backdrop: '',
            icon: '',
          },
          hideClass: {
            popup: '',
            backdrop: '',
            icon: '',
          },
        })
      })
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
})
Template.registerHelper('i18nextReady', () => i18nextReady.get())
Template.registerHelper('unit', () => {
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
    return getUserSetting('unit')
  }
  return false
})
Template.registerHelper('emojify', (text) => {
  if (text) {
    return text.replace(/(:.*:)/g, emojify)
  }
  return false
})
Template.registerHelper('timeunit', () => {
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile && i18nextReady.get()) {
    switch (getUserSetting('timeunit')) {
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
Template.registerHelper('timeunitVerbose', () => {
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile && i18nextReady.get()) {
    switch (getUserSetting('timeunit')) {
      case 'h':
        return i18next.t('globals.hour_plural')
      case 'd':
        return i18next.t('globals.day_plural')
      default:
        return i18next.t('globals.hour_plural')
    }
  }
  return false
})
Template.registerHelper('timetrackview', () => {
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
    return getUserSetting('timetrackview')
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
Template.registerHelper('getGlobalSetting', (settingName) => getGlobalSetting(settingName))
export default i18nextReady
