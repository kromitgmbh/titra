import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { displayUserAvatar, getUserSetting } from '../../utils/frontend_helpers'

import './navbar.html'
import '../pages/track/components/timetracker.js'

Template.navbar.onCreated(function navbarCreated() {
  this.displayHoursToDays = new ReactiveVar()
  this.autorun(() => {
    if (Meteor.user()) {
      this.subscribe('userRoles')
    }
    this.displayHoursToDays.set(getUserSetting('timeunit'))
  })
})
Template.navbar.onRendered(function settingsRendered() {
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user()
        && Meteor.user().profile && this.subscriptionsReady()) {
      templateInstance.$('#timeunit').val(getUserSetting('timeunit'))
        }
      })
    })
Template.navbar.helpers({
  isRouteActive: (routename) => (FlowRouter.getRouteName() === routename ? 'active' : ''),
  displayLinkText: (routename) => (FlowRouter.getRouteName() === routename),
  avatar: () => displayUserAvatar(Meteor.user()),
  getUserSetting: (setting) => getUserSetting(setting),
})
Template.navbar.events({
  'click .js-logout': (event) => {
    event.preventDefault()
    Meteor.logout()
  },
  'change #timeunit': (event, templateInstance) => {
    event.preventDefault()
    console.log(templateInstance.$('#timeunit').val())
    Meteor.call('updateTimeUnit', {timeunit: templateInstance.$('#timeunit').val()},(error,result)=> {
      if(error){
        console.error(error)
      }
    })
  },
})


