import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import dayjs from 'dayjs'
import randomColor from 'randomcolor'
import i18next from 'i18next'
import {
  emojify,
  getUserSetting,
  getGlobalSetting,
  timeInUserUnit,
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
  } else if (Meteor.user()) {
    return timeInUserUnit(hours)
  }
  return Number(hours).toFixed(getGlobalSetting('precision'))
}
function timeUnitHelper() {
  if (Dashboards.findOne()) {
    return Dashboards.findOne().timeunit === 'd' ? i18next.t('globals.day_plural') : i18next.t('globals.hour_plural')
  }
  if (Meteor.user() && getUserSetting('timeunit')) {
    return getUserSetting('timeunit') === 'd' ? i18next.t('globals.day_plural') : i18next.t('globals.hour_plural')
  }
  return getGlobalSetting('timeunit') === 'd' ? i18next.t('globals.day_plural') : i18next.t('globals.hour_plural')
}
Template.dashboard.onCreated(function dashboardCreated() {
  let handle
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
      this.subscribe('getDetailedTimeEntriesForPeriod',
        {
          projectId: this.data.project.get(),
          userId: this.data.resource.get(),
          customer: this.data.customer.get(),
          period: this.data.period.get(),
          limit: -1,
        })
    }
  })
})
Template.dashboard.onRendered(function dashboardRendered() {
  import('chart.js').then((chartModule) => {
    const Chart = chartModule.default
    this.autorun(() => {
      if (this.subscriptionsReady() && Timecards.find().fetch().length > 0) {
        let temphours = 0
        this.totalHours.set(0)
        const taskmap = new Map()
        const datemap = new Map()
        const precision = getUserSetting('precision') ? getUserSetting('precision') : getGlobalSetting('precision')
        for (const timecard of Timecards.find({}, { sort: { date: 1 } }).fetch()) {
          taskmap.set(
            timecard.task.replace(/(:.*:)/g, emojify),
            taskmap.get(timecard.task.replace(/(:.*:)/g, emojify))
              ? Number(Number(taskmap.get(timecard.task.replace(/(:.*:)/g, emojify))) + Number(timeInUnitHelper(timecard.hours))).toFixed(precision)
              : Number(timeInUnitHelper(timecard.hours)).toFixed(precision),
          )
          datemap.set(
            dayjs(timecard.date).format('DDMMYYYY'),
            datemap.get(dayjs(timecard.date).format('DDMMYYYY'))
              ? Number(Number(datemap.get(dayjs(timecard.date).format('DDMMYYYY'))) + Number(timeInUnitHelper(timecard.hours))).toFixed(precision)
              : Number(timeInUnitHelper(timecard.hours)).toFixed(precision),
          )
          temphours += timecard.hours
        }
        this.totalHours.set(temphours)
        if (this.linechart) {
          this.linechart.clear()
          this.linechart.destroy()
        }
        this.$('.js-line-chart').remove()
        this.$('.js-linechart-container').html('<canvas class="js-line-chart" style="width:100%;height:300px;"></canvas>')
        if (!this.$('.js-line-chart')[0]) {
          return
        }
        const timearray = []
        datemap.forEach((value, key) => {
          timearray.push({ t: key, y: value })
        })
        const linechartctx = this.$('.js-line-chart')[0].getContext('2d')
        this.linechart = new Chart(linechartctx, {
          type: 'bar',
          data: {
            labels:
              [...datemap.keys()],
            datasets: [{
              fill: true,
              backgroundColor: 'rgba(75,192,192,0.4)',
              borderColor: 'rgba(0, 150, 136, 0.8)',
              hoverBackgroundColor: 'rgba(0, 150, 136, 0.8)',
              hoverBorderColor: 'rgba(220,220,220,1)',
              data: timearray,
            }],
          },
          options: {
            bounds: 'ticks',
            legend: {
              display: false,
            },
            tooltips: {
              mode: 'label',
              callbacks: {
                label: (tooltipItem, data) => `${data.datasets[0].data[tooltipItem.index].y} ${timeUnitHelper()}`,
              },
            },
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true,
                },
              }],
              xAxes: [{
                type: 'time',
                distribution: 'series',
                time: {
                  unit: 'day',
                  tooltipFormat: getGlobalSetting('dateformat'),
                  parser: 'DDMMYYYY',
                },
                ticks: {
                  source: 'labels',
                },
              }],
            },
          },
        })
        if (this.piechart) {
          this.piechart.clear()
          this.piechart.destroy()
        }
        this.$('.js-pie-chart').remove()
        this.$('.js-piechart-container').html('<canvas class="js-pie-chart" style="width:100%;height:300px;"></canvas>')
        const piechartctx = this.$('.js-pie-chart')[0].getContext('2d')
        this.piechart = new Chart(piechartctx, {
          type: 'pie',
          data: {
            labels:
              [...taskmap.keys()],
            datasets: [{
              backgroundColor: randomColor({ hue: '#455A64', luminosity: 'dark', count: taskmap.size }),
              // borderColor: 'rgba(0, 150, 136, 0.8)',
              // hoverBackgroundColor: 'rgba(0, 150, 136, 0.8)',
              // hoverBorderColor: 'rgba(220,220,220,1)',
              data: [...taskmap.values()],
            }],
          },
          options: {
            tooltips: {
              mode: 'label',
              callbacks: {
                label: (tooltipItem, data) => `${data.labels[tooltipItem.index]}: ${data.datasets[0].data[tooltipItem.index]} ${timeUnitHelper()}`,
              },
            },
            legend: {
              display: [...taskmap.keys()].length < 6,
              position: 'bottom',
            },
          },
        })
      } else {
        if (this.linechart) {
          this.linechart.clear()
          this.linechart.destroy()
          delete this.linechart
        }
        if (this.piechart) {
          this.piechart.clear()
          this.piechart.destroy()
          delete this.piechart
        }
      }
    })
  })
})
Template.dashboard.helpers({
  timecards: () => (Timecards.find().fetch().length > 0 ? Timecards.find() : false),
  projectName: () => (Projects.findOne() ? Projects.findOne().name : false),
  formatDate: (date) => dayjs(date).format(getGlobalSetting('dateformatVerbose')),
  timeunit: () => timeUnitHelper(),
  startDate: () => (Dashboards.findOne() ? dayjs(Dashboards.findOne().startDate).format(getGlobalSetting('dateformat')) : false),
  endDate: () => (Dashboards.findOne() ? dayjs(Dashboards.findOne().endDate).format(getGlobalSetting('dateformat')) : false),
  dashBoardResource: () => (Dashboards.findOne()
    ? Meteor.users.findOne(Dashboards.findOne().resourceId)?.profile?.name : false),
  customer: () => (Dashboards.findOne() ? Dashboards.findOne().customer : false),
  isCustomerDashboard: () => (Dashboards.findOne() ? (Dashboards.findOne().customer && Dashboards.findOne().customer !== 'all') : false),
  timeInUnit: (hours) => timeInUnitHelper(hours),
  totalHours: () => {
    if (Dashboards.findOne()) {
      if (Dashboards.findOne().timeunit === 'd') {
        const precision = getUserSetting('precision') ? getUserSetting('precision') : getGlobalSetting('precision')
        return Dashboards.findOne().hoursToDays
          ? Number(Template.instance().totalHours.get() / Dashboards.findOne().hoursToDays)
            .toFixed(precision)
          : Number(Template.instance().totalHours.get() / getGlobalSetting('hoursToDays')).toFixed(precision)
      }
    }
    return Template.instance().totalHours.get().toFixed(getGlobalSetting('precision'))
  },
  dashboardId: () => FlowRouter.getParam('_id'),
})
