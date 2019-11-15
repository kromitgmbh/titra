import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
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
  titraAPItoken: () => (Meteor.user() ? Meteor.user().profile.APItoken : false),
  dailyStartTime: () => (Meteor.user() ? Meteor.user().profile.dailyStartTime : '09:00'),
  breakStartTime: () => (Meteor.user() ? Meteor.user().profile.breakStartTime : '12:00'),
  breakDuration: () => (Meteor.user() ? Meteor.user().profile.breakDuration : 0.5),
  regularWorkingTime: () => (Meteor.user() ? Meteor.user().profile.regularWorkingTime : 8),
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
      APItoken: $('#titraAPItoken').val(),
      theme: $('#theme').val(),
      language: $('#language').val(),
      dailyStartTime: $('#dailyStartTime').val(),
      breakStartTime: $('#breakStartTime').val(),
      breakDuration: $('#breakDuration').val(),
      regularWorkingTime: $('#regularWorkingTime').val(),
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
  'click #generateToken': (event) => {
    event.preventDefault()
    $('#titraAPItoken').val(Random.id())
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
    const replacer = (match) => emoji.emojify(match)
    $.getJSON('https://api.github.com/repos/faburem/titra/tags', (data) => {
      const tag = data[2]
      $.getJSON(tag.commit.url, (commitData) => {
        $('#titra-changelog').html(`Version <a href="https://github.com/faburem/titra/tags" target="_blank">${tag.name}</a> (${moment(commitData.commit.committer.date).format('DD.MM.YYYY')}) :<br/>${commitData.commit.message.replace(/(:.*:)/g, replacer)}`)
      })
    }).fail(() => {
      $('#titra-changelog').html(i18next.t('settings.titra_changelog_error'))
    })
  })
  this.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      $('#timeunit').val(Meteor.user().profile.timeunit ? Meteor.user().profile.timeunit : 'h')
      $('#timetrackview').val(Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : 'd')
      $('#theme').val(Meteor.user().profile.theme ? Meteor.user().profile.theme : 'auto')
      $('#language').val(Meteor.user().profile.language ? Meteor.user().profile.language : 'auto')
      $('#dailyStartTime').val(Meteor.user().profile.dailyStartTime ? Meteor.user().profile.dailyStartTime : '09:00')
      $('#breakStartTime').val(Meteor.user().profile.breakStartTime ? Meteor.user().profile.breakStartTime : '12:00')
      $('#breakDuration').val(Meteor.user().profile.breakDuration ? Meteor.user().profile.breakDuration : 0.5)
      $('#regularWorkingTime').val(Meteor.user().profile.regularWorkingTime ? Meteor.user().profile.regularWorkingTime : 8)
    }
  })
})
