import { Meteor } from 'meteor/meteor'
import moment from 'moment'
import i18next from 'i18next'
import './settings.html'
import '../components/backbutton.js'

Template.settings.helpers({
  name: () => (Meteor.user() ? Meteor.user().profile.name : false),
  unit() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.unit ? Meteor.user().profile.unit : '$'
    }
    return false
  },
  timetrackview() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : 'd'
    }
    return false
  },
  hoursToDays() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.hoursToDays ? Meteor.user().profile.hoursToDays : 8
    }
    return false
  },
  displayHoursToDays: () => Template.instance().displayHoursToDays.get(),
  enableWekan() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile ? Meteor.user().profile.enableWekan : false
    }
    return false
  },
  precision() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.precision ? Meteor.user().profile.precision : '2'
    }
    return false
  },
  siwappurl: () => (Meteor.user() ? Meteor.user().profile.siwappurl : false),
  siwapptoken: () => (Meteor.user() ? Meteor.user().profile.siwapptoken : false),
})

Template.settings.events({
  'click .js-save': (event) => {
    event.preventDefault()
    Meteor.call('updateSettings', {
      name: $('#name').val(),
      unit: $('#unit').val(),
      timeunit: $('#timeunit').val(),
      timetrackview: $('#timetrackview').val(),
      hoursToDays: Number($('#hoursToDays').val()),
      enableWekan: $('#enableWekan').is(':checked'),
      precision: Number($('#precision').val()),
      siwapptoken: $('#siwapptoken').val(),
      siwappurl: $('#siwappurl').val(),
      theme: $('#theme').val(),
      language: $('#language').val(),
    }, (error) => {
      if (error) {
        $.notify({ message: i18next.t(error.error) }, { type: 'danger' })
      } else {
        $.notify(i18next.t('notifications.settings_saved_success'))
      }
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
  this.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      if (Meteor.user().profile) {
        this.displayHoursToDays.set(Meteor.user().profile.timeunit === 'd')
      }
    }
  })
})
Template.settings.onRendered(function settingsRendered() {
  import('node-emoji').then((emojiImport) => {
    const emoji = emojiImport.default
    const replacer = match => emoji.emojify(match)
    $.getJSON('https://api.github.com/repos/faburem/titra/commits/master', (data) => {
      $('#titra-changelog').html(`${moment(data.commit.committer.date).format('DD.MM.YYYY')}: <a href="https://github.com/faburem/titra" target="_blank">${data.sha.substring(0, 7)}</a><br/>${data.commit.message.replace(/(:.*:)/g, replacer)}`)
    }).fail(() => {
      $('#titra-changelog').html('Could not retrieve changelog from Github.')
    })
  })
  this.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      $('#timeunit').val(Meteor.user().profile.timeunit ? Meteor.user().profile.timeunit : 'h')
      $('#timetrackview').val(Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : 'd')
      $('#theme').val(Meteor.user().profile.theme ? Meteor.user().profile.theme : 'auto')
      $('#language').val(Meteor.user().profile.language ? Meteor.user().profile.language : 'auto')

    }
  })
})
