import dayjs from 'dayjs'
import i18next from 'i18next'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { saveAs } from 'file-saver'
import { NullXlsx } from '@neovici/nullxlsx'
import './dailytimetable.html'
import './pagination.js'
import './limitpicker.js'
import i18nextReady from '../../startup/client/startup.js'
import { getGlobalSetting } from '../../utils/frontend_helpers'

Template.dailytimetable.onCreated(function dailytimetablecreated() {
  this.dailyTimecards = new ReactiveVar()
  this.totalEntries = new ReactiveVar()
  Tracker.autorun(() => {
    if (this.data.project.get()
      && this.data.resource.get()
      && this.data.period.get()
      && this.data.limit.get()
      && this.data.customer.get()) {
      Meteor.call('getDailyTimecards',
        {
          projectId: this.data.project.get(),
          userId: this.data.resource.get(),
          period: this.data.period.get(),
          limit: this.data.limit.get(),
          customer: this.data.customer.get(),
          page: Number(FlowRouter.getQueryParam('page')),
        }, (error, result) => {
          if (error) {
            console.error(error)
          } else {
            this.dailyTimecards.set(result.dailyHours.sort((a, b) => b.date - a.date))
            this.totalEntries.set(result.totalEntries)
          }
        })
    }
  })
})
Template.dailytimetable.onRendered(() => {
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    if (templateInstance.subscriptionsReady() && i18nextReady.get()) {
      let data = []
      if (templateInstance.dailyTimecards.get()) {
        data = templateInstance.dailyTimecards.get()
          .map((entry) => Object.entries(entry)
            .map((key) => { if (key[1] instanceof Date) { return dayjs(key[1]).format(getGlobalSetting('dateformat')) } return key[1] }))
      }
      const columns = [
        {
          name: i18next.t('globals.date'),
          editable: false,
          width: 1,
          compareValue: (cell, keyword) => [dayjs(cell, getGlobalSetting('dateformat')).toDate(), dayjs(keyword, getGlobalSetting('dateformat')).toDate()],
        },
        { name: i18next.t('globals.project'), editable: false, width: 2 },
        { name: i18next.t('globals.resource'), editable: false, width: 2 },
        {
          name: Meteor.user() && Meteor.user().profile.timeunit === 'd' ? i18next.t('globals.day_plural') : i18next.t('globals.hour_plural'),
          editable: false,
          width: 1,
          format: (value) => value.toFixed(Meteor.user().profile.precision
            ? Meteor.user().profile.precision : getGlobalSetting('precision')),
        },
      ]
      if (!templateInstance.datatable) {
        import('frappe-datatable/dist/frappe-datatable.css').then(() => {
          import('frappe-datatable').then((datatable) => {
            const DataTable = datatable.default
            try {
              templateInstance.datatable = new DataTable('#datatable-container', {
                columns,
                serialNoColumn: false,
                clusterize: false,
                layout: 'ratio',
                showTotalRow: true,
                data,
                noDataMessage: i18next.t('tabular.sZeroRecords'),
              })
            } catch (error) {
              console.error(`Caught error: ${error}`)
            }
          })
        })
      }
      if (templateInstance.datatable && templateInstance.dailyTimecards.get()
        && window.BootstrapLoaded.get()) {
        templateInstance.datatable
          .refresh(data, columns)
        if (templateInstance.dailyTimecards.get().length === 0) {
          $('.dt-scrollable').height('auto')
        } else {
          $('[data-toggle="tooltip"]').tooltip()
        }
      }
    }
  })
})
Template.dailytimetable.helpers({
  dailyTimecards() {
    return Template.instance().dailyTimecards.get()
  },
  totalEntries() {
    return Template.instance().totalEntries
  },
})
Template.dailytimetable.events({
  'click .js-export-csv': (event, templateInstance) => {
    event.preventDefault()
    let unit = i18next.t('globals.hour_plural')
    if (Meteor.user()) {
      unit = Meteor.user().profile.timeunit === 'd' ? i18next.t('globals.day_plural') : i18next.t('globals.hour_plural')
    }
    const csvArray = [`\uFEFF${i18next.t('globals.date')},${i18next.t('globals.project')},${i18next.t('globals.resource')},${unit}\r\n`]
    for (const timeEntry of templateInstance.dailyTimecards.get()) {
      csvArray.push(`${dayjs(timeEntry.date).format(getGlobalSetting('dateformat'))},${timeEntry.projectId},${timeEntry.userId},${timeEntry.totalHours}\r\n`)
    }
    saveAs(new Blob(csvArray, { type: 'text/csv;charset=utf-8;header=present' }), `titra_daily_time_${templateInstance.data.period.get()}.csv`)
  },
  'click .js-export-xlsx': (event, templateInstance) => {
    event.preventDefault()
    let unit = i18next.t('globals.hour_plural')
    if (Meteor.user()) {
      unit = Meteor.user().profile.timeunit === 'd' ? i18next.t('globals.day_plural') : i18next.t('globals.hour_plural')
    }
    const data = [[i18next.t('globals.date'), i18next.t('globals.project'), i18next.t('globals.resource'), unit]]
    for (const timeEntry of templateInstance.dailyTimecards.get()) {
      data.push([dayjs(timeEntry.date).format(getGlobalSetting('dateformat')), timeEntry.projectId, timeEntry.userId, timeEntry.totalHours])
    }
    saveAs(new NullXlsx('temp.xlsx', { frozen: 1, filter: 1 }).addSheetFromData(data, 'daily').createDownloadUrl(), `titra_daily_time_${templateInstance.data.period.get()}.xlsx`)
  },
})
Template.dailytimetable.onDestroyed(() => {
  FlowRouter.setQueryParams({ page: null })
})
