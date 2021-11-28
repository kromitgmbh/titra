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
    import('/imports/ui/translations/en.json')
    import('/imports/ui/translations/de.json')
    import('/imports/ui/translations/fr.json')
  }
  import(`/imports/ui/translations/${language}.json`).then((lang) => {
    i18nReady.set(false)
    setup(lang.default, language, i18nextDebugMode)
    i18nReady.set(true)
    $('html').attr('lang', language)
  })
}
export {
  t, setup, getLanguage, i18nReady, loadLanguage,
}
