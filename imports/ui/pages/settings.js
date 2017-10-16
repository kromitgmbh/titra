import { Meteor } from 'meteor/meteor'
import './settings.html'
import '../components/backbutton.js'

Template.settings.helpers({
  name: () => (Meteor.user() ? Meteor.user().profile.name : false),
  unit() {
    if (Meteor.user()) {
      return Meteor.user().profile.unit ? Meteor.user().profile.unit : '$'
    }
    return false
  },
  timetrackview() {
    if (Meteor.user()) {
      return Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : 'd'
    }
    return false
  },
  hoursToDays() {
    if (Meteor.user()) {
      return Meteor.user().profile.hoursToDays ? Meteor.user().profile.hoursToDays : 8
    }
    return false
  },
  displayHoursToDays: () => Template.instance().displayHoursToDays.get(),
  enableWekan() {
    if (Meteor.user()) {
      return Meteor.user().profile ? Meteor.user().profile.enableWekan : false
    }
    return false
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
      hoursToDays: $('#hoursToDays').val(),
      enableWekan: $('#enableWekan').is(':checked'),
    }, (error) => {
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
    if (Meteor.user()) {
      $('#timeunit').val(Meteor.user().profile.timeunit)
      $('#timetrackview').val(Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : 'd')
    }
  })
})
