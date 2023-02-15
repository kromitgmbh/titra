import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './limitpicker.html'

Template.limitpicker.onCreated(function createLimitPicker() {
  this.limit = new ReactiveVar(25)
})
Template.limitpicker.events({
  'change #limitpicker': (event, templateInstance) => {
    templateInstance.limit.set(Number($(event.currentTarget).val()))
    FlowRouter.setQueryParams({ limit: $(event.currentTarget).val() })
  },
})
Template.limitpicker.onRendered(() => {
  Template.instance().autorun(() => {
    if (FlowRouter.getQueryParam('limit')) {
      Template.instance().limit.set(Number(FlowRouter.getQueryParam('limit')))
      Template.instance().$('#limitpicker').val(FlowRouter.getQueryParam('limit'))
    } else {
      Template.instance().limit.set(25)
    }
  })
})
