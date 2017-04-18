import moment from 'moment'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { $ } from 'meteor/jquery'
import JSZip from 'jszip'
import dataTableButtons from 'datatables.net-buttons-bs4'
import html5ExportButtons from 'datatables.net-buttons/js/buttons.html5.js'
import dataTablesBootstrap from '../components/dataTables.bootstrap4.js'
import '../components/dataTables.bootstrap4.scss'
import './timecardlist.html'
import '../components/periodpicker.js'
import '../components/resourceselect.js'
import '../components/tablecell.js'
import '../../api/timecards/tabular.js'

Template.timecardlist.onCreated(function createTimeCardList() {
  this.period = new ReactiveVar('currentMonth')
  this.resource = new ReactiveVar('all')
  this.data.project = new ReactiveVar(FlowRouter.getParam('projectId'))
  // super hacky, but is needed for Excel export button to show
  window.JSZip = JSZip
  dataTablesBootstrap(window, $)
  dataTableButtons(window, $)
  html5ExportButtons(window, $)
})
// at least free up the window assignment when this template instance is removed from DOM
Template.timecardlist.onDestroyed(() => {
  delete window.JSZip
})
Template.timecardlist.helpers({
  selector() {
    const returnSelector = {}
    if (Template.instance().data.project.get() !== 'all') {
      returnSelector.projectId = Template.instance().data.project.get()
    }
    if (Template.instance().resource.get() !== 'all') {
      returnSelector.userId = Template.instance().resource.get()
    }
    if (Template.instance().period.get() !== 'all') {
      let startDate
      let endDate
      switch (Template.instance().period.get()) {
        default:
          startDate = moment().startOf('month').toDate()
          endDate = moment().endOf('month').toDate()
          break
        case 'currentWeek':
          startDate = moment().startOf('week').toDate()
          endDate = moment().endOf('week').toDate()
          break
        case 'lastMonth':
          startDate = moment().subtract(1, 'month').startOf('month').toDate()
          endDate = moment().subtract(1, 'month').endOf('month').toDate()
          break
        case 'lastWeek':
          startDate = moment().subtract(1, 'week').startOf('week').toDate()
          endDate = moment().subtract(1, 'week').endOf('week').toDate()
          break
      }
      returnSelector.date = { $gte: startDate, $lte: endDate }
    }
    return returnSelector
  },
})

Template.timecardlist.events({
  'change #period': (event, templateInstance) => {
    templateInstance.period.set($(event.currentTarget).val())
  },
  'change #resourceselect': (event, templateInstance) => {
    templateInstance.resource.set($(event.currentTarget).val())
  },
  'change #targetProject': (event, templateInstance) => {
    templateInstance.data.project.set($(event.currentTarget).val())
    // FlowRouter.go(`/list/timecards/${$(event.currentTarget).val()}`)
  },
  // 'click #export': (event) => {
  //   event.preventDefault()
  //   Meteor.call('export', { projectId: $('#targetProject').val(), timePeriod: $('#period').val(), userId: $('#resourceselect').val() }, (error, result) => {
  //     if (!error) {
  //       let prjName = 'allprojects'
  //       if ($('#targetProject').val() !== 'all') {
  //         prjName = $('#targetProject').children(':selected').text()
  //         if (prjName.length > 12 && prjName.split(' ').length > 0) {
  //           const tmpPrjNameArray = prjName.split(' ')
  //           prjName = ''
  //           for (const part of tmpPrjNameArray) {
  //             prjName += part.substring(0, 1)
  //           }
  //         }
  //       }
  //       saveAs(new Blob([result], { type: 'application/vnd.ms-excel' }), `titra_export_${prjName}_${moment().format('YYYYMMDD-HHmm')}.xls`)
  //       // console.log(result)
  //     } else {
  //       console.error(error)
  //     }
  //   })
  // },
})
