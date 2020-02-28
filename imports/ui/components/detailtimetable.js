import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import i18next from 'i18next'
import { saveAs } from 'file-saver'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { NullXlsx } from '@neovici/nullxlsx'
import Timecards from '../../api/timecards/timecards'
import i18nextReady from '../../startup/client/startup.js'
import {
  addToolTipToTableCell,
  timeInUserUnit,
  getGlobalSetting,
  numberWithUserPrecision,
} from '../../utils/frontend_helpers'
import projectUsers from '../../api/users/users.js'
import Projects from '../../api/projects/projects'
import { buildDetailedTimeEntriesForPeriodSelector } from '../../utils/server_method_helpers'
import './detailtimetable.html'
import './pagination.js'
import './limitpicker.js'

const Counts = new Mongo.Collection('counts')

dayjs.extend(utc)

function detailedDataTableMapper(entry) {
  const mapping = [Projects.findOne({ _id: entry.projectId }) ? Projects.findOne({ _id: entry.projectId }).name : '',
    dayjs.utc(entry.date).format(getGlobalSetting('dateformat')),
    entry.task,
    projectUsers.findOne() ? projectUsers.findOne().users.find((elem) => elem._id === entry.userId).profile.name : '',
    Number(timeInUserUnit(entry.hours)),
    entry.state,
    entry._id]
  if (!getGlobalSetting('useState')) {
    mapping.splice(5, 1)
  }
  return mapping
}
Template.detailtimetable.onCreated(function workingtimetableCreated() {
  this.totalDetailTimeEntries = new ReactiveVar()
  this.search = new ReactiveVar()
  this.sort = new ReactiveVar()
  this.tcid = new ReactiveVar()
  this.autorun(() => {
    if (this.data.project.get()
      && this.data.resource.get()
      && this.data.customer.get()
      && this.data.period.get()
      && this.data.limit.get()) {
      this.myProjectsHandle = this.subscribe('myprojects')
      this.projectUsersHandle = this.subscribe('projectUsers', { projectId: this.data.project.get() })
      this.detailedEntriesPeriodCountHandle = this.subscribe('getDetailedTimeEntriesForPeriodCount',
        {
          projectId: this.data.project.get(),
          userId: this.data.resource.get(),
          customer: this.data.customer.get(),
          period: this.data.period.get(),
          limit: this.data.limit.get(),
          search: this.search.get(),
          page: Number(FlowRouter.getQueryParam('page')),
        })
      this.detailedTimeEntriesForPeriodHandle = this.subscribe('getDetailedTimeEntriesForPeriod',
        {
          projectId: this.data.project.get(),
          userId: this.data.resource.get(),
          customer: this.data.customer.get(),
          period: this.data.period.get(),
          limit: this.data.limit.get(),
          search: this.search.get(),
          sort: this.sort.get(),
          page: Number(FlowRouter.getQueryParam('page')),
        })
    }
  })
})
Template.detailtimetable.onRendered(() => {
  const templateInstance = Template.instance()
  dayjs.extend(utc)
  templateInstance.autorun(() => {
    if (templateInstance.detailedTimeEntriesForPeriodHandle.ready() && i18nextReady.get()) {
      const selector = buildDetailedTimeEntriesForPeriodSelector({
        projectId: templateInstance.data.project.get(),
        search: templateInstance.search.get(),
        customer: templateInstance.data.customer.get(),
        period: templateInstance.data.period.get(),
        userId: templateInstance.data.resource.get(),
        limit: templateInstance.data.limit.get(),
        page: Number(FlowRouter.getQueryParam('page')),
        sort: templateInstance.sort.get(),
      })
      delete selector[1].skip
      const data = Timecards.find(selector[0], selector[1]).fetch().map(detailedDataTableMapper)
      if (data.length === 0) {
        $('.dt-row-totalRow').remove()
      }
      const columns = [
        { name: i18next.t('globals.project'), editable: false, format: addToolTipToTableCell },
        {
          name: i18next.t('globals.date'),
          editable: false,
          compareValue: (cell, keyword) => [dayjs.utc(cell, getGlobalSetting('dateformat')).toDate(), dayjs(keyword, getGlobalSetting('dateformat')).toDate()],
          format: addToolTipToTableCell,
        },
        { name: i18next.t('globals.task'), editable: false, format: addToolTipToTableCell },
        { name: i18next.t('globals.resource'), editable: false, format: addToolTipToTableCell },
        {
          name: Meteor.user() && Meteor.user().profile && Meteor.user().profile.timeunit === 'd' ? i18next.t('globals.day_plural') : i18next.t('globals.hour_plural'),
          editable: false,
          format: numberWithUserPrecision,
        },
        {
          name: i18next.t('details.state'),
          editable: true,
          format: (value) => {
            if (value === null) {
              return ''
            }
            return value ? addToolTipToTableCell(i18next.t(`details.${value}`)) : addToolTipToTableCell(i18next.t('details.new'))
          },
        },
        {
          name: i18next.t('navigation.edit'),
          editable: false,
          dropdown: false,
          focusable: false,
          format: (value) => (value && Timecards.findOne({ _id: value }).userId === Meteor.userId()
            ? `<div class="text-center">
                <a href="#" class="js-edit" data-id="${value}"><i class="fa fa-edit"></i></a>
                <a href="#" class="js-delete" data-id="${value}"><i class="fa fa-trash"></i></a>
              </div`
            : ''),
        }]
      if (!getGlobalSetting('useState')) {
        columns.splice(5, 1)
      }
      if (!templateInstance.datatable) {
        import('frappe-datatable/dist/frappe-datatable.css').then(() => {
          import('frappe-datatable').then((datatable) => {
            const DataTable = datatable.default
            const datatableConfig = {
              columns,
              data,
              serialNoColumn: false,
              clusterize: false,
              layout: 'fluid',
              showTotalRow: true,
              noDataMessage: i18next.t('tabular.sZeroRecords'),
              events: {
                onSortColumn(column) {
                  if (column) {
                    templateInstance.sort.set({ column: column.colIndex, order: column.sortOrder })
                  }
                },
              },
            }
            if (getGlobalSetting('useState')) {
              datatableConfig.getEditor = (colIndex, rowIndex, value, parent, column, row, editorData) => {
                if (colIndex === '5' && Timecards.findOne({ _id: editorData[6] }).userId === Meteor.userId() && rowIndex !== 'totalRow') {
                  const $select = document.createElement('select')
                  $select.classList = 'form-control'
                  parent.style.padding = 0
                  $select.options.add(new Option(i18next.t('details.new'), 'new'))
                  $select.options.add(new Option(i18next.t('details.exported'), 'exported'))
                  $select.options.add(new Option(i18next.t('details.billed'), 'billed'))
                  $select.options.add(new Option(i18next.t('details.notBillable'), 'notBillable'))

                  parent.appendChild($select)
                  return {
                    initValue(initValue) {
                      $select.focus()
                      if (initValue) {
                        $($select).val(initValue)
                      } else {
                        $select.selectedIndex = 0
                      }
                    },
                    setValue(setValue) {
                      Meteor.call('setTimeEntriesState', { timeEntries: [editorData[6]], state: setValue }, (error) => {
                        if (error) {
                          console.error(error)
                        } else {
                          $.notify(i18next.t('notifications.time_entry_updated'))
                        }
                      })
                    },
                    getValue() {
                      return $($select).val()
                    },
                  }
                }
                return null
              }
            }
            try {
              templateInstance.datatable = new DataTable('#datatable-container', datatableConfig)
            } catch (error) {
              console.error(`Caught error: ${error}`)
            }
          })
        })
      } else {
        try {
          templateInstance.datatable.refresh(data, columns)
        } catch (error) {
          console.error(`Caught error: ${error}`)
        }
      }
      templateInstance.totalDetailTimeEntries
        .set(Counts.findOne({ _id: templateInstance.data.project.get() })
          ? Counts.findOne({ _id: templateInstance.data.project.get() }).count : 0)
      if (window.BootstrapLoaded.get()) {
        if (data.length === 0) {
          $('.dt-scrollable').height('auto')
        } else {
          $('[data-toggle="tooltip"]').tooltip()
        }
      }
    }
  })
})
Template.detailtimetable.helpers({
  detailTimeEntries() {
    const selector = buildDetailedTimeEntriesForPeriodSelector({
      projectId: Template.instance().data.project.get(),
      search: Template.instance().search.get(),
      customer: Template.instance().data.customer.get(),
      period: Template.instance().data.period.get(),
      userId: Template.instance().data.resource.get(),
      limit: Template.instance().data.limit.get(),
      page: Number(FlowRouter.getQueryParam('page')),
      sort: Template.instance().sort.get(),
    })
    delete selector[1].skip
    return Timecards.find(selector[0], selector[1]).fetch()
  },
  detailTimeSum() {
    const selector = buildDetailedTimeEntriesForPeriodSelector({
      projectId: Template.instance().data.project.get(),
      search: Template.instance().search.get(),
      customer: Template.instance().data.customer.get(),
      period: Template.instance().data.period.get(),
      userId: Template.instance().data.resource.get(),
      limit: Template.instance().data.limit.get(),
      page: Number(FlowRouter.getQueryParam('page')),
      sort: Template.instance().sort.get(),
    })
    delete selector[1].skip
    return timeInUserUnit(Timecards.find(selector[0], selector[1]).fetch()
      .reduce(((total, element) => total + element.hours), 0))
  },
  totalDetailTimeEntries() {
    return Template.instance().totalDetailTimeEntries
  },
  tcid() { return Template.instance().tcid },
  showInvoiceButton: () => (Meteor.user() && Meteor.user().profile && Meteor.user().profile.siwappurl) || getGlobalSetting('useState'),
})
Template.detailtimetable.events({
  'click .js-export-csv': (event, templateInstance) => {
    event.preventDefault()
    const selector = buildDetailedTimeEntriesForPeriodSelector({
      projectId: Template.instance().data.project.get(),
      search: Template.instance().search.get(),
      customer: Template.instance().data.customer.get(),
      period: Template.instance().data.period.get(),
      userId: Template.instance().data.resource.get(),
      limit: Template.instance().data.limit.get(),
      page: Number(FlowRouter.getQueryParam('page')),
      sort: Template.instance().sort.get(),
    })
    delete selector[1].skip
    let csvArray
    if (getGlobalSetting('useState')) {
      csvArray = [`\uFEFF${i18next.t('globals.project')},${i18next.t('globals.date')},${i18next.t('globals.task')},${i18next.t('globals.resource')},${Meteor.user() && Meteor.user().profile.timeunit === 'd' ? i18next.t('globals.day_plural') : i18next.t('globals.hour_plural')},${i18next.t('details.state')}\r\n`]
    } else {
      csvArray = [`\uFEFF${i18next.t('globals.project')},${i18next.t('globals.date')},${i18next.t('globals.task')},${i18next.t('globals.resource')},${Meteor.user() && Meteor.user().profile.timeunit === 'd' ? i18next.t('globals.day_plural') : i18next.t('globals.hour_plural')}\r\n`]
    }
    for (const timeEntry of Timecards.find(selector[0], selector[1]).fetch()
      .map(detailedDataTableMapper)) {
      if (getGlobalSetting('useState')) {
        csvArray.push(`${timeEntry[0]},${timeEntry[1]},${timeEntry[2]},${timeEntry[3]},${timeEntry[4]},${i18next.t(`details.${timeEntry[5]}`)}\r\n`)
      } else {
        csvArray.push(`${timeEntry[0]},${timeEntry[1]},${timeEntry[2]},${timeEntry[3]},${timeEntry[4]}\r\n`)
      }
    }
    saveAs(new Blob(csvArray, { type: 'text/csv;charset=utf-8;header=present' }),
      `titra_export_${dayjs().format('YYYYMMDD-HHmm')}_${$('#resourceselect option:selected').text().replace(' ', '_').toLowerCase()}.csv`)
    Meteor.call('setTimeEntriesState', { timeEntries: Timecards.find(selector[0], selector[1]).fetch().map((entry) => entry._id), state: 'exported' }, (error) => {
      if (error) {
        console.error(error)
      }
    })
  },
  'click .js-export-xlsx': (event, templateInstance) => {
    event.preventDefault()
    const selector = buildDetailedTimeEntriesForPeriodSelector({
      projectId: Template.instance().data.project.get(),
      search: Template.instance().search.get(),
      customer: Template.instance().data.customer.get(),
      period: Template.instance().data.period.get(),
      userId: Template.instance().data.resource.get(),
      limit: Template.instance().data.limit.get(),
      page: Number(FlowRouter.getQueryParam('page')),
      sort: Template.instance().sort.get(),
    })
    delete selector[1].skip
    let data
    if (getGlobalSetting('useState')) {
      data = [[i18next.t('globals.project'), i18next.t('globals.date'), i18next.t('globals.task'), i18next.t('globals.resource'), Meteor.user() && Meteor.user().profile.timeunit === 'd' ? i18next.t('globals.day_plural') : i18next.t('globals.hour_plural'), i18next.t('details.state')]]
    } else {
      data = [[i18next.t('globals.project'), i18next.t('globals.date'), i18next.t('globals.task'), i18next.t('globals.resource'), Meteor.user() && Meteor.user().profile.timeunit === 'd' ? i18next.t('globals.day_plural') : i18next.t('globals.hour_plural')]]
    }
    for (const timeEntry of Timecards.find(selector[0], selector[1]).fetch()
      .map(detailedDataTableMapper)) {
      if (getGlobalSetting('useState')) {
        data.push([timeEntry[0], timeEntry[1], timeEntry[2], timeEntry[3], timeEntry[4], i18next.t(`details.${timeEntry[5]}`)])
      } else {
        data.push([timeEntry[0], timeEntry[1], timeEntry[2], timeEntry[3], timeEntry[4]])
      }
    }
    saveAs(new NullXlsx('temp.xlsx', { frozen: 1, filter: 1 }).addSheetFromData(data, 'titra export').createDownloadUrl(),
      `titra_export_${dayjs().format('YYYYMMDD-HHmm')}_${$('#resourceselect option:selected').text().replace(' ', '_').toLowerCase()}.xlsx`)
    Meteor.call('setTimeEntriesState', { timeEntries: Timecards.find(selector[0], selector[1]).fetch().map((entry) => entry._id), state: 'exported' }, (error) => {
      if (error) {
        console.error(error)
      }
    })
  },
  'click .js-track-time': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.tcid.set(undefined)
    $('#edit-tc-entry-modal').modal({ focus: false })
    // FlowRouter.go('tracktime', { projectId: templateInstance.$('.js-target-project').val() })
  },
  'click .js-share': (event, templateInstance) => {
    event.preventDefault()
    if ($('#period').val() === 'all' || $('.js-target-project').val() === 'all') {
      $.notify({ message: i18next.t('notifications.sanity') }, { type: 'danger' })
      return
    }
    Meteor.call('addDashboard', {
      projectId: $('.js-target-project').val(), resourceId: $('#resourceselect').val(), customer: $('#customerselect').val(), timePeriod: $('#period').val(),
    }, (error, _id) => {
      if (error) {
        $.notify({ message: i18next.t('notifications.dashboard_creation_failed', { error }) }, { type: 'danger' })
        // console.error(error)
      } else {
        $('#dashboardURL').val(FlowRouter.url('dashboard', { _id }))
        $('.js-dashboard-modal').modal('toggle')
        // FlowRouter.go('dashboard', { _id })
      }
    })
  },
  'click .js-invoice': (event, templateInstance) => {
    event.preventDefault()
    if (Meteor.user().profile.siwappurl && Meteor.user().profile.siwapptoken) {
      Meteor.call('sendToSiwapp', {
        projectId: $('.js-target-project').val(), timePeriod: $('#period').val(), userId: $('#resourceselect').val(), customer: $('#customerselect').val(),
      }, (error, result) => {
        if (error) {
          $.notify({ message: i18next.t('notifications.export_failed', { error }) }, { type: 'danger' })
        } else {
          $.notify(result)
        }
      })
    } else {
      const selector = buildDetailedTimeEntriesForPeriodSelector({
        projectId: Template.instance().data.project.get(),
        search: Template.instance().search.get(),
        customer: Template.instance().data.customer.get(),
        period: Template.instance().data.period.get(),
        userId: Template.instance().data.resource.get(),
        limit: Template.instance().data.limit.get(),
        page: Number(FlowRouter.getQueryParam('page')),
        sort: Template.instance().sort.get(),
      })
      delete selector[1].skip
      Meteor.call('setTimeEntriesState', { timeEntries: Timecards.find(selector[0], selector[1]).fetch().map((entry) => entry._id), state: 'billed' }, (error) => {
        if (error) {
          console.error(error)
        } else {
          $.notify({ message: i18next.t('notifications.time_entry_updated') })
        }
      })
    }
  },
  'click .js-delete': (event, templateInstance) => {
    event.preventDefault()
    window.bootbox.confirm(i18next.t('notifications.delete_confirm'), (result) => {
      if (result) {
        Meteor.call('deleteTimeCard', { timecardId: templateInstance.$(event.currentTarget).data('id') }, (error, result) => {
          if (!error) {
            $.notify(i18next.t('notifications.time_entry_deleted'))
          } else {
            console.error(error)
          }
        })
      }
    })
  },
  'click .js-edit': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.tcid.set(templateInstance.$(event.currentTarget).data('id'))
    $('#edit-tc-entry-modal').modal({ focus: false })
  },
  'change .js-search': (event, templateInstance) => {
    templateInstance.search.set($(event.currentTarget).val())
  },
  'change .js-project-filter>.js-target-project': (event, templateInstance) => {
    templateInstance.data.project.set(templateInstance.$('.js-target-project').val())
  },
})
Template.detailtimetable.onDestroyed(() => {
  FlowRouter.setQueryParams({ page: null })
  Template.instance().datatable.destroy()
  Template.instance().datatable = undefined
})
