import { Template } from 'meteor/templating'
import emoji from 'node-emoji'
import Projects from '../../api/projects/projects.js'

$.notifyDefaults({
  type: 'success',
  delay: 2000,
  placement: {
    from: 'bottom',
    align: 'center',
  },
})
Meteor.startup(() => {
  if (Meteor.user().profile) {
    if (Meteor.user().profile.theme === 'dark') {
      import('../../ui/styles/dark.scss')
    }
  } else {
    import('../../ui/styles/light.scss')
  }
})
Template.registerHelper('unit', () => {
  if (Meteor.user()) {
    return Meteor.user().profile.unit ? Meteor.user().profile.unit : '$'
  }
  return false
})
Template.registerHelper('emojify', (text) => {
  if (text) {
    const replacer = match => emoji.emojify(match)
    return text.replace(/(:.*:)/g, replacer)
  }
  return false
})
Template.registerHelper('timeunit', () => {
  if (Meteor.user()) {
    return Meteor.user().profile.timeunit ? Meteor.user().profile.timeunit : 'h'
  }
  return false
})
Template.registerHelper('timetrackview', () => {
  if (Meteor.user()) {
    return Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : 'd'
  }
  return false
})
Template.registerHelper('timeInUserUnit', (time) => {
  if (Meteor.user()) {
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
