import namedavatar from 'namedavatar'
import i18next from 'i18next'
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html'
import './projectchart.html'
import Projects, { ProjectStats } from '../../api/projects/projects.js'
import projectUsers from '../../api/users/users.js'
import { getUserSetting, getUserTimeUnitVerbose } from '../../utils/frontend_helpers'

Template.projectchart.onCreated(function projectchartCreated() {
  this.topTasks = new ReactiveVar()
  this.projectDescAsHtml = new ReactiveVar()
  this.autorun(() => {
    this.subscribe('singleProject', this.data.projectId)
    this.subscribe('projectStats', this.data.projectId)
    this.subscribe('projectUsers', { projectId: this.data.projectId })
    Meteor.call('getTopTasks', { projectId: this.data.projectId }, (error, result) => {
      if (error) {
        console.error(error)
      } else {
        this.topTasks.set(result)
      }
    })
    if (this.subscriptionsReady()) {
      const converter = new QuillDeltaToHtmlConverter(Projects
        .findOne({ _id: Template.instance().data.projectId })?.desc?.ops, {})
      this.projectDescAsHtml.set(converter.convert())
    }
  })
})
Template.projectchart.helpers({
  totalHours() {
    const precision = getUserSetting('precision')
    return ProjectStats.findOne({ _id: Template.instance().data.projectId })
      ? Number(ProjectStats.findOne({
        _id: Template.instance().data.projectId,
      }).totalHours).toFixed(precision)
      : false
  },
  hourIndicator() {
    const stats = ProjectStats.findOne({ _id: Template.instance().data.projectId })
    if (stats.previousMonthHours > stats.currentMonthHours) {
      return '<i class="d-md-none fa fa-arrow-circle-up"></i>'
    }
    if (stats.previousMonthHours < stats.currentMonthHours) {
      return '<i class="d-md-none fa fa-arrow-circle-down"></i>'
    }
    return '<i class="d-md-none fa fa-minus-square"></i>'
  },
  allTeamMembers() {
    return projectUsers.findOne({ _id: Template.instance().data.projectId })
      ? projectUsers.findOne({ _id: Template.instance().data.projectId }).users : false
  },
  avatarImg(avatar, name, avatarColor) {
    if (avatar) {
      return `<img src="${avatar}" alt="${name}" style="height:25px; cursor:pointer;" class="rounded js-avatar-tooltip" data-placement="top" title="${name}"/>`
    }
    namedavatar.config({
      nameType: 'initials',
      backgroundColors: [avatarColor || '#455A64'],
      minFontSize: 2,
    })
    const rawSVG = namedavatar.getSVG(name)
    rawSVG.classList = 'rounded js-avatar-tooltip'
    rawSVG.style.width = '25px'
    rawSVG.style.height = '25px'
    rawSVG.style.cursor = 'pointer'
    rawSVG.setAttribute('title', name)
    return rawSVG.outerHTML
  },
  topTasks() {
    return Template.instance().topTasks.get()
  },
  turnOver() {
    const precision = getUserSetting('precision')
    return Projects.findOne({ _id: Template.instance().data.projectId }).rate
      && ProjectStats.findOne({ _id: Template.instance().data.projectId })
      ? Number(Projects.findOne({ _id: Template.instance().data.projectId }).rate
          * ProjectStats.findOne({ _id: Template.instance().data.projectId }).totalHours)
        .toFixed(precision) : false
  },
  target() {
    return Number(Projects.findOne({ _id: Template.instance().data.projectId }).target) > 0
      ? Projects.findOne({ _id: Template.instance().data.projectId }).target : false
  },
  projectDescAsHtml: () => encodeURI(Template.instance().projectDescAsHtml.get()),
  truncatedProjectDescAsHtml: () => (Template.instance().projectDescAsHtml.get()
    ? Template.instance().projectDescAsHtml.get().replace('<p>', '<p style="max-height:1.9em;" class="text-truncate p-0 m-0">') : ''),
})
Template.projectchart.onRendered(() => {
  const templateInstance = Template.instance()
  const precision = getUserSetting('precision')
  templateInstance.autorun(() => {
    if (templateInstance.subscriptionsReady()) {
      const stats = ProjectStats.findOne({ _id: templateInstance.data.projectId })
      if (stats) {
        import('frappe-charts/dist/frappe-charts.min.css').then(() => {
          import('frappe-charts/dist/frappe-charts.esm.js').then((chartModule) => {
            const { Chart } = chartModule
            if (getUserSetting('timeunit') === 'd') {
              stats.beforePreviousMonthHours
                  /= getUserSetting('hoursToDays')
              stats.beforePreviousMonthHours = Number(stats.beforePreviousMonthHours)
                .toFixed(precision)
              stats.previousMonthHours
                  /= getUserSetting('hoursToDays')
              stats.previousMonthHours = Number(stats.previousMonthHours)
                .toFixed(precision)
              stats.currentMonthHours
                  /= getUserSetting('hoursToDays')
            }
            if (getUserSetting('timeunit') === 'm') {
              stats.beforePreviousMonthHours *= 60
              stats.beforePreviousMonthHours = Number(stats.beforePreviousMonthHours)
                .toFixed(precision)
              stats.previousMonthHours *= 60
              stats.previousMonthHours = Number(stats.previousMonthHours)
                .toFixed(precision)
              stats.currentMonthHours *= 60
              stats.currentMonthHours = Number(stats.currentMonthHours).toFixed(precision)
            }
            stats.currentMonthHours = Number(stats.currentMonthHours).toFixed(precision)
            if (templateInstance.chart) {
              templateInstance.chart.destroy()
            }
            window.requestAnimationFrame(() => {
              if (templateInstance.$('.js-hours-chart-container')[0] && templateInstance.$('.js-hours-chart-container').is(':visible')) {
                templateInstance.chart = new Chart(templateInstance.$('.js-hours-chart-container')[0], {
                  type: 'line',
                  height: 160,
                  colors: [Projects.findOne({ _id: templateInstance.data.projectId }).color || '#009688'],
                  lineOptions: {
                    regionFill: 1,
                  },
                  data: {
                    labels:
                  [stats.beforePreviousMonthName, stats.previousMonthName, stats.currentMonthName],
                    datasets: [{
                      values:
                    [stats.beforePreviousMonthHours,
                      stats.previousMonthHours,
                      stats.currentMonthHours],
                    }],
                  },
                  tooltipOptions: {
                    formatTooltipY: (value) => `${value} ${getUserTimeUnitVerbose()}`,
                  },
                })
              }
            })
          })
        })
      }
    }
  })
  templateInstance.autorun(() => {
    if (templateInstance.subscriptionsReady()) {
      if (templateInstance.topTasks.get()) {
        import('frappe-charts/dist/frappe-charts.min.css').then(() => {
          import('frappe-charts/dist/frappe-charts.esm.js').then((chartModule) => {
            window.requestAnimationFrame(() => {
              const { Chart } = chartModule
              if (templateInstance.piechart) {
                templateInstance.piechart.destroy()
              }
              if (templateInstance.$('.js-pie-chart-container')[0] && templateInstance.$('.js-pie-chart-container').is(':visible')) {
                templateInstance.piechart = new Chart(templateInstance.$('.js-pie-chart-container')[0], {
                  type: 'pie',
                  colors: [Projects.findOne({ _id: templateInstance.data.projectId }).color || '#009688', '#66c0b8', '#e4e4e4'],
                  height: 230,
                  data: {
                    labels: templateInstance.topTasks.get().map((task) => task._id),
                    datasets: [{
                      values: templateInstance.topTasks.get().map((task) => task.count),
                    }],
                  },
                  tooltipOptions: {
                  },
                })
                templateInstance.$('.frappe-chart').height(160)
              }
            })
          })
        })
      }
    }
  })
})
Template.projectchart.onDestroyed(() => {
  Template.instance().$('.js-tooltip').tooltip('dispose')
  const templateInstance = Template.instance()
  if (templateInstance.chart) {
    templateInstance.chart.destroy()
  }
  if (templateInstance.piechart) {
    templateInstance.piechart.destroy()
  }
})
Template.projectchart.events({
  'mouseenter .js-tooltip': (event, templateInstance) => {
    event.preventDefault()
    event.stopPropagation()
    templateInstance.$(event.currentTarget).tooltip({
      title: templateInstance.projectDescAsHtml.get(),
      html: true,
      placement: 'right',
      container: templateInstance.firstNode,
      trigger: 'manual',
    })
    templateInstance.$(event.currentTarget).tooltip('show')
  },
  'mouseleave .js-tooltip': (event, templateInstance) => {
    event.preventDefault()
    event.stopPropagation()
    templateInstance.$(event.currentTarget).tooltip('hide')
  },
  'mouseenter .js-avatar-tooltip': (event, templateInstance) => {
    event.preventDefault()
    event.stopPropagation()
    templateInstance.$(event.currentTarget).tooltip({
      container: templateInstance.firstNode,
      trigger: 'manual',
    })
    templateInstance.$(event.currentTarget).tooltip('show')
  },
  'mouseleave .js-avatar-tooltip': (event, templateInstance) => {
    event.preventDefault()
    event.stopPropagation()
    templateInstance.$(event.currentTarget).tooltip('hide')
  },
})
