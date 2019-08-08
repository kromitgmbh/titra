import moment from 'moment'
import emoji from 'node-emoji'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { Template } from 'meteor/templating'
import Tabular from 'meteor/aldeed:tabular'
import Timecards from './timecards.js'
import Projects from '../projects/projects.js'
import projectUsers from '../users/users.js'

const replacer = match => emoji.emojify(match)
const safeReplacer = transform => (transform ? transform.replace(/(:.*:)/g, replacer).replace(/</g, '&lt;').replace(/>/, '&gt;').replace(/"/g, '&quot;') : false)

const detailed = new Tabular.Table({
  name: 'Detailed',
  collection: Timecards,
  columns: [
    { data: 'projectId', title: 'Project', render: _id => `<span class="d-inline-block text-truncate" data-toggle="tooltip" data-placement="top" style="max-width:100px" title="${Projects.findOne({ _id }).name}">${Projects.findOne({ _id }).name}</span>` },
    { data: 'date', title: 'Date', render: val => `<span data-toggle="tooltip" data-placement="top" title="${moment(val).format('ddd DD.MM.YYYY')}">${moment(val).format('DD.MM.YYYY')}</span>` },
    { data: 'task', title: 'Task', render: val => `<span class="d-inline-block text-truncate" style="max-width:350px;" data-toggle="tooltip" data-placement="top" title="${safeReplacer(val)}">${safeReplacer(val)}</span>` },
    {
      data: 'userId',
      title: 'Resource',
      render: (_id, type, doc) => {
        Meteor.subscribe('projectUsers', { projectId: doc.projectId })
        const resName = projectUsers.findOne({ _id: doc.projectId })
          ? projectUsers.findOne({ _id: doc.projectId })
            .users.find(elem => elem._id === _id).profile.name : false
        return `<span class="d-inline-block text-truncate" data-toggle="tooltip" data-placement="top" style="max-width:100px" title="${resName}">${resName}</span>`
      },
    },
    {
      data: 'hours',
      titleFn: () => {
        if (Meteor.user()) {
          return Meteor.user().profile.timeunit === 'd' ? 'Days' : 'Hours'
        }
        return 'Hours'
      },
      render: (_id, type, doc) => {
        if (Meteor.user()) {
          const precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : 2
          if (Meteor.user().profile.timeunit === 'd') {
            const convertedTime = Number(doc.hours / (Meteor.user().profile.hoursToDays
              ? Meteor.user().profile.hoursToDays : 8)).toFixed(precision)
            return convertedTime !== Number(0).toFixed(precision) ? convertedTime : undefined
          }
        }
        return doc.hours
      },
    },
    {
      title: 'Modify',
      data: 'this',
      tmpl: Meteor.isClient && Template.tablecell,
      className: 'text-right',
    },
  ],
  selector(userId) {
    const projectList = Projects.find(
      { $or: [{ userId }, { public: true }, { team: userId }] },
      { $fields: { _id: 1 } },
    ).fetch().map(value => value._id)
    return { projectId: { $in: projectList } }
  },
  columnDefs: [{
    targets: 5,
    orderable: false,
  }],
  lengthMenu: [[10, 25, 50, 100, 200, -1], [10, 25, 50, 100, 200, 'All']],
  order: [[1, 'desc']],
  responsive: true,
  autoWidth: false,
  buttonContainer: '.row:eq(0)',
  // buttons: ['excelHtml5', 'csvHtml5'],
  buttons: [
    {
      text: '<i class="fa fa-plus"></i> Time',
      className: 'border',
      action: () => {
        FlowRouter.go('tracktime', { projectId: $('#targetProject').val() })
      },
    },
    {
      extend: 'excelHtml5',
      className: 'border',
      text: '<i class="fa fa-download"></i> Excel',
      title: `titra_export_${moment(new Date()).format('YYYYMMDD-HHmm')}`,
      exportOptions: {
        columns: [0, 1, 2, 3, 4],
      },
    },
    {
      extend: 'csvHtml5',
      className: 'border',
      text: '<i class="fa fa-download"></i> CSV',
      title: `titra_export_${moment().format('YYYYMMDD-HHmm')}`,
      exportOptions: {
        columns: [0, 1, 2, 3, 4],
      },
    },
    {
      text: '<i class="fa fa-link"></i> Share',
      className: 'border js-share',
      action: () => {
        if ($('#period').val() === 'all' && $('#targetProject').val() === 'all' && $('#customerselect').val() === 'all') {
          $.notify({ message: 'Sorry, but for your own sanity you can not share all time of all projects. ' }, { type: 'danger' })
          return
        }
        Meteor.call('addDashboard', {
          projectId: $('#targetProject').val(), resourceId: $('#resourceselect').val(), customer: $('#customerselect').val(), timePeriod: $('#period').val(),
        }, (error, _id) => {
          if (error) {
            $.notify({ message: `Dashboard creation failed (error: ${error}).` }, { type: 'danger' })
            // console.error(error)
          } else {
            $('#dashboardURL').val(FlowRouter.url('dashboard', { _id }))
            $('.js-dashboard-modal').modal('toggle')
            // FlowRouter.go('dashboard', { _id })
          }
        })
      },
    },
    {
      text: '<i class="fa fa-upload"></i> Invoice',
      className: 'border js-siwapp',
      action: () => {
        if (Meteor.user().profile.siwappurl && Meteor.user().profile.siwapptoken) {
          Meteor.call('sendToSiwapp', {
            projectId: $('#targetProject').val(), timePeriod: $('#period').val(), userId: $('#resourceselect').val(), customer: $('#customerselect').val(),
          }, (error, result) => {
            if (error) {
              $.notify({ message: `Export failed (error: ${error}).` }, { type: 'danger' })
            } else {
              $.notify(result)
            }
          })
        } else {
          $.notify({ message: 'You have to configure the Siwapp integration to use this feature.' }, { type: 'danger' })
        }
      },
    },
  ],
  footerCallback() {
    const api = this.api()
    const intVal = (i) => {
      if (typeof i === 'string') {
        return i.replace(/[$,]/g, '') * 1
      }
      return typeof i === 'number' ? i : 0
    }
    let pageTotal
    if (($('.show.active')[0] && $('.show.active')[0].id === 'detailed') || (FlowRouter.getQueryParam('activeTab') === 'detailed-tab')) {
      pageTotal = api
        .column(4, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0)
    } else {
      pageTotal = api
        .column(3, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0)
    }
    if (Meteor.user()) {
      const precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : 2
      if (Meteor.user().profile.timeunit === 'd') {
        pageTotal = Number(pageTotal / (Meteor.user().profile.hoursToDays
          ? Meteor.user().profile.hoursToDays : 8)).toFixed(precision)
      }
    }
    $('tfoot').html(`<tr><th></th><th></th><th></th><th style='text-align:right'>Sum:</th><th>${pageTotal}</th><th></th></tr>`)
  },
})
export default detailed
