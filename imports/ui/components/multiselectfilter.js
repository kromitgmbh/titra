import { createPopper } from '@popperjs/core'
import { ModuleFactory as dashboardCodeFactory } from '@dashboardcode/bsmultiselect'
import './multiselectfilter.html'

Template.multiselectfilter.onRendered(() => {
  const templateInstance = Template.instance()
  const environment = { window, createPopper }
  templateInstance.dashboardCode = dashboardCodeFactory(environment)
  const setSelected = (option, value) => {
    templateInstance.$(option).prop('selected', value)
    if (templateInstance.$('.js-multiselect').val().length === 0) {
      templateInstance.$('option[value="all"]').prop('selected', true)
    }
    if (option.value === 'all' && value) {
      templateInstance.$('option:not([value="all"])').prop('selected', false)
      templateInstance.$('option[value="all"]').prop('selected', true)
    }
    if (option.value !== 'all' && value) {
      templateInstance.$('option[value="all"]').prop('selected', false)
    }
    templateInstance.$('.js-multiselect').trigger('change')
    return false
  }
  templateInstance.options = {
    cssPatch: {
      pick: {
        color: 'var(--bs-text-body)',
      },
    },
    setSelected,
  }
  templateInstance.autorun(() => {
    templateInstance.data.items.fetch()
    templateInstance.bsmultiselect?.dispose()
    templateInstance.bsmultiselect = templateInstance.dashboardCode.BsMultiSelect(templateInstance.$('.js-multiselect').get(0), templateInstance.options)
  })
})
Template.multiselectfilter.events({
  'change .js-multiselect': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.bsmultiselect?.dispose()
    templateInstance.bsmultiselect = templateInstance.dashboardCode.BsMultiSelect(templateInstance.$('.js-multiselect').get(0), templateInstance.options)
  },
})
