import { AccountsTemplates } from 'meteor/useraccounts:core'
import { Template } from 'meteor/templating'
import './appLayout.html'
import '../components/navbar.js'

Template.appLayout.events({
  'click #logout'(event){
    event.preventDefault()
    AccountsTemplates.logout()
    FlowRouter.go('signin')
  },
})
