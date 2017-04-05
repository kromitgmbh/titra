import { FlowRouter } from 'meteor/kadira:flow-router'
import { AccountsTemplates } from 'meteor/useraccounts:core'
import { Template } from 'meteor/templating'
import './appLayout.html'
import '../components/navbar.js'
import '../components/connectioncheck.js'

Template.appLayout.events({
  'click #logout': (event) => {
    event.preventDefault()
    AccountsTemplates.logout()
    FlowRouter.go('signin')
  },
})
