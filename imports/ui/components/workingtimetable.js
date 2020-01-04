import moment from 'moment'
import i18next from 'i18next'
import DataTable from 'frappe-datatable'
import 'frappe-datatable/dist/frappe-datatable.css'
import { saveAs } from 'file-saver'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import i18nextReady from '../../startup/client/startup.js'
import './workingtimetable.html'
import './pagination.js'

Template.workingtimetable.onCreated(function workingtimetableCreated() {
  this.workingTimeEntries = new ReactiveVar([])
  this.totalWorkingTimeEntries = new ReactiveVar()

  Tracker.autorun(() => {
    if (this.data.project.get()
      && this.data.resource.get()
      && this.data.period.get()
      && this.data.limit.get()) {
      Meteor.call('getWorkingHoursForPeriod',
        {
          projectId: this.data.project.get(),
          userId: this.data.resource.get(),
          period: this.data.period.get(),
          limit: this.data.limit.get(),
          page: Number(FlowRouter.getQueryParam('page')),
        }, (error, result) => {
          if (error) {
            console.error(error)
          } else {
            this.workingTimeEntries.set(result.workingHours.sort((a, b) => a.date - b.date))
            this.totalWorkingTimeEntries.set(result.totalEntries)
          }
        })
    }
  })
})
Template.workingtimetable.onRendered(() => {
  Template.instance().autorun(() => {
    if (Template.instance().subscriptionsReady() && i18nextReady.get()) {
      const columns = [
        {
          name: i18next.t('globals.date'),
          editable: false,
          compareValue: (cell, keyword) => [moment(cell, 'DD.MM.YYYY').toDate(), moment(keyword, 'DD.MM.YYYY').toDate()],
        },
        { name: i18next.t('globals.resource'), editable: false },
        { name: i18next.t('details.startTime'), editable: false },
        { name: i18next.t('details.breakStartTime'), editable: false },
        { name: i18next.t('details.breakEndTime'), editable: false },
        { name: i18next.t('details.endTime'), editable: false },
        { name: i18next.t('details.totalTime'), editable: false },
        { name: i18next.t('details.regularWorkingTime'), editable: false },
        { name: i18next.t('details.regularWorkingTimeDifference'), editable: false }]
      Template.instance().datatable = new DataTable('#datatable-container', {
        columns,
        serialNoColumn: false,
        clusterize: false,
        layout: 'ratio',
        showTotalRow: true,
        noDataMessage: i18next.t('tabular.sZeroRecords'),
      })
      Template.instance().datatable
        .refresh(Template.instance().workingTimeEntries.get()
          .map((entry) => Object.entries(entry)
            .map((key) => { if (key[1] instanceof Date) { return moment(key[1]).format('DD.MM.YYYY') } return key[1] })), columns)
    }
  })
})
Template.workingtimetable.helpers({
  workingTimeEntries() {
    return Template.instance().workingTimeEntries.get()
  },
  workingTimeSum() {
    return Template.instance().workingTimeEntries.get()
      .reduce(((total, element) => total + element.totalTime), 0)
  },
  regularWorkingTimeSum() {
    return Template.instance().workingTimeEntries.get()
      .reduce(((total, element) => total + element.regularWorkingTime), 0)
  },
  regularWorkingTimeDifferenceSum() {
    return Template.instance().workingTimeEntries.get()
      .reduce(((total, element) => total + element.regularWorkingTimeDifference), 0)
  },
  totalWorkingTimeEntries() {
    return Template.instance().totalWorkingTimeEntries
  },
  moment(date) {
    return moment(date).format('ddd DD.MM.YYYY')
  },
})
Template.workingtimetable.events({
  'click .js-export-csv': (event, templateInstance) => {
    event.preventDefault()
    const csvArray = [`\uFEFF${i18next.t('globals.date')},${i18next.t('globals.resource')}    ,${i18next.t('details.startTime')},${i18next.t('details.breakStartTime')},${i18next.t('details.breakEndTime')},${i18next.t('details.endTime')},${i18next.t('details.totalTime')},${i18next.t('details.regularWorkingTime')},${i18next.t('details.regularWorkingTimeDifference')}\r\n`]
    for (const timeEntry of templateInstance.workingTimeEntries.get()) {
      csvArray.push(`${moment(timeEntry.date).format('ddd DD.MM.YYYY')},${timeEntry.resource},${timeEntry.startTime},${timeEntry.breakStartTime},${timeEntry.breakEndTime},${timeEntry.endTime},${timeEntry.totalTime},${timeEntry.regularWorkingTime},${timeEntry.regularWorkingTimeDifference}\r\n`)
    }
    saveAs(new Blob(csvArray, { type: 'text/csv;charset=utf-8;header=present' }), `titra_working_time_${templateInstance.data.period.get()}.csv`)
  },
})
Template.workingtimetable.onDestroyed(() => {
  FlowRouter.setQueryParams({ page: null })
})
