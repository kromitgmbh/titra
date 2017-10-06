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
    return ProjectStats.findOne({ _id: Template.instance().data.projectId })
      ? Number(ProjectStats.findOne({
        _id: Template.instance().data.projectId,
      }).totalHours).toFixed(2)
      : false
  },
  allTeamMembers() {
    // return Template.instance().resources.get()
    //   ? Template.instance().resources.get().map(res => res.profile.name).join(', ') : false
    return projectUsers.findOne({ _id: Template.instance().data.projectId })
      ? projectUsers.findOne({ _id: Template.instance().data.projectId }).users
        .map(user => user.profile.name) : false
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
})
Template.projectchart.onRendered(function projectchartRendered() {
  const templateInstance = Template.instance()
  import('chart.js').then((chartModule) => {
    const Chart = chartModule.default
    this.autorun(() => {
      if (this.subscriptionsReady()) {
        this.$('.js-hour-chart').remove()
        this.$('.js-chart-container').html('<canvas class="js-hour-chart" style="width:320px;height:100px;"></canvas>')
        const stats = ProjectStats.findOne({ _id: this.data.projectId })
        if (Meteor.user().profile.timeunit === 'd') {
          stats.beforePreviousMonthHours /=
          (Meteor.user().profile.hoursToDays ? Meteor.user().profile.hoursToDays : 8)
          stats.previousMonthHours /=
          (Meteor.user().profile.hoursToDays ? Meteor.user().profile.hoursToDays : 8)
          stats.currentMonthHours /=
          (Meteor.user().profile.hoursToDays ? Meteor.user().profile.hoursToDays : 8)
        }
        if (!this.$('.js-hour-chart')[0]) {
          return
        }
        const ctx = this.$('.js-hour-chart')[0].getContext('2d')
        new Chart(ctx, {
          type: 'line',
          data: {
            labels:
            [stats.beforePreviousMonthName, stats.previousMonthName, stats.currentMonthName],
            datasets: [{
              fill: true,
              lineTension: 0.1,
              backgroundColor: hex2rgba(Projects.findOne({ _id: templateInstance.data.projectId }).color || '#009688', 40), // 'rgba(75,192,192,0.4)',
              borderColor: hex2rgba(Projects.findOne({ _id: templateInstance.data.projectId }).color || '#009688', 80), // 'rgba(0, 150, 136, 0.8)',
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
              [stats.beforePreviousMonthHours, stats.previousMonthHours, stats.currentMonthHours],
            }],
          },
          options: {
            legend: {
              display: false,
            },
            scales: {
              yAxes: [{ display: false }],
            },
          },
        })
      }
    })
  })
})
