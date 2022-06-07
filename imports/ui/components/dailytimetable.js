import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { saveAs } from 'file-saver'
import { NullXlsx } from '@neovici/nullxlsx'
import './dailytimetable.html'
import './pagination.js'
import './limitpicker.js'
import {
  getGlobalSetting,
  numberWithUserPrecision,
  getUserSetting,
  getUserTimeUnitVerbose,
  addToolTipToTableCell,
} from '../../utils/frontend_helpers'
import { i18nReady, t } from '../../utils/i18n.js'
import { dailyTimecardMapper } from '../../utils/server_method_helpers'

Template.dailytimetable.onCreated(function dailytimetablecreated() {
  dayjs.extend(utc)
  this.dailyTimecards = new ReactiveVar()
  this.totalEntries = new ReactiveVar()
  this.autorun(() => {
    if (this.data.project.get()
      && this.data.resource.get()
      && this.data.period.get()
      && this.data.limit.get()
      && this.data.customer.get()) {
      this.projectUsersHandle = this.subscribe('projectUsers', { projectId: this.data.project.get() })
      const methodParameters = {
        projectId: this.data.project.get(),
        userId: this.data.resource.get(),
        period: this.data.period.get(),
        limit: this.data.limit.get(),
        customer: this.data.customer.get(),
        page: Number(FlowRouter.getQueryParam('page')),
      }
      if (this.data.period.get() === 'custom') {
        methodParameters.dates = {
          startDate: getUserSetting('customStartDate') ? getUserSetting('customStartDate') : dayjs.utc().startOf('month').toDate(),
          endDate: getUserSetting('customEndDate') ? getUserSetting('customEndDate') : dayjs.utc().toDate(),
        }
      }
      Meteor.call('getDailyTimecards', methodParameters, (error, result) => {
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
    if (i18nReady.get()) {
      let data = []
      if (templateInstance.dailyTimecards.get() && templateInstance.projectUsersHandle.ready()) {
        data = templateInstance.dailyTimecards.get().map(dailyTimecardMapper)
          .map((entry) => Object.entries(entry)
            .map((key) => { if (key[1] instanceof Date) { return dayjs(key[1]).format(getGlobalSetting('dateformat')) } return key[1] }))
      }
      const columns = [
        {
          name: t('globals.date'),
          editable: false,
          width: 1,
          compareValue: (cell, keyword) => [dayjs(cell, getGlobalSetting('dateformat')).toDate(), dayjs(keyword, getGlobalSetting('dateformat')).toDate()],
        },
        {
          name: t('globals.project'),
          editable: false,
          width: 2,
          format: addToolTipToTableCell,
        },
        {
          name: t('globals.resource'),
          editable: false,
          width: 2,
          format: addToolTipToTableCell,
        },
        {
          name: getUserTimeUnitVerbose(),
          editable: false,
          width: 1,
          format: numberWithUserPrecision,
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
                noDataMessage: t('tabular.sZeroRecords'),
              })
            } catch (error) {
              console.error(`Caught error: ${error}`)
            }
          })
        })
      }
      if (templateInstance.datatable && templateInstance.dailyTimecards.get()
        && window.BootstrapLoaded.get() && data.length > 0) {
        try {
          templateInstance.datatable.refresh(data, columns)
        } catch (error) {
          console.error(`Caught error: ${error}`)
        }
        if (templateInstance.dailyTimecards.get().length === 0) {
          $('.dt-scrollable').height('auto')
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
    let unit = t('globals.hour_plural')
    if (Meteor.user()) {
      unit = getUserTimeUnitVerbose()
    }
    const csvArray = [`\uFEFF${t('globals.date')},${t('globals.project')},${t('globals.resource')},${unit}\r\n`]
    for (const timeEntry of templateInstance.dailyTimecards.get().map(dailyTimecardMapper)) {
      csvArray.push(`${dayjs(timeEntry.date).format(getGlobalSetting('dateformat'))},${timeEntry.projectId},${timeEntry.userId},${timeEntry.totalHours}\r\n`)
    }
    saveAs(new Blob(csvArray, { type: 'text/csv;charset=utf-8;header=present' }), `titra_daily_time_${templateInstance.data.period.get()}.csv`)
  },
  'click .js-export-xlsx': (event, templateInstance) => {
    event.preventDefault()
    let unit = t('globals.hour_plural')
    if (Meteor.user()) {
      unit = getUserTimeUnitVerbose()
    }
    const data = [[t('globals.date'), t('globals.project'), t('globals.resource'), unit]]
    for (const timeEntry of templateInstance.dailyTimecards.get().map(dailyTimecardMapper)) {
      data.push([dayjs(timeEntry.date).format(getGlobalSetting('dateformat')), timeEntry.projectId, timeEntry.userId, timeEntry.totalHours])
    }
    saveAs(new NullXlsx('temp.xlsx', { frozen: 1, filter: 1 }).addSheetFromData(data, 'daily').createDownloadUrl(), `titra_daily_time_${templateInstance.data.period.get()}.xlsx`)
  },
})
Template.dailytimetable.onDestroyed(() => {
  FlowRouter.setQueryParams({ page: null })
  Template.instance().datatable.destroy()
  Template.instance().datatable = undefined
})
