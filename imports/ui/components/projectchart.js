import namedavatar from 'namedavatar'
import './projectchart.html'
import Projects, { ProjectStats } from '../../api/projects/projects.js'

import projectUsers from '../../api/users/users.js'
import hex2rgba from '../../utils/hex2rgba.js'


Template.projectchart.onCreated(function projectchartCreated() {
  // this.resources = new ReactiveVar()
  this.topTasks = new ReactiveVar()
  this.autorun(() => {
    this.subscribe('singleProject', this.data.projectId)
    this.subscribe('projectStats', this.data.projectId)
    this.subscribe('projectUsers', { projectId: this.data.projectId })
    // this.subscribe('topTasks', { projectId: this.data.projectId })
    // console.log(TopTasks.find({}, { $sort: { count: 1 } }).fetch())
    Meteor.call('getTopTasks', { projectId: this.data.projectId }, (error, result) => {
      if (error) {
        console.error(error)
      } else {
        this.topTasks.set(result)
      }
    })
  })
})
Template.projectchart.helpers({
  totalHours() {
    let precision = 2
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : 2
    }
    return ProjectStats.findOne({ _id: Template.instance().data.projectId })
      ? Number(ProjectStats.findOne({
        _id: Template.instance().data.projectId,
      }).totalHours).toFixed(precision)
      : false
  },
  hourIndicator() {
    const stats = ProjectStats.findOne({ _id: Template.instance().data.projectId })
    if (stats.previousMonthHours > stats.currentMonthHours) {
      return '<i class="d-md-none fa fa-arrow-circle-o-up"></i>'
    }
    if (stats.previousMonthHours < stats.currentMonthHours) {
      return '<i class="d-md-none fa fa-arrow-circle-o-down"></i>'
    }
    return '<i class="d-md-none fa fa-minus-square-o"></i>'
  },
  allTeamMembers() {
    // return Template.instance().resources.get()
    //   ? Template.instance().resources.get().map(res => res.profile.name).join(', ') : false
    return projectUsers.findOne({ _id: Template.instance().data.projectId })
      ? projectUsers.findOne({ _id: Template.instance().data.projectId }).users : false
  },
  svgAvatar(name) {
    namedavatar.config({
      nameType: 'initials',
      backgroundColors: [hex2rgba(Projects.findOne({ _id: Template.instance().data.projectId }).color || '#009688', 40), 'rgba(0, 150, 136, 0.6)', '#e4e4e4', '#BDBDBD', '#455A64'],
    })
    const rawSVG = namedavatar.getSVG(name)
    rawSVG.classList = 'rounded'
    rawSVG.style.width = '25px'
    rawSVG.style.height = '25px'
    return rawSVG.outerHTML
  },
  topTasks() {
    return Template.instance().topTasks.get()
  },
  turnOver() {
    return Projects.findOne({ _id: Template.instance().data.projectId }).rate
      && ProjectStats.findOne({ _id: Template.instance().data.projectId })
      ? Number(Projects.findOne({ _id: Template.instance().data.projectId }).rate
          * ProjectStats.findOne({ _id: Template.instance().data.projectId }).totalHours)
        .toLocaleString() : false
  },
  target() {
    return Number(Projects.findOne({ _id: Template.instance().data.projectId }).target) > 0
      ? Projects.findOne({ _id: Template.instance().data.projectId }).target : false
  },
})
Template.projectchart.onRendered(function projectchartRendered() {
  const templateInstance = Template.instance()
  let precision = 2
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
    precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : 2
  }
  import('chart.js').then((chartModule) => {
    const Chart = chartModule.default
    this.autorun(() => {
      if (this.subscriptionsReady()) {
        this.$('.js-hour-chart').remove()
        this.$('.js-chart-container').html('<canvas class="js-hour-chart"></canvas>')
        const stats = ProjectStats.findOne({ _id: this.data.projectId })
        if (stats) {
          if (Meteor.user().profile.timeunit === 'd') {
            stats.beforePreviousMonthHours
              /= Meteor.user().profile.hoursToDays
                ? Meteor.user().profile.hoursToDays : 8
            stats.beforePreviousMonthHours = Number(stats.beforePreviousMonthHours)
              .toFixed(precision)
            stats.previousMonthHours
              /= Meteor.user().profile.hoursToDays
                ? Meteor.user().profile.hoursToDays : 8
            stats.previousMonthHours = Number(stats.previousMonthHours)
              .toFixed(precision)
            stats.currentMonthHours
              /= Meteor.user().profile.hoursToDays
                ? Meteor.user().profile.hoursToDays : 8
            stats.currentMonthHours = Number(stats.currentMonthHours).toFixed(precision)
          }
          if (this.$('.js-hour-chart')[0]) {
            const ctx = this.$('.js-hour-chart')[0].getContext('2d')
            this.chart = new Chart(ctx, {
              type: 'line',
              data: {
                labels:
                [stats.beforePreviousMonthName, stats.previousMonthName, stats.currentMonthName],
                datasets: [{
                  fill: true,
                  lineTension: 0.1,
                  backgroundColor: hex2rgba(Projects.findOne({ _id: templateInstance.data.projectId }).color || '#009688', 40), // 'rgba(75,192,192,0.4)',
                  borderColor: hex2rgba(Projects.findOne({ _id: templateInstance.data.projectId }).color || '#009688', 80), // 'rgba(0, 150, 136, 0.8)',
                  borderWidth: 0,
                  borderCapStyle: 'butt',
                  borderDash: [],
                  borderDashOffset: 0.0,
                  borderJoinStyle: 'miter',
                  pointBorderColor: hex2rgba(Projects.findOne({ _id: templateInstance.data.projectId }).color || '#009688', 80), // 'rgba(0, 150, 136, 0.8)',
                  pointBackgroundColor: '#fff',
                  pointBorderWidth: 1,
                  pointHoverRadius: 5,
                  pointHoverBackgroundColor: hex2rgba(Projects.findOne({ _id: templateInstance.data.projectId }).color || '#009688', 80), // 'rgba(0, 150, 136, 0.8)',
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
          // const totalHours = ProjectStats.findOne({ _id: Template.instance().data.projectId })
          //   ? Number(ProjectStats.findOne({
          //     _id: Template.instance().data.projectId,
          //   }).totalHours).toFixed(precision)
          //   : false
          this.$('.js-pie-chart-top-tasks').remove()
          this.$('.js-pie-chart-container').html('<canvas class="js-pie-chart-top-tasks"></canvas>')
          if (this.$('.js-pie-chart-top-tasks')[0] && templateInstance.topTasks.get()) {
            const ctx = this.$('.js-pie-chart-top-tasks')[0].getContext('2d')
            this.piechart = new Chart(ctx, {
              type: 'pie',
              data: {
                labels: templateInstance.topTasks.get().map((task) => task._id),
                datasets: [{
                  backgroundColor: [hex2rgba(Projects.findOne({ _id: templateInstance.data.projectId }).color || '#009688', 40), 'rgba(0, 150, 136, 0.6)', '#e4e4e4'],
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
    })
  })
})
Template.projectchart.onDestroyed(() => {
  if (Template.instance().chart) {
    Template.instance().chart.destroy()
  }
})
