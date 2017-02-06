import './periodpicker.html'

Template.periodpicker.onCreated(function createPeriodPicker() {
  this.period = new ReactiveVar('currentMonth')
})

Template.periodpicker.events({
  'change #period': (event, templateInstance) => {
    templateInstance.period.set($(event.currentTarget).val())
  },
})

Template.periodpicker.onRendered(() => {
  // Template.instance().$('select').material_select()
})
