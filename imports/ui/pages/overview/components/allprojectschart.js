import './allprojectschart.html'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import Projects from '../../../../api/projects/projects.js'
import { getUserSetting, getUserTimeUnitVerbose } from '../../../../utils/frontend_helpers'
import { periodToDates } from '../../../../utils/periodHelpers.js'
import '../../details/components/periodpicker.js'

Template.allprojectschart.onCreated(function allprojectschartCreated() {
  this.projectStats = new ReactiveVar()
  this.projectDistribution = new ReactiveVar()
  this.includeNotBillableTime = new ReactiveVar(false)
  this.showArchived = new ReactiveVar(false)
  this.period = new ReactiveVar('all')
  this.autorun(() => {
    const precision = getUserSetting('precision')
    const timeUnit = getUserSetting('timeunit')
    Meteor.call('getAllProjectStats', { includeNotBillableTime: this.includeNotBillableTime.get(), showArchived: this.showArchived?.get(), period: this.period?.get() }, (error, result) => {
      if (error) {
        console.error(error)
      } else if (result instanceof Object) {
        const stats = result
        if (timeUnit === 'd') {
          stats.beforePreviousMonthHours = (Number(stats.beforePreviousMonthHours) / Number(getUserSetting('hoursToDays'))).toFixed(precision)
          stats.previousMonthHours = (Number(stats.previousMonthHours) / Number(getUserSetting('hoursToDays'))).toFixed(precision)
          stats.currentMonthHours = (Number(stats.currentMonthHours) / Number(getUserSetting('hoursToDays'))).toFixed(precision)
        }
        if (timeUnit === 'm') {
          stats.beforePreviousMonthHours *= 60
          stats.beforePreviousMonthHours = Number(stats.beforePreviousMonthHours)
            .toFixed(precision)
          stats.previousMonthHours *= 60
          stats.previousMonthHours = Number(stats.previousMonthHours)
            .toFixed(precision)
          stats.currentMonthHours *= 60
          stats.currentMonthHours = Number(stats.currentMonthHours).toFixed(precision)
        }
        this.projectStats.set(stats)
      }
    })
    Meteor.call('getProjectDistribution', { projectId: 'all', includeNotBillableTime: this.includeNotBillableTime.get(), showArchived: this.showArchived?.get(), period: this.period?.get() }, (error, result) => {
      if (error) {
        console.error(error)
      } else {
        this.projectDistribution.set(result)
      }
    })
  })
})
Template.allprojectschart.helpers({
  totalHours() {
    return Template.instance().projectStats.get()
      ? Template.instance().projectStats.get().totalHours : 0
  },
  showNotBillableTime: () => Template.instance().includeNotBillableTime.get(),
  async projectCount() {
    const selector = {}
    if(Template.instance().period?.get() && Template.instance().period.get() !== 'all'){
      const {startDate, endDate} = await periodToDates(Template.instance().period.get())
      selector.$and = [{ $or: [ { startDate: { $exists: false } }, { startDate: { $gte: startDate } }] },
      { $or: [{ endDate: {$exists: false } }, { endDate: { $lte: endDate } }] }]
    }
    if(!Template.instance().showArchived?.get()) {
      if(selector.$and) {
        selector.$and.push({ $or: [{ archived: { $exists: false } }, { archived: false }] })
      } else {
      selector.$or = [{ archived: { $exists: false } }, { archived: false }]
      }
    }
    return Projects.find(selector, { sort: { priority: 1, name: 1 } }).count()
    },
})
Template.allprojectschart.events({
  'change #showNotBillableTime': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.includeNotBillableTime.set(templateInstance.$(event.currentTarget).is(':checked'))
  },
  'change #showArchived': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.showArchived?.set(templateInstance.$(event.currentTarget).is(':checked'))
    FlowRouter.setQueryParams({ showArchived: templateInstance.showArchived?.get() })
  },
  'change #limit': (event, templateInstance) => {
    event.preventDefault()
    FlowRouter.setQueryParams({ limit: templateInstance.$(event.currentTarget).val() })
  },
  'change #period': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.period.set(templateInstance.$(event.currentTarget).val())
  }
})
Template.allprojectschart.onRendered(() => {
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    templateInstance.$('#limit').val(FlowRouter.getQueryParam('limit') ? FlowRouter.getQueryParam('limit') : 25)
    templateInstance.period.set(FlowRouter.getQueryParam('period') ? FlowRouter.getQueryParam('period') : 'all')
    templateInstance.$('#period').val(templateInstance.period.get())
    templateInstance.showArchived?.set(FlowRouter.getQueryParam('showArchived') === 'true')
    templateInstance.$('#showArchived').prop('checked', templateInstance.showArchived?.get())
  })
  templateInstance.autorun(() => {
    if (templateInstance.subscriptionsReady()) {
      if (templateInstance.projectStats.get()) {
        import('frappe-charts').then((chartModule) => {
          const { Chart } = chartModule
          const stats = templateInstance.projectStats.get()
          if (stats) {
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
          }
        })
      }
      if (templateInstance.projectDistribution.get()?.length > 0 && templateInstance.$('.js-pie-chart-container')[0] && templateInstance.$('.js-pie-chart-container').is(':visible')) {
        import('frappe-charts').then((chartModule) => {
          window.requestAnimationFrame(() => {
            const { Chart } = chartModule
            if (templateInstance.piechart) {
              templateInstance.piechart.destroy()
            }
            const colors = []
            for (const project of templateInstance.projectDistribution.get()) {
              colors.push(Projects.findOne({ _id: project._id })?.color ? Projects.findOne({ _id: project._id })?.color : '#009688')
            }
            templateInstance.piechart = new Chart(templateInstance.$('.js-pie-chart-container')[0], {
              type: 'pie',
              colors,
              height: 230,
              data: {
                labels: templateInstance.projectDistribution.get()
                  .map((project) => $('<span>').text(Projects.findOne({ _id: project._id })?.name).html()),
                datasets: [{
                  values: templateInstance.projectDistribution.get().map((project) => project.count),
                }],
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
