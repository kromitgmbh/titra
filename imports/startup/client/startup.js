import { Template } from 'meteor/templating'
import Projects from '../../../imports/api/projects/projects.js'

$.notifyDefaults({
  type: 'success',
  delay: 2000,
  placement: {
    from: 'bottom',
    align: 'center',
  },
})

Template.registerHelper('unit', () => {
  if (Meteor.user()) {
    return Meteor.user().profile.unit ? Meteor.user().profile.unit : '$'
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
    if (Meteor.user().profile.timeunit === 'd') {
      const convertedTime = Number(time / (Meteor.user().profile.hoursToDays
        ? Meteor.user().profile.hoursToDays : 8)).toFixed(2)
      return convertedTime !== Number(0).toFixed(2) ? convertedTime : undefined
    }
  }
  return time
})
Template.registerHelper('projectColor', (_id) => {
  if (Projects.findOne({ _id })) {
    return Projects.findOne({ _id }).color ? Projects.findOne({ _id }).color : '#009688'
  }
  return '#d9d9d9'
})
