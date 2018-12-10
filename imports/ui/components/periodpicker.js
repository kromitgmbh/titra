import { FlowRouter } from 'meteor/kadira:flow-router'
import './periodpicker.html'

Template.periodpicker.onCreated(function createPeriodPicker() {
  this.period = new ReactiveVar('')
})

Template.periodpicker.events({
  'change #period': (event, templateInstance) => {
    templateInstance.period.set($(event.currentTarget).val())
    FlowRouter.setQueryParams({ period: $(event.currentTarget).val() })
  },
})

Template.periodpicker.onRendered(() => {
  Template.instance().autorun(() => {
    if (FlowRouter.getQueryParam('period')) {
      Template.instance().period.set(FlowRouter.getQueryParam('period'))
      Template.instance().$('#period').val(FlowRouter.getQueryParam('period'))
    } else {
      Template.instance().period.set('currentMonth')
    }
  })
  // Template.instance().$('select').material_select()
})
