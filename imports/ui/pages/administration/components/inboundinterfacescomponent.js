import './inboundinterfacescomponent.html'
import InboundInterfaces from '../../../../api/inboundinterfaces/inboundinterfaces'
import { showToast } from '../../../../utils/frontend_helpers'

Template.inboundinterfacescomponent.onCreated(function inboundinterfacesCreated() {
  this.subscribe('inboundinterfaces')
})

Template.inboundinterfacescomponent.helpers({
  inboundInterfaces() {
    return InboundInterfaces.find()
  },
})
Template.inboundinterfacescomponent.events({
  'click .add-inbound-interface': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('inboundinterfaces.insert', { name: templateInstance.$('#name').val(), description: templateInstance.$('#description').val() }, (error, result) => {
      if (error) {
        console.log(error)
      } else {
        showToast(result)
      }
    })
  },
  'click .edit-inbound-interface': (event, templateInstance) => {
    event.preventDefault()
  },
  'click .remove-inbound-interface': (event, templateInstance) => {
    event.preventDefault()
  },
})
