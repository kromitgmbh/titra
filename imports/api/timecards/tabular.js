import moment from 'moment'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { Template } from 'meteor/templating'
import Tabular from 'meteor/aldeed:tabular'
import Timecards from './timecards.js'
import Projects from '../projects/projects.js'
import projectUsers from '../users/users.js'

new Tabular.Table({
  name: 'Timecards',
  collection: Timecards,
  columns: [
    { data: 'projectId', title: 'Project', render: _id => Projects.findOne({ _id }).name },
    { data: 'date', title: 'Date', render: val => moment(val).format('ddd DD.MM.YYYY') },
    { data: 'task', title: 'Task' },
    { data: 'userId',
      title: 'Resource',
      render: (_id, type, doc) => {
        Meteor.subscribe('projectUsers', { projectId: doc.projectId })
        return projectUsers.findOne({ _id: doc.projectId })
          ? projectUsers.findOne({ _id: doc.projectId })
            .users.find(elem => elem._id === _id).profile.name : false
      },
    },
    { data: 'hours',
      titleFn: () => {
        if (Meteor.user()) {
          return Meteor.user().profile.timeunit === 'd' ? 'Days' : 'Hours'
        }
        return 'Hours'
      },
      render: (_id, type, doc) => {
        if (Meteor.user()) {
          if (Meteor.user().profile.timeunit === 'd') {
            const convertedTime = Number(doc.hours / (Meteor.user().profile.hoursToDays
              ? Meteor.user().profile.hoursToDays : 8)).toFixed(2)
            return convertedTime !== Number(0).toFixed(2) ? convertedTime : undefined
          }
        }
        return doc.hours
      },
    },
    {
      title: 'Edit / delete',
      data: 'this',
      tmpl: Meteor.isClient && Template.tablecell,
      className: 'text-right',
    },
  ],
  selector(userId) {
    const projectList = Projects.find({ $or: [{ userId }, { public: true }] },
      { $fields: { _id: 1 } }).fetch().map(value => value._id)
    return { projectId: { $in: projectList } }
  },
  columnDefs: [{
    targets: 5,
    orderable: false,
  }],
  order: [[1, 'desc']],
  responsive: true,
  autoWidth: false,
  buttonContainer: '.row:eq(0)',
  // buttons: ['excelHtml5', 'csvHtml5'],
  buttons: [
    {
      text: '<i class="fa fa-plus"></i> Time',
      action: () => {
        FlowRouter.go('tracktime', { projectId: $('#targetProject').val() })
      },
    },
    {
      extend: 'excelHtml5',
      className: 'btn-primary',
      text: '<i class="fa fa-download"></i> Excel',
      title: `titra_export_${moment().format('YYYYMMDD-HHmm')}`,
      exportOptions: {
        columns: [0, 1, 2, 3, 4],
      },
    },
    {
      extend: 'csvHtml5',
      className: 'btn-primary',
      text: '<i class="fa fa-download"></i> CSV',
      title: `titra_export_${moment().format('YYYYMMDD-HHmm')}`,
      exportOptions: {
        columns: [0, 1, 2, 3, 4],
      },
    },
  ],
  footerCallback() {
    const api = this.api()
    const intVal = (i) => {
      return typeof i === 'string' ?
        i.replace(/[$,]/g, '') * 1 :
        typeof i === 'number' ? i : 0
    }
    const pageTotal = api
      .column(4, { page: 'current' })
      .data()
      .reduce((a, b) => intVal(a) + intVal(b), 0)
    $('tfoot').html(`<tr><th></th><th></th><th></th><th style='text-align:right'>Sum:</th><th>${pageTotal}</th><th></th></tr>`)
  },
})
