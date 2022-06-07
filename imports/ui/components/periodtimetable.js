import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { saveAs } from 'file-saver'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { NullXlsx } from '@neovici/nullxlsx'
import './periodtimetable.html'
import './pagination.js'
import './limitpicker.js'
import { i18nReady, t } from '../../utils/i18n.js'
import {
  numberWithUserPrecision,
  getUserSetting,
  getUserTimeUnitVerbose,
  addToolTipToTableCell,
} from '../../utils/frontend_helpers.js'
import { totalHoursForPeriodMapper } from '../../utils/server_method_helpers.js'

Template.periodtimetable.onCreated(function periodtimetableCreated() {
  dayjs.extend(utc)
  this.periodTimecards = new ReactiveVar()
  this.totalPeriodTimeCards = new ReactiveVar()
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
        customer: this.data.customer.get(),
        limit: this.data.limit.get(),
        page: Number(FlowRouter.getQueryParam('page')),
      }
      if (this.data.period.get() === 'custom') {
        methodParameters.dates = {
          startDate: getUserSetting('customStartDate') ? getUserSetting('customStartDate') : dayjs.utc().startOf('month').toDate(),
          endDate: getUserSetting('customEndDate') ? getUserSetting('customEndDate') : dayjs.utc().toDate(),
        }
      }
      Meteor.call('getTotalHoursForPeriod', methodParameters, (error, result) => {
        if (error) {
          console.error(error)
        } else {
          this.periodTimecards.set(result.totalHours)
          this.totalPeriodTimeCards.set(result.totalEntries)
        }
      })
    }
  })
})
Template.periodtimetable.onRendered(() => {
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    if (i18nReady.get()) {
      let data = []
      if (templateInstance.periodTimecards.get() && templateInstance.projectUsersHandle.ready()) {
        data = templateInstance.periodTimecards.get().map(totalHoursForPeriodMapper)
          .map((entry) => Object.entries(entry)
            .map((key) => key[1]))
      }
      const columns = [
        { name: t('globals.project'), editable: false, format: addToolTipToTableCell },
        { name: t('globals.resource'), editable: false, format: addToolTipToTableCell },
        {
          name: getUserTimeUnitVerbose(),
          editable: false,
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
      if (templateInstance.datatable && templateInstance.periodTimecards.get()
        && window.BootstrapLoaded.get()) {
        templateInstance.datatable
          .refresh(data, columns)
        if (templateInstance.periodTimecards.get().length === 0) {
          $('.dt-scrollable').height('auto')
        }
      }
    }
  })
})
Template.periodtimetable.helpers({
  periodTimecards() {
    return Template.instance().periodTimecards.get()
  },
  totalPeriodTimeCards() {
    return Template.instance().totalPeriodTimeCards
  },
})
Template.periodtimetable.events({
  'click .js-export-csv': (event, templateInstance) => {
    event.preventDefault()
    const csvArray = [`\uFEFF${t('globals.project')},${t('globals.resource')},${getUserTimeUnitVerbose()}\r\n`]
    for (const timeEntry of templateInstance.periodTimecards.get().map(totalHoursForPeriodMapper)) {
      csvArray.push(`${timeEntry.projectId},${timeEntry.userId},${timeEntry.totalHours}\r\n`)
    }
    saveAs(new Blob(csvArray, { type: 'text/csv;charset=utf-8;header=present' }), `titra_total_time_${templateInstance.data.period.get()}.csv`)
  },
  'click .js-export-xlsx': (event, templateInstance) => {
    event.preventDefault()
    const data = [[t('globals.project'), t('globals.resource'), getUserTimeUnitVerbose()]]
    for (const timeEntry of templateInstance.periodTimecards.get().map(totalHoursForPeriodMapper)) {
      data.push([timeEntry.projectId, timeEntry.userId, timeEntry.totalHours])
    }
    saveAs(new NullXlsx('temp.xlsx', { frozen: 1, filter: 1 }).addSheetFromData(data, 'total time').createDownloadUrl(), `titra_total_time_${templateInstance.data.period.get()}.xlsx`)
  },
})
Template.periodtimetable.onDestroyed(() => {
  FlowRouter.setQueryParams({ page: null })
  Template.instance().datatable.destroy()
  Template.instance().datatable = undefined
})
