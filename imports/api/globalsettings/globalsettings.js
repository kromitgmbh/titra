import { Mongo } from 'meteor/mongo'

const Globalsettings = new Mongo.Collection('globalsettings')
const defaultSettings = []
defaultSettings.push({
  name: 'unit', description: 'settings.cost_unit', type: 'text', value: '€', category: 'settings.categories.global',
})
defaultSettings.push({
  name: 'precision', description: 'settings.decimal_precision', type: 'number', value: 3, category: 'settings.categories.user_defaults',
})
defaultSettings.push({
  name: 'timeunit', description: 'settings.time_unit', type: 'text', value: 'h', category: 'settings.categories.user_defaults',
})
defaultSettings.push({
  name: 'timetrackview', description: 'settings.track_time_view', type: 'text', value: 'd', category: 'settings.categories.user_defaults',
})
defaultSettings.push({
  name: 'hoursToDays', description: 'settings.hours_per_day', type: 'number', value: 8, category: 'settings.categories.user_defaults',
})
defaultSettings.push({
  name: 'dailyStartTime', description: 'settings.daily_start_time', type: 'text', value: '09:00', category: 'settings.categories.workingtime_defaults',
})
defaultSettings.push({
  name: 'breakStartTime', description: 'settings.break_start_time', type: 'text', value: '12:00', category: 'settings.categories.workingtime_defaults',
})
defaultSettings.push({
  name: 'breakDuration', description: 'settings.break_duration', type: 'number', value: 0.5, category: 'settings.categories.workingtime_defaults',
})
defaultSettings.push({
  name: 'regularWorkingTime', description: 'details.regularWorkingTime', type: 'number', value: 8, category: 'settings.categories.workingtime_defaults',
})
defaultSettings.push({
  name: 'addBreakToWorkingTime', description: 'details.addBreakToWorkingTime', type: 'checkbox', value: true, category: 'settings.categories.workingtime_defaults',
})
defaultSettings.push({
  name: 'enableWekan', description: 'settings.enable_wekan_integration', type: 'checkbox', value: true, category: 'settings.categories.interfaces',
})
defaultSettings.push({
  name: 'dateformat', description: 'settings.date_format', type: 'text', value: 'DD.MM.YYYY', category: 'settings.categories.date_settings',
})
defaultSettings.push({
  name: 'dateformatVerbose', description: 'settings.verbose_date_format', type: 'text', value: 'ddd, DD.MM.YYYY', category: 'settings.categories.date_settings',
})
defaultSettings.push({
  name: 'weekviewDateFormat', description: 'settings.weekview_date_format', type: 'text', value: 'ddd, DD.MM', category: 'settings.categories.date_settings',
})
defaultSettings.push({
  name: 'startOfWeek', description: 'settings.startof_week', type: 'number', value: 1, category: 'settings.categories.date_settings',
})
defaultSettings.push({
  name: 'useState', description: 'settings.use_state', type: 'checkbox', value: true, category: 'settings.categories.customization',
})
defaultSettings.push({
  name: 'disableUserRegistration', description: 'settings.disable_user_registration', type: 'checkbox', value: false, category: 'settings.categories.login',
})
defaultSettings.push({
  name: 'enableAnonymousLogins', description: 'settings.enable_anonymous_logins', type: 'checkbox', value: false, category: 'settings.categories.login',
})
defaultSettings.push({
  name: 'disablePublicProjects', description: 'settings.disable_public_projects', type: 'checkbox', value: false, category: 'settings.categories.global',
})
defaultSettings.push({
  name: 'timeEntryRule',
  description: 'settings.time_entry_rule',
  type: 'textarea',
  value: `// this code will run for every time entry creation / modification in a sandbox
  // it has access to the following properties:
  // this.user
  // this.project
  // this.dayjs
  // this.timecard: {
  //   projectId,
  //   task,
  //   state,
  //   date,
  //   hours,
  // }
  // has to return true or false to allow/prevent the creation/modification of time entries
  return true;`,
  category: 'settings.categories.time_tracking',
})
defaultSettings.push({
  name: 'useStartTime', description: 'settings.use_start_time', type: 'checkbox', value: false, category: 'settings.categories.time_tracking',
})
defaultSettings.push({
  name: 'enableZammad', description: 'settings.enable_zammad_integration', type: 'checkbox', value: true, category: 'settings.categories.interfaces',
})
defaultSettings.push({
  name: 'customCSS', description: 'settings.custom_css', type: 'textarea', value: '', category: 'settings.categories.customization',
})
defaultSettings.push({
  name: 'customHTML', description: 'settings.custom_html', type: 'textarea', value: '', category: 'settings.categories.customization',
})
defaultSettings.push({
  name: 'customPlaceholderContent', description: 'settings.custom_placeholder_content', type: 'textarea', value: '', category: 'settings.categories.customization',
})
defaultSettings.push({
  name: 'showCustomFieldsInDetails', description: 'settings.show_custom_fields_in_details', type: 'checkbox', value: 'true', category: 'settings.categories.customization',
})
defaultSettings.push({
  name: 'showCustomerInDetails', description: 'settings.show_customer_in_details', type: 'checkbox', value: 'true', category: 'settings.categories.customization',
})
defaultSettings.push({
  name: 'fromAddress', description: 'settings.mail_from_address', type: 'text', value: 'no-reply@titra.io', category: 'settings.categories.email',
})
defaultSettings.push({
  name: 'fromName', description: 'settings.mail_from_name', type: 'text', value: 'Titra', category: 'settings.categories.email',
})
defaultSettings.push({
  name: 'showNameOfCustomFieldInDetails', description: 'settings.show_name_custom_field_in_details', type: 'checkbox', value: false, category: 'settings.categories.customization',
})
defaultSettings.push({
  name: 'enableOpenIDConnect', description: 'settings.enable_open_id_connect', type: 'checkbox', value: false, category: 'settings.categories.login',
})
defaultSettings.push({
  name: 'holidayCountry', description: 'settings.holiday_country', type: 'text', value: '', category: 'settings.categories.holidays',
})
defaultSettings.push({
  name: 'holidayState', description: 'settings.holiday_state', type: 'text', value: '', category: 'settings.categories.holidays',
})
defaultSettings.push({
  name: 'holidayRegion', description: 'settings.holiday_region', type: 'text', value: '', category: 'settings.categories.holidays',
})
defaultSettings.push({
  name: 'XFrameOptionsOrigin', description: 'settings.xframe_options_origin', type: 'text', value: '', category: 'settings.categories.security',
})
defaultSettings.push({
  name: 'projectSearchNumResults', description: 'settings.project_search_num_results', type: 'number', value: 5, category: 'settings.categories.time_tracking',
})
defaultSettings.push({
  name: 'taskSearchNumResults', description: 'settings.task_search_num_results', type: 'number', value: 5, category: 'settings.categories.time_tracking',
})
defaultSettings.push({
  name: 'enableGitlab', description: 'settings.enable_gitlab', type: 'checkbox', value: true, category: 'settings.categories.interfaces',
})
defaultSettings.push({
  name: 'rounding', description: 'settings.rounding', type: 'number', value: undefined, category: 'settings.categories.time_tracking',
})
defaultSettings.push({
  name: 'enableSiwapp', description: 'settings.enable_siwapp', type: 'checkbox', value: true, category: 'settings.categories.interfaces',
})
defaultSettings.push({
  name: 'enableTransactions', description: 'transactions.enable_transactions', type: 'checkbox', value: false, category: 'settings.categories.global',
})
defaultSettings.push({
  name: 'enableLogForOtherUsers', description: 'settings.enable_log_for_other_users', type: 'checkbox', value: false, category: 'settings.categories.time_tracking',
})
defaultSettings.push({
  name: 'userSearchNumResults', description: 'settings.user_search_num_results', type: 'number', value: 5, category: 'settings.categories.time_tracking',
})
defaultSettings.push({
  name: 'customLogo', description: 'settings.custom_logo', type: 'textarea', value: '', category: 'settings.categories.customization',
})
defaultSettings.push({
  name: 'google_clientid', description: 'settings.google_clientid', type: 'text', value: '', category: 'settings.categories.interfaces',
})
defaultSettings.push({
  name: 'google_secret', description: 'settings.google_secret', type: 'password', value: '', category: 'settings.categories.interfaces',
})
defaultSettings.push({
  name: 'openai_apikey', description: 'settings.openai', type: 'password', value: '', category: 'settings.categories.interfaces',
})
defaultSettings.push({
  name: 'showResourceInDetails', description: 'settings.show_resource_in_details', type: 'checkbox', value: true, category: 'settings.categories.customization',
})
defaultSettings.push({
  name: 'allowIndividualTaskRates', description: 'settings.allow_individual_task_rates', type: 'checkbox', value: false, category: 'settings.categories.time_tracking',
})
defaultSettings.push({
  name: 'showRateInDetails', description: 'settings.show_rate_in_details', type: 'checkbox', value: false, category: 'settings.categories.customization',
})
defaultSettings.push({
  name: 'enableLDAP', description: 'settings.enable_LDAP', type: 'checkbox', value: false, category: 'settings.categories.login',
})
export { defaultSettings, Globalsettings }
