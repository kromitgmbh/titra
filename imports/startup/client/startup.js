import { Template } from 'meteor/templating'
import emoji from 'node-emoji'
import isDarkMode from 'is-dark'
import i18next from 'i18next'
import Projects from '../../api/projects/projects.js'

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

Meteor.startup(() => {
  Tracker.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      if (Meteor.user().profile.theme === 'dark') {
        import('../../ui/styles/dark.scss')
      } else if (Meteor.user().profile.theme === 'light') {
        import('../../ui/styles/light.scss')
      } else if (isDarkMode()) {
          import('../../ui/styles/dark.scss')
      } else {
        import('../../ui/styles/light.scss')
      }
    } else if (isDarkMode()) {
      import('../../ui/styles/dark.scss')
    } else {
      import('../../ui/styles/light.scss')
    }
    let language = navigator.language.substring(0, 2)
    if (Meteor.user() && Meteor.user().profile && Meteor.user().profile.language) {
      language = Meteor.user().profile.language === 'auto' ? navigator.language.substring(0, 2) : Meteor.user().profile.language
    }
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
  })
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
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
    const precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : 2
    if (Meteor.user().profile.timeunit === 'd') {
      const convertedTime = Number(time / (Meteor.user().profile.hoursToDays
        ? Meteor.user().profile.hoursToDays : 8)).toFixed(precision)
      return convertedTime !== Number(0).toFixed(precision) ? convertedTime : undefined
    }
    if (time) {
      return Number(time).toFixed(precision)
    }
  }
  return false
})
Template.registerHelper('projectColor', (_id) => {
  if (Projects.findOne({ _id })) {
    return Projects.findOne({ _id }).color ? Projects.findOne({ _id }).color : '#009688'
  }
  return '#d9d9d9'
})
Template.registerHelper('isSandstorm', () => Meteor.settings.public.sandstorm)

export default i18nextReady
