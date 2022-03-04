import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import randomColor from 'randomcolor'
import { t } from '../../utils/i18n.js'
import {
  emojify,
  getUserSetting,
  getGlobalSetting,
  timeInUserUnit,
  getUserTimeUnitVerbose,
} from '../../utils/frontend_helpers'
import './dashboard.html'
import Timecards from '../../api/timecards/timecards'
import Projects from '../../api/projects/projects'
import { Dashboards } from '../../api/dashboards/dashboards'

function timeInUnitHelper(hours) {
  if (Dashboards.findOne()) {
    if (Dashboards.findOne().timeunit === 'd') {
      return Dashboards.findOne().hoursToDays
        ? Number(hours / Dashboards.findOne().hoursToDays).toFixed(getGlobalSetting('precision')) : Number(hours / getGlobalSetting('hoursToDays')).toFixed(getGlobalSetting('precision'))
    }
    if (Dashboards.findOne().timeunit === 'm') {
      return Number(hours * 60).toFixed(getGlobalSetting('precision'))
    }
  } else if (Meteor.user()) {
    return timeInUserUnit(hours)
  }
  return Number(hours).toFixed(getGlobalSetting('precision'))
}
function timeUnitHelper() {
  if (Dashboards.findOne()) {
    switch (Dashboards.findOne().timeunit) {
      case 'd':
        return t('globals.day_plural')
      case 'h':
        return t('globals.hour_plural')
      case 'm':
        return t('globals.minute_plural')
      default:
        return t('globals.hour_plural')
    }
  }
  if (Meteor.user() && getUserSetting('timeunit')) {
    return getUserTimeUnitVerbose()
  }
  if (getGlobalSetting('timeunit') === 'd') {
    return t('globals.day_plural')
  }
  if (getGlobalSetting('timeunit') === 'h') {
    return t('globals.hour_plural')
  }
  if (getGlobalSetting('timeunit') === 'm') {
    return t('globals.minute_plural')
  }
  return t('globals.hour_plural')
}
Template.dashboard.onCreated(function dashboardCreated() {
  let handle
  dayjs.extend(utc)
  dayjs.extend(customParseFormat)
  this.totalHours = new ReactiveVar(0)
  this.autorun(() => {
    if (FlowRouter.getParam('_id')) {
      this.subscribe('dashboardByIdDetails', FlowRouter.getParam('_id'))
      // this.subscribe('dashboardAggregation', { dashboardId: FlowRouter.getParam('_id') })
      handle = this.subscribe('dashboardById', FlowRouter.getParam('_id'))
      if (handle.ready()) {
        if (Dashboards.findOne()) {
          if (Dashboards.findOne().projectId !== 'all') {
            this.subscribe('publicProjectName', Timecards.findOne().projectId)
          } else {
            this.subscribe('dashboardUser', { _id: Dashboards.findOne()._id })
          }
        }
      }
    } else if (this.data.project.get()
      && this.data.resource.get()
      && this.data.customer.get()
      && this.data.period.get() && this.data.period.get() !== 'all') {
      if (this.data.period.get() === 'custom') {
        this.detailedTimeEntriesHandle = this.subscribe('getDetailedTimeEntriesForPeriod',
          {
            projectId: this.data.project.get(),
            userId: this.data.resource.get(),
            customer: this.data.customer.get(),
            period: this.data.period.get(),
            dates: {
              startDate: getUserSetting('customStartDate') ? getUserSetting('customStartDate') : dayjs.utc().startOf('month').toDate(),
              endDate: getUserSetting('customEndDate') ? getUserSetting('customEndDate') : dayjs.utc().toDate(),
            },
            limit: -1,
          })
      } else {
        this.detailedTimeEntriesHandle = this.subscribe('getDetailedTimeEntriesForPeriod',
          {
            projectId: this.data.project.get(),
            userId: this.data.resource.get(),
            customer: this.data.customer.get(),
            period: this.data.period.get(),
            limit: -1,
          })
      }
    }
  })
})
Template.dashboard.onRendered(() => {
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    if (templateInstance.subscriptionsReady() && Timecards.find().fetch().length > 0) {
      window.requestAnimationFrame(() => {
        import('frappe-charts').then((chartModule) => {
          const { Chart } = chartModule
          if (templateInstance.linechart) {
            templateInstance.linechart.destroy()
          }
          if (templateInstance.piechart) {
            templateInstance.piechart.destroy()
          }
          let temphours = 0
          templateInstance.totalHours.set(0)
          const taskmap = new Map()
          const datemap = new Map()
          const precision = getUserSetting('precision')
          for (const timecard of Timecards.find({}, { sort: { date: 1 } }).fetch()) {
            taskmap.set(
              timecard.task.replace(/(:\S*:)/g, emojify),
              taskmap.get(timecard.task.replace(/(:\S*:)/g, emojify))
                ? Number(Number(taskmap.get(timecard.task.replace(/(:\S*:)/g, emojify))) + Number(timeInUnitHelper(timecard.hours)))
                : Number(timeInUnitHelper(timecard.hours)),
            )
            datemap.set(
              dayjs.utc(timecard.date).format('DDMMYYYY'),
              datemap.get(dayjs.utc(timecard.date).format('DDMMYYYY'))
                ? Number(Number(datemap.get(dayjs(timecard.date).format('DDMMYYYY'))) + Number(timeInUnitHelper(timecard.hours)))
                : Number(timeInUnitHelper(timecard.hours)),
            )
            temphours += timecard.hours
          }
          templateInstance.totalHours.set(temphours)
          if (templateInstance.$('.js-linechart-container')[0] && templateInstance.$('.js-piechart-container')[0]) {
            templateInstance.linechart = new Chart(templateInstance.$('.js-linechart-container')[0], {
              type: 'bar',
              colors: ['#009688'],
              data: {
                labels: [...datemap.keys()].map((value) => dayjs.utc(value, 'DDMMYYYY').format(getGlobalSetting('dateformat'))),
                datasets: [{
                  values: [...datemap.values()],
                }],
              },
              barOptions: {
                spaceRatio: 0.2, // default: 1
              },
              tooltipOptions: {
                formatTooltipY: (value) => `${Number(value).toFixed(precision)} ${getUserTimeUnitVerbose()}`,
              },
            })
            templateInstance.piechart = new Chart(templateInstance.$('.js-piechart-container')[0], {
              type: 'pie',
              colors: randomColor({ hue: '#455A64', luminosity: 'dark', count: taskmap.size }),
              maxSlices: 6,
              data: {
                labels: [...taskmap.keys()],
                datasets: [{
                  values: [...taskmap.values()],
                }],
              },
              tooltipOptions: {
                formatTooltipY: (value) => `${value} ${getUserSetting('timeunit') === 'd' ? t('globals.day_plural') : t('globals.hour_plural')}`,
              },
            })
          }
        })
      })
    } else {
      if (templateInstance.linechart) {
        templateInstance.linechart.destroy()
        templateInstance.$('.js-linechart-container')[0].innerHTML = ''
      }
      if (templateInstance.piechart) {
        templateInstance.piechart.destroy()
        templateInstance.$('.js-piechart-container')[0].innerHTML = ''
      }
    }
  })
})
Template.dashboard.helpers({
  timecards: () => (Timecards.find().fetch().length > 0 ? Timecards.find() : false),
  projectName: () => (Projects.findOne() ? Projects.findOne().name : false),
  formatDate: (date) => dayjs.utc(date).format(getGlobalSetting('dateformatVerbose')),
  timeunit: () => timeUnitHelper(),
  startDate: () => (Dashboards.findOne() ? dayjs.utc(Dashboards.findOne().startDate).format(getGlobalSetting('dateformat')) : false),
  endDate: () => (Dashboards.findOne() ? dayjs.utc(Dashboards.findOne().endDate).format(getGlobalSetting('dateformat')) : false),
  dashBoardResource: () => (Dashboards.findOne()
    ? Meteor.users.findOne(Dashboards.findOne().resourceId)?.profile?.name : false),
  customer: () => (Dashboards.findOne() ? Dashboards.findOne().customer : false),
  isCustomerDashboard: () => (Dashboards.findOne() ? (Dashboards.findOne().customer && Dashboards.findOne().customer !== 'all') : false),
  timeInUnit: (hours) => timeInUnitHelper(hours),
  totalHours: () => {
    if (Dashboards.findOne()) {
      if (Dashboards.findOne().timeunit === 'd') {
        const precision = getUserSetting('precision')
        return Dashboards.findOne().hoursToDays
          ? Number(Template.instance().totalHours.get() / Dashboards.findOne().hoursToDays)
            .toFixed(precision)
          : Number(Template.instance().totalHours.get() / getGlobalSetting('hoursToDays')).toFixed(precision)
      }
      if (Dashboards.findOne().timeunit === 'm') {
        const precision = getUserSetting('precision')
        return Dashboards.findOne().hoursToDays
          ? Number(Template.instance().totalHours.get() * 60)
            .toFixed(precision)
          : Number(Template.instance().totalHours.get() * 60).toFixed(precision)
      }
    }
    return Template.instance().totalHours.get().toFixed(getGlobalSetting('precision'))
  },
  dashboardId: () => FlowRouter.getParam('_id'),
})

Template.dashboard.onDestroyed(() => {
  const templateInstance = Template.instance()
  if (templateInstance.linechart) {
    templateInstance.linechart.destroy()
  }
  if (templateInstance.piechart) {
    templateInstance.piechart.destroy()
  }
})
