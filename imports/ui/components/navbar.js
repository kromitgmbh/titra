import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import namedavatar from 'namedavatar'

import './navbar.html'

Template.navbar.onRendered(() => {
})

Template.navbar.helpers({
  isRouteActive: (routename) => (FlowRouter.getRouteName() === routename ? 'active' : ''),
  displayLinkText: (routename) => (FlowRouter.getRouteName() === routename),
  avatar: () => {
    if (Meteor.user() && Meteor.user().profile.avatar) {
      return `<img src="${Meteor.user().profile.avatar}" alt="${Meteor.user().profile.name}" style="height:30px" class="rounded"/>`
    }
    namedavatar.config({
      nameType: 'initials',
      backgroundColors:
        [(Meteor.user() && Meteor.user().profile.avatarColor
          ? Meteor.user().profile.avatarColor : '#455A64')],
      minFontSize: 2,
    })
    const rawSVG = namedavatar.getSVG(Meteor.user() ? Meteor.user().profile.name : false)
    rawSVG.classList = 'rounded'
    rawSVG.style.width = '25px'
    rawSVG.style.height = '25px'
    return rawSVG.outerHTML
  },
})
