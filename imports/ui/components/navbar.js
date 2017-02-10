import { Template } from 'meteor/templating'
import './navbar.html'

Template.navbar.onRendered(() => {
})

Template.navbar.helpers({
  sandStormUser: () => Meteor.settings.public.sandstorm,
})

Template.navbar.events({
  'click .js-logout': (event) => {
    event.preventDefault()
    Meteor.logout()
  },
})
