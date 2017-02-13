import { Meteor } from 'meteor/meteor'
import './settings.html'
import '../components/backbutton.js'


Template.settings.helpers({
  name() {
    return Meteor.user() ? Meteor.user().profile.name : false
  },
})

Template.settings.events({
  'click .js-save'(event) {
    event.preventDefault()
    Meteor.call('updateSettings', { name: $('#name').val() }, (error, result) => {
      if (error) {
        console.error(error)
      }
      $.notify('Settings saved successfully')
    })
  },
})
