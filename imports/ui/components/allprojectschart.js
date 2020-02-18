import './allprojectschart.html'
import hex2rgba from '../../utils/hex2rgba.js'
import { getGlobalSetting } from '../../utils/frontend_helpers'

Template.allprojectschart.onCreated(function allprojectschartCreated() {
  // this.resources = new ReactiveVar()
  this.topTasks = new ReactiveVar()
  this.projectStats = new ReactiveVar()
  this.autorun(() => {
    // this.subscribe('topTasks', { projectId: this.data.projectId })
    // console.log(TopTasks.find({}, { $sort: { count: 1 } }).fetch())
    Meteor.call('getAllProjectStats', (error, result) => {
      if (error) {
        console.error(error)
      } else {
        this.projectStats.set(result)
      }
    })
    Meteor.call('getTopTasks', { projectId: 'all' }, (error, result) => {
      if (error) {
        console.error(error)
      } else {
        this.topTasks.set(result)
      }
    })
  })
})
Template.allprojectschart.helpers({
  topTasks() {
    return Template.instance().topTasks.get()
  },
  totalHours() {
    return Template.instance().projectStats.get()
      ? Template.instance().projectStats.get().totalHours : false
  },
})
Template.allprojectschart.onRendered(function allprojectschartRendered() {
  const templateInstance = Template.instance()
  let precision = getGlobalSetting('precision')
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
    precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : getGlobalSetting('precision')
  }
  import('chart.js').then((chartModule) => {
    const Chart = chartModule.default
    this.autorun(() => {
      if (this.subscriptionsReady()) {
        if (templateInstance.projectStats.get()) {
          this.$('.js-hour-chart').remove()
          this.$('.js-chart-container').html('<canvas class="js-hour-chart"></canvas>')
          const stats = templateInstance.projectStats.get()
          if (Meteor.user().profile.timeunit === 'd') {
            stats.beforePreviousMonthHours
              /= Meteor.user().profile.hoursToDays
                ? Meteor.user().profile.hoursToDays : getGlobalSetting('hoursToDays')
            stats.beforePreviousMonthHours = Number(stats.beforePreviousMonthHours)
              .toFixed(precision)
            stats.previousMonthHours
              /= Meteor.user().profile.hoursToDays
                ? Meteor.user().profile.hoursToDays : getGlobalSetting('hoursToDays')
            stats.previousMonthHours = Number(stats.previousMonthHours)
              .toFixed(precision)
            stats.currentMonthHours
              /= Meteor.user().profile.hoursToDays
                ? Meteor.user().profile.hoursToDays : getGlobalSetting('hoursToDays')
            stats.currentMonthHours = Number(stats.currentMonthHours).toFixed(precision)
          }
          if (this.$('.js-hour-chart')[0]) {
            const ctx = this.$('.js-hour-chart')[0].getContext('2d')
            templateInstance.chart = new Chart(ctx, {
              type: 'line',
              data: {
                labels:
                [stats.beforePreviousMonthName, stats.previousMonthName, stats.currentMonthName],
                datasets: [{
                  fill: true,
                  lineTension: 0.1,
                  backgroundColor: hex2rgba('#009688', 40), // 'rgba(75,192,192,0.4)',
                  borderColor: hex2rgba('#009688', 80), // 'rgba(0, 150, 136, 0.8)',
                  borderWidth: 0,
                  borderCapStyle: 'butt',
                  borderDash: [],
                  borderDashOffset: 0.0,
                  borderJoinStyle: 'miter',
                  pointBorderColor: hex2rgba('#009688', 80), // 'rgba(0, 150, 136, 0.8)',
                  pointBackgroundColor: '#fff',
                  pointBorderWidth: 1,
                  pointHoverRadius: 5,
                  pointHoverBackgroundColor: hex2rgba('#009688', 80), // 'rgba(0, 150, 136, 0.8)',
                  pointHoverBorderColor: 'rgba(220,220,220,1)',
                  pointHoverBorderWidth: 2,
                  pointRadius: 1,
                  pointHitRadius: 10,
                  spanGaps: false,
                  data:
                  [stats.beforePreviousMonthHours,
                    stats.previousMonthHours,
                    stats.currentMonthHours],
                }],
              },
              options: {
                legend: {
                  display: false,
                },
                aspectRatio: 3.2,
                scales: {
                  yAxes: [{ display: false }],
                },
              },
            })
          }
          if (templateInstance.topTasks.get()) {
            this.$('.js-pie-chart-top-tasks').remove()
            this.$('.js-pie-chart-container').html('<canvas class="js-pie-chart-top-tasks"></canvas>')
            if (this.$('.js-pie-chart-top-tasks')[0]) {
              const ctx = this.$('.js-pie-chart-top-tasks')[0].getContext('2d')
              this.piechart = new Chart(ctx, {
                type: 'pie',
                data: {
                  labels: templateInstance.topTasks.get().map((task) => task._id),
                  datasets: [{
                    backgroundColor: [hex2rgba('#009688', 40), 'rgba(0, 150, 136, 0.6)', '#e4e4e4'],
                    borderWidth: 0,
                    data: templateInstance.topTasks.get().map((task) => task.count),
                  }],
                },
                options: {
                  legend: {
                    display: false,
                  },
                },
              })
            }
          }
        }
      }
    })
  })
})
Template.allprojectschart.onDestroyed(() => {
  if (Template.instance().chart) {
    Template.instance().chart.destroy()
  }
})
