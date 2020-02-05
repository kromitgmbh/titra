import dayjs from 'dayjs'
import i18next from 'i18next'
import { saveAs } from 'file-saver'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { NullXlsx } from '@neovici/nullxlsx'
import i18nextReady from '../../startup/client/startup.js'
import { addToolTipToTableCell } from '../../utils/frontend_helpers'
import './workingtimetable.html'
import './pagination.js'
import './limitpicker.js'

Template.workingtimetable.onCreated(function workingtimetableCreated() {
  this.workingTimeEntries = new ReactiveVar()
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
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    if (templateInstance.subscriptionsReady() && i18nextReady.get()) {
      let data
      if (templateInstance.workingTimeEntries.get()) {
        data = templateInstance.workingTimeEntries.get()
          .map((entry) => Object.entries(entry)
            .map((key) => { if (key[1] instanceof Date) { return dayjs(key[1]).format('DD.MM.YYYY') } return key[1] }))
      }
      const columns = [
        {
          name: i18next.t('globals.date'),
          editable: false,
          compareValue: (cell, keyword) => [dayjs(cell, 'DD.MM.YYYY').toDate(), dayjs(keyword, 'DD.MM.YYYY').toDate()],
          format: addToolTipToTableCell,
        },
        { name: i18next.t('globals.resource'), editable: false, format: addToolTipToTableCell },
        { name: i18next.t('details.startTime'), editable: false },
        { name: i18next.t('details.breakStartTime'), editable: false },
        { name: i18next.t('details.breakEndTime'), editable: false },
        { name: i18next.t('details.endTime'), editable: false },
        { name: i18next.t('details.totalTime'), editable: false },
        { name: i18next.t('details.regularWorkingTime'), editable: false },
        { name: i18next.t('details.regularWorkingTimeDifference'), editable: false }]
      if (!templateInstance.datatable) {
        import('frappe-datatable/dist/frappe-datatable.css').then(() => {
          import('frappe-datatable').then((datatable) => {
            const DataTable = datatable.default
            templateInstance.datatable = new DataTable('#datatable-container', {
              columns,
              serialNoColumn: false,
              clusterize: false,
              layout: 'fluid',
              showTotalRow: true,
              data,
              noDataMessage: i18next.t('tabular.sZeroRecords'),
            })
          })
        })
      }
      if (templateInstance.datatable && templateInstance.workingTimeEntries.get()
        && window.BootstrapLoaded.get()) {
        templateInstance.datatable
          .refresh(data, columns)
        if (templateInstance.workingTimeEntries.get().length === 0) {
          $('.dt-scrollable').height('auto')
        } else {
          $('[data-toggle="tooltip"]').tooltip()
        }
      }
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
})
Template.workingtimetable.events({
  'click .js-export-csv': (event, templateInstance) => {
    event.preventDefault()
    const csvArray = [`\uFEFF${i18next.t('globals.date')},${i18next.t('globals.resource')},${i18next.t('details.startTime')},${i18next.t('details.breakStartTime')},${i18next.t('details.breakEndTime')},${i18next.t('details.endTime')},${i18next.t('details.totalTime')},${i18next.t('details.regularWorkingTime')},${i18next.t('details.regularWorkingTimeDifference')}\r\n`]
    for (const timeEntry of templateInstance.workingTimeEntries.get()) {
      csvArray.push(`${dayjs(timeEntry.date).format('ddd DD.MM.YYYY')},${timeEntry.resource},${timeEntry.startTime},${timeEntry.breakStartTime},${timeEntry.breakEndTime},${timeEntry.endTime},${timeEntry.totalTime},${timeEntry.regularWorkingTime},${timeEntry.regularWorkingTimeDifference}\r\n`)
    }
    saveAs(new Blob(csvArray, { type: 'text/csv;charset=utf-8;header=present' }), `titra_working_time_${templateInstance.data.period.get()}.csv`)
  },
  'click .js-export-xlsx': (event, templateInstance) => {
    event.preventDefault()
    const data = [[i18next.t('globals.date'), i18next.t('globals.resource'), i18next.t('details.startTime'), i18next.t('details.breakStartTime'), i18next.t('details.breakEndTime'), i18next.t('details.endTime'), i18next.t('details.totalTime'), i18next.t('details.regularWorkingTime'), i18next.t('details.regularWorkingTimeDifference')]]
    for (const timeEntry of templateInstance.workingTimeEntries.get()) {
      data.push([dayjs(timeEntry.date).format('ddd DD.MM.YYYY'), timeEntry.resource, timeEntry.startTime, timeEntry.breakStartTime, timeEntry.breakEndTime, timeEntry.endTime, timeEntry.totalTime, timeEntry.regularWorkingTime, timeEntry.regularWorkingTimeDifference])
    }
    saveAs(new NullXlsx('temp.xlsx', { frozen: 1, filter: 1 }).addSheetFromData(data, 'working time').createDownloadUrl(), `titra_working_time_${templateInstance.data.period.get()}.xlsx`)
  },
})
Template.workingtimetable.onDestroyed(() => {
  FlowRouter.setQueryParams({ page: null })
})
