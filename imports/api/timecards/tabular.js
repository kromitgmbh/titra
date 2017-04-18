import Tabular from 'meteor/aldeed:tabular'
import moment from 'moment'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { Template } from 'meteor/templating'
import Timecards from './timecards.js'
import Projects from '../projects/projects.js'
import projectUsers from '../users/users.js'
// import '../../ui/components/tablecell.js'

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
    },
    {
      extend: 'csvHtml5',
      className: 'btn-primary',
      text: '<i class="fa fa-download"></i> CSV',
      title: `titra_export_${moment().format('YYYYMMDD-HHmm')}`,
    },
  ],
  // drawCallback() {
  //   const api = this.api()
  //   const rows = api.rows({ page: 'current' }).nodes()
  //   let last = null
  //
  //   api.column(0, { page: 'current' }).data().each((group, i) => {
  //     if (last !== group) {
  //       $(rows).eq(i).before(
  //           `<tr><td colspan="5" style="background-color:#455A64; color:white;">${moment(group).format('ddd DD.MM.YYYY')}</td></tr>`,
  //       )
  //       last = group
  //     }
  //   })
  // },
})
