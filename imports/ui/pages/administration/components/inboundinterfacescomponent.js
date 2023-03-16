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
  'click .js-add-inbound-interface': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('inboundinterfaces.insert', {
      name: templateInstance.$('#name').val(), description: templateInstance.$('#description').val(), processData: templateInstance.$('#processData').val(), active: templateInstance.$('#isActive').is(':checked'),
    }, (error, result) => {
      if (error) {
        console.error(error)
      } else {
        showToast(result)
        templateInstance.$('#_id').val('')
        templateInstance.$('#name').val('')
        templateInstance.$('#description').val('')
        templateInstance.$('#processData').val('')
        templateInstance.$('#isActive').val(false)
      }
    })
  },
  'click .js-update-inbound-interface': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('inboundinterfaces.update', {
      _id: templateInstance.$('#_id').val(), name: templateInstance.$('#name').val(), description: templateInstance.$('#description').val(), processData: templateInstance.$('#processData').val(), active: templateInstance.$('#isActive').is(':checked'),
    }, (error, result) => {
      if (error) {
        console.error(error)
      } else {
        showToast(result)
        templateInstance.$('#_id').val('')
        templateInstance.$('#name').val('')
        templateInstance.$('#description').val('')
        templateInstance.$('#processData').val('')
        templateInstance.$('#isActive').prop('checked', false)
      }
    })
  },
  'click .js-edit-inbound-interface': (event, templateInstance) => {
    event.preventDefault()
    const inboundInterface = InboundInterfaces.findOne({ _id: templateInstance.$(event.currentTarget).data('interface-id') })
    templateInstance.$('#_id').val(inboundInterface._id)
    templateInstance.$('#name').val(inboundInterface.name)
    templateInstance.$('#description').val(inboundInterface.description)
    templateInstance.$('#processData').val(inboundInterface.processData)
    templateInstance.$('#isActive').prop('checked', inboundInterface.active)
    templateInstance.$('.js-update-inbound-interface').removeClass('d-none')
    templateInstance.$('.js-add-inbound-interface').addClass('d-none')
  },
  'click .js-remove-inbound-interface': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('inboundinterfaces.remove', { _id: templateInstance.$(event.currentTarget).data('interface-id') }, (error, result) => {
      if (error) {
        console.error(error)
      } else {
        showToast(result)
      }
    })
  },
  'click .js-reset': (event, templateInstance) => {
    templateInstance.$('.js-update-inbound-interface').addClass('d-none')
    templateInstance.$('.js-add-inbound-interface').removeClass('d-none')
  },
})
