import './allprojectschart.html'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { getUserSetting, getUserTimeUnitVerbose } from '../../utils/frontend_helpers'

Template.allprojectschart.onCreated(function allprojectschartCreated() {
  this.topTasks = new ReactiveVar()
  this.projectStats = new ReactiveVar()
  this.includeNotBillableTime = new ReactiveVar(false)
  this.autorun(() => {
    Meteor.call('getAllProjectStats', { includeNotBillableTime: this.includeNotBillableTime.get(), showArchived: this.data.showArchived.get() }, (error, result) => {
      if (error) {
        console.error(error)
      } else {
        this.projectStats.set(result)
      }
    })
    Meteor.call('getTopTasks', { projectId: 'all', includeNotBillableTime: this.includeNotBillableTime.get(), showArchived: this.data.showArchived.get() }, (error, result) => {
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
  showNotBillableTime: () => Template.instance().includeNotBillableTime.get(),
})
Template.allprojectschart.events({
  'change #showNotBillableTime': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.includeNotBillableTime.set(templateInstance.$(event.currentTarget).is(':checked'))
  },
  'change #showArchived': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.data.showArchived.set(templateInstance.$(event.currentTarget).is(':checked'))
  },
  'change #limit': (event, templateInstance) => {
    event.preventDefault()
    FlowRouter.setQueryParams({ limit: templateInstance.$(event.currentTarget).val() })
  },
})
Template.allprojectschart.onRendered(() => {
  const templateInstance = Template.instance()
  const precision = getUserSetting('precision')
  templateInstance.autorun(() => {
    templateInstance.$('#limit').val(FlowRouter.getQueryParam('limit') ? FlowRouter.getQueryParam('limit') : 25)
  })
  templateInstance.autorun(() => {
    if (templateInstance.subscriptionsReady()) {
      if (templateInstance.projectStats.get()) {
        import('frappe-charts').then((chartModule) => {
          const { Chart } = chartModule
          const stats = templateInstance.projectStats.get()
          if (stats) {
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
              stats.currentMonthHours = Number(stats.currentMonthHours).toFixed(precision)
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
            if (templateInstance.chart) {
              templateInstance.chart.destroy()
            }
            window.requestAnimationFrame(() => {
              if (templateInstance.$('.js-chart-container')[0] && templateInstance.$('.js-chart-container').is(':visible')) {
                templateInstance.chart = new Chart(templateInstance.$('.js-chart-container')[0], {
                  type: 'line',
                  height: 160,
                  colors: ['#009688'],
                  lineOptions: {
                    regionFill: 1,
                  },
                  data: {
                    labels:
                  [stats.beforePreviousMonthName,
                    stats.previousMonthName,
                    stats.currentMonthName],
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
          }
        })
      }
      if (templateInstance.topTasks.get() && templateInstance.$('.js-pie-chart-container')[0] && templateInstance.$('.js-pie-chart-container').is(':visible')) {
        import('frappe-charts').then((chartModule) => {
          window.requestAnimationFrame(() => {
            const { Chart } = chartModule
            if (templateInstance.piechart) {
              templateInstance.piechart.destroy()
            }
            templateInstance.piechart = new Chart(templateInstance.$('.js-pie-chart-container')[0], {
              type: 'pie',
              colors: ['#009688', '#455A64', '#e4e4e4'],
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
          })
        })
      }
    }
  })
})
Template.allprojectschart.onDestroyed(() => {
  const templateInstance = Template.instance()
  if (templateInstance.chart) {
    templateInstance.chart.destroy()
  }
  if (templateInstance.piechart) {
    templateInstance.piechart.destroy()
  }
})
