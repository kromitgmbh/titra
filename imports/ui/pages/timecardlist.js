import { FlowRouter } from 'meteor/kadira:flow-router'
import { $ } from 'meteor/jquery'
import JSZip from 'jszip'
import i18next from 'i18next'
import dataTableButtons from 'datatables.net-buttons-bs4'
import html5ExportButtons from 'datatables.net-buttons/js/buttons.html5.js'
import dataTablesBootstrap from '../components/dataTables.bootstrap4.js'
import Projects from '../../api/projects/projects.js'
import { periodToDates } from '../../utils/periodHelpers.js'
import i18nextReady from '../../startup/client/startup.js'
import '../components/dataTables.bootstrap4.scss'
import './timecardlist.html'
import '../components/periodpicker.js'
import '../components/resourceselect.js'
import '../components/tablecell.js'
import '../components/customerselect.js'
import '../components/dailytimetable.js'
import '../components/periodtimetable.js'
import '../components/workingtimetable.js'
import '../components/limitpicker.js'
import '../../api/timecards/tabular.js'

Template.timecardlist.onCreated(function createTimeCardList() {
  this.project = new ReactiveVar()
  this.resource = new ReactiveVar()
  this.period = new ReactiveVar()
  this.limit = new ReactiveVar(10)
  this.customer = new ReactiveVar()
  this.activeTab = new ReactiveVar()
  this.autorun(() => {
    if (window.BootstrapLoaded.get()) {
      $(`#${this.activeTab.get()}`).tab('show')
    }
  })
  window.JSZip = JSZip
  dataTablesBootstrap(window, $)
  dataTableButtons(window, $)
  html5ExportButtons(window, $)
  Meteor.setTimeout(() => {
    $('[data-toggle="tooltip"]').tooltip()
  }, 1000)
})
Template.timecardlist.onRendered(() => {
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    if (FlowRouter.getParam('projectId')) {
      templateInstance.project.set(FlowRouter.getParam('projectId'))
    } else {
      templateInstance.project.set('all')
    }
    if (FlowRouter.getQueryParam('resource')) {
      templateInstance.resource.set(FlowRouter.getQueryParam('resource'))
    } else {
      templateInstance.resource.set('all')
    }
    if (FlowRouter.getQueryParam('period')) {
      templateInstance.period.set(FlowRouter.getQueryParam('period'))
    } else {
      templateInstance.period.set('currentMonth')
    }
    if (FlowRouter.getQueryParam('customer')) {
      templateInstance.customer.set(FlowRouter.getQueryParam('customer'))
    } else {
      templateInstance.customer.set('all')
    }
    if (FlowRouter.getQueryParam('activeTab')) {
      templateInstance.activeTab.set(FlowRouter.getQueryParam('activeTab'))
    } else {
      templateInstance.activeTab.set('detailed-tab')
    }
    if (FlowRouter.getQueryParam('limit')) {
      templateInstance.limit.set(Number(FlowRouter.getQueryParam('limit')))
    } else {
      templateInstance.limit.set(25)
    }
    if (i18nextReady.get()) {
      const language = {
        sEmptyTable: i18next.t('tabular.sEmptyTable'),
        sInfo: i18next.t('tabular.sInfo'),
        sInfoEmpty: i18next.t('tabular.sInfoEmpty'),
        sInfoFiltered: i18next.t('tabular.sInfoFiltered'),
        sInfoPostFix: i18next.t('tabular.sInfoPostFix'),
        sInfoThousands: i18next.t('tabular.sInfoThousands'),
        sLengthMenu: i18next.t('tabular.sLengthMenu'),
        sLoadingRecords: i18next.t('tabular.sLoadingRecords'),
        sProcessing: i18next.t('tabular.sProcessing'),
        sSearch: i18next.t('tabular.sSearch'),
        sZeroRecords: i18next.t('tabular.sZeroRecords'),
        oPaginate: {
          sFirst: i18next.t('tabular.oPaginate.sFirst'),
          sLast: i18next.t('tabular.oPaginate.sLast'),
          sNext: i18next.t('tabular.oPaginate.sNext'),
          sPrevious: i18next.t('tabular.oPaginate.sPrevious'),
        },
        oAria: {
          sSortAscending: i18next.t('tabular.oAria.sSortAscending'),
          sSortDescending: i18next.t('tabular.oAria.sSortDescending'),
        },
      }
      $.extend(true, $.fn.dataTable.defaults, { language })
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
  limit() {
    return Template.instance().limit
  },
  customer() {
    return Template.instance().customer
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
