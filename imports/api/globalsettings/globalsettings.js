import { Mongo } from 'meteor/mongo'

const Globalsettings = new Mongo.Collection('globalsettings')
const defaultSettings = []
defaultSettings.push({
  name: 'unit', description: 'settings.cost_unit', type: 'text', value: '€',
})
defaultSettings.push({
  name: 'precision', description: 'settings.decimal_precision', type: 'number', value: 3,
})
defaultSettings.push({
  name: 'timeunit', description: 'settings.time_unit', type: 'text', value: 'h',
})
defaultSettings.push({
  name: 'timetrackview', description: 'settings.track_time_view', type: 'text', value: 'd',
})
defaultSettings.push({
  name: 'hoursToDays', description: 'settings.hours_per_day', type: 'number', value: 8,
})
defaultSettings.push({
  name: 'dailyStartTime', description: 'settings.daily_start_time', type: 'text', value: '09:00',
})
defaultSettings.push({
  name: 'breakStartTime', description: 'settings.break_start_time', type: 'text', value: '12:00',
})
defaultSettings.push({
  name: 'breakDuration', description: 'settings.break_duration', type: 'number', value: 0.5,
})
defaultSettings.push({
  name: 'regularWorkingTime', description: 'details.regularWorkingTime', type: 'number', value: 8,
})
defaultSettings.push({ name: 'enableWekan', description: 'settings.enable_wekan_integration', value: true })
defaultSettings.push({
  name: 'dateformat', description: 'settings.date_format', type: 'text', value: 'DD.MM.YYYY',
})
defaultSettings.push({
  name: 'dateformatVerbose', description: 'settings.verbose_date_format', type: 'text', value: 'ddd, DD.MM.YYYY',
})
defaultSettings.push({
  name: 'weekviewDateFormat', description: 'settings.weekview_date_format', type: 'text', value: 'ddd, DD.MM',
})
defaultSettings.push({
  name: 'startOfWeek', description: 'settings.startof_week', type: 'number', value: 1,
})
defaultSettings.push({
  name: 'useState', description: 'settings.use_state', type: 'text', value: true,
})
export { defaultSettings, Globalsettings }
