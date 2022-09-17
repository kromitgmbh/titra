const i18nReady = new ReactiveVar(false)
let _i18n = {}
let _debug = true
let _lang = ''
const setup = (language, lang, debugMode) => {
  _i18n = language
  _debug = debugMode
  _lang = lang
  if (_debug) {
    console.log(`Loading i18n for language ${lang}`)
  }
}
const getLanguage = () => _lang
const t = (key) => {
  const keys = key.split('.')
  let translatedValue = _i18n
  keys.forEach((innerKey) => {
    translatedValue = translatedValue[innerKey] !== undefined ? translatedValue[innerKey] : key
  })

  if (translatedValue === undefined || translatedValue === key) {
    if (_debug) {
      console.warn(`Translation for key ${key} not found.`)
    }
    translatedValue = key
  }
  return translatedValue
}
const loadLanguage = (language, i18nextDebugMode) => {
  // Meteor.js is not very smart
  // eslint-disable-next no-constant-condition
  if (false) {
    import('../ui/translations/en.json')
    import('../ui/translations/de.json')
    import('../ui/translations/fr.json')
    import('../ui/translations/zh.json')
  }
  import(`/imports/ui/translations/${language}.json`).then((lang) => {
    i18nReady.set(false)
    setup(lang.default, language, i18nextDebugMode)
    i18nReady.set(true)
    $('html').attr('lang', language)
  }).catch(() => {
    import('../ui/translations/en.json').then((lang) => {
      if (i18nextDebugMode) {
        console.warn('Language not found, using default language en')
      }
      i18nReady.set(false)
      setup(lang.default, 'en', i18nextDebugMode)
      i18nReady.set(true)
      $('html').attr('lang', 'en')
    })
  })
}
export {
  t, setup, getLanguage, i18nReady, loadLanguage,
}
