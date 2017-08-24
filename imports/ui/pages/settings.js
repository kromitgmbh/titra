import { Meteor } from 'meteor/meteor'
import './settings.html'
import '../components/backbutton.js'

Template.settings.helpers({
  name() {
    return Meteor.user() ? Meteor.user().profile.name : false
  },
  unit() {
    return Meteor.user().profile.unit ? Meteor.user().profile.unit : '$'
  },
  timetrackview() {
    return Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : 'd'
  },
  hoursToDays() {
    return Meteor.user().profile.hoursToDays ? Meteor.user().profile.hoursToDays : 8
  },
  displayHoursToDays() {
    return Template.instance().displayHoursToDays.get()
  },
})

Template.settings.events({
  'click .js-save': (event) => {
    event.preventDefault()
    Meteor.call('updateSettings', {
      name: $('#name').val(),
      unit: $('#unit').val(),
      timeunit: $('#timeunit').val(),
      timetrackview: $('#timetrackview').val(),
      hoursToDays: $('#hoursToDays').val() }, (error) => {
      if (error) {
        console.error(error)
      }
      $.notify('Settings saved successfully')
    })
  },
  'change #timeunit': () => {
    Template.instance().displayHoursToDays.set($('#timeunit').val() === 'd')
  },
  'click .js-logout': (event) => {
    event.preventDefault()
    Meteor.logout()
  },
})
Template.settings.onCreated(function settingsCreated() {
  this.displayHoursToDays = new ReactiveVar()
  if (Meteor.user()) {
    if (Meteor.user().profile) {
      this.displayHoursToDays.set(Meteor.user().profile.timeunit === 'd')
    }
  }
})
Template.settings.onRendered(function settingsRendered() {
  this.autorun(() => {
    $('#timeunit').val(Meteor.user().profile.timeunit)
    $('#timetrackview').val(Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : 'd')
  })
})
