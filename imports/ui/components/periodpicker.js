import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import './periodpicker.html'
import { getUserSetting } from '../../utils/frontend_helpers'

Template.periodpicker.onCreated(function createPeriodPicker() {
  dayjs.extend(utc)
  this.period = new ReactiveVar('')
})

Template.periodpicker.events({
  'change #period': (event, templateInstance) => {
    templateInstance.period.set($(event.currentTarget).val())
    FlowRouter.setQueryParams({ period: $(event.currentTarget).val() })
    if ($(event.currentTarget).val() === 'custom') {
      templateInstance.$('.js-custom-period-modal').modal('toggle')
    }
  },
  'click .js-save': (event, templateInstance) => {
    event.preventDefault()
    const customStartDate = dayjs.utc(templateInstance.$('#customStartDate').val()).isValid()
      ? dayjs.utc(templateInstance.$('#customStartDate').val()).toDate() : false
    const customEndDate = (dayjs.utc(templateInstance.$('#customEndDate').val()).isValid() && dayjs.utc(templateInstance.$('#customEndDate').val()).isAfter(dayjs.utc(templateInstance.$('#customStartDate').val())))
      ? dayjs.utc(templateInstance.$('#customEndDate').val()).toDate() : false
    if (customStartDate && customEndDate) {
      Meteor.call('setCustomPeriodDates', {
        customStartDate,
        customEndDate,
      }, (error) => {
        if (error) {
          console.error(error)
        } else {
          templateInstance.$('#customStartDate').removeClass('is-invalid')
          templateInstance.$('#customEndDate').removeClass('is-invalid')
          templateInstance.$('.js-custom-period-modal').modal('toggle')
        }
      })
    } else {
      templateInstance.$('#customStartDate').addClass('is-invalid')
      templateInstance.$('#customEndDate').addClass('is-invalid')
    }
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
})

Template.periodpicker.helpers({
  startDate: () => (getUserSetting('customStartDate') ? dayjs.utc(getUserSetting('customStartDate')).format('YYYY-MM-DD') : dayjs.utc().startOf('month').format('YYYY-MM-DD')),
  endDate: () => (getUserSetting('customEndDate') ? dayjs.utc(getUserSetting('customEndDate')).format('YYYY-MM-DD') : dayjs.utc().format('YYYY-MM-DD')),
})
