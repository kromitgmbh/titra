import { FlowRouter } from 'meteor/kadira:flow-router'
import { $ } from 'meteor/jquery'
import JSZip from 'jszip'
import dataTableButtons from 'datatables.net-buttons-bs4'
import html5ExportButtons from 'datatables.net-buttons/js/buttons.html5.js'
import dataTablesBootstrap from '../components/dataTables.bootstrap4.js'
import Projects from '../../api/projects/projects.js'
import periodToDates from '../../utils/periodHelpers.js'
import '../components/dataTables.bootstrap4.scss'
import './timecardlist.html'
import '../components/periodpicker.js'
import '../components/resourceselect.js'
import '../components/tablecell.js'
import '../components/customerselect.js'
import '../components/dailytimetable.js'
import '../components/periodtimetable.js'
import '../../api/timecards/tabular.js'

Template.timecardlist.onCreated(function createTimeCardList() {
  this.project = new ReactiveVar()
  this.resource = new ReactiveVar()
  this.period = new ReactiveVar()
  this.customer = new ReactiveVar()
  this.activeTab = new ReactiveVar()

  this.autorun(() => {
    this.project.set(FlowRouter.getParam('projectId'))
  })
  // super hacky, but is needed for Excel export button to show
  window.JSZip = JSZip
  dataTablesBootstrap(window, $)
  dataTableButtons(window, $)
  html5ExportButtons(window, $)
  Meteor.setTimeout(() => {
    $('[data-toggle="tooltip"]').tooltip()
    $(`#${this.activeTab.get()}`).tab('show')
  }, 1000)
})
Template.timecardlist.onRendered(() => {
  Template.instance().autorun(() => {
    if (FlowRouter.getQueryParam('resource')) {
      Template.instance().resource.set(FlowRouter.getQueryParam('resource'))
    } else {
      Template.instance().resource.set('all')
    }
    if (FlowRouter.getQueryParam('period')) {
      Template.instance().period.set(FlowRouter.getQueryParam('period'))
    } else {
      Template.instance().period.set('currentMonth')
    }
    if (FlowRouter.getQueryParam('customer')) {
      Template.instance().customer.set(FlowRouter.getQueryParam('customer'))
    } else {
      Template.instance().customer.set('all')
    }
    if (FlowRouter.getQueryParam('activeTab')) {
      Template.instance().activeTab.set(FlowRouter.getQueryParam('activeTab'))
    } else {
      Template.instance().activeTab.set('detailed-tab')
    }
  })
})
// at least free up the window assignment when this template instance is removed from DOM
Template.timecardlist.onDestroyed(() => {
  delete window.JSZip
})
Template.timecardlist.helpers({
  selector() {
    const returnSelector = {}
    if (Template.instance().project.get() !== 'all') {
      returnSelector.projectId = Template.instance().project.get()
    }
    if (Template.instance().resource.get() !== 'all') {
      returnSelector.userId = Template.instance().resource.get()
    }
    if (Template.instance().customer.get() !== 'all') {
      const projectList = Projects.find(
        {
          customer: Template.instance().customer.get(),
          $or: [{ userId: Meteor.userId() }, { public: true }, { team: Meteor.userId() }],
        },
        { $fields: { _id: 1 } },
      ).fetch().map(value => value._id)
      returnSelector.projectId = { $in: projectList }
    }
    if (Template.instance().period.get() !== 'all') {
      let { startDate, endDate } = periodToDates('all')
      if (Template.instance().period.get()) {
        ({ startDate, endDate } = periodToDates(Template.instance().period.get()))
      }
      returnSelector.date = { $gte: startDate, $lte: endDate }
    }
    return returnSelector
  },
  project() {
    return Template.instance().project
  },
  resource() {
    return Template.instance().resource
  },
  period() {
    return Template.instance().period
  },
  isActive(tab) {
    return Template.instance().activeTab.get() === tab
  },
})

Template.timecardlist.events({
  'change #period': (event, templateInstance) => {
    FlowRouter.setQueryParams({ period: $(event.currentTarget).val() })
  },
  'change #resourceselect': (event, templateInstance) => {
    FlowRouter.setQueryParams({ resource: $(event.currentTarget).val() })
  },
  'change #customerselect': (event, templateInstance) => {
    FlowRouter.setQueryParams({ customer: $(event.currentTarget).val() })
  },
  'click .nav-link[data-toggle]': (event, templateInstance) => {
    FlowRouter.setQueryParams({ activeTab: $(event.currentTarget)[0].id })
  },
})
