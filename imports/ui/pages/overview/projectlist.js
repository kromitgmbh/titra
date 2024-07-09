import { Meteor } from 'meteor/meteor'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import bootstrap from 'bootstrap'
import { t } from '../../../utils/i18n.js'
import './projectlist.html'
import Projects from '../../../api/projects/projects'
import './components/projectchart.js'
import './components/allprojectschart.js'
import './components/projectProgress.js'
import './components/dashboardModal.js'
import hex2rgba from '../../../utils/hex2rgba.js'
import { periodToDates } from '../../../utils/periodHelpers.js'
import { showToast } from '../../../utils/frontend_helpers.js'

Template.projectlist.onCreated(function createProjectList() {
  this.subscribe('myprojects', {})
  this.showArchived = new ReactiveVar(false)
  this.projectId = new ReactiveVar(null)
  this.period = new ReactiveVar('all')
  this.autorun(() => {
    this.showArchived.set(FlowRouter.getQueryParam('showArchived') === 'true')
    this.period.set(FlowRouter.getQueryParam('period') || 'all')
  })
})
Template.projectlist.onRendered(() => {
  Meteor.setTimeout(() => {
    import('sortablejs').then((sortableImport) => {
      const Sortable = sortableImport.default
      const el = document.querySelector('.js-project-list')
      if (el) {
        Sortable.create(el, {
          handle: '.handle',
          onChoose: (evt) => {
            document.querySelectorAll('.js-project-list .card-body').forEach((element) => {
              element.classList.add('d-none')
            })
            document.querySelectorAll('.progress-bar').forEach((element) => {
              element.classList.add('d-none')
            })
          },
          onEnd: (evt) => {
            document.querySelectorAll('.js-project-list .card-body').forEach((element) => {
              element.classList.remove('d-none')
            })
            document.querySelectorAll('.progress-bar').forEach((element) => {
              element.classList.remove('d-none')
            })
            const projectId = $(evt.item).children('.card-body').children('.row.mt-2')[0].id
            const priority = evt.newIndex
            Meteor.call('updatePriority', { projectId, priority }, (error, result) => {
              if (error) {
                console.error(error)
              }
            })
          },
        })
      }
    })
  }, 1000)
})
Template.projectlist.helpers({
  projects() {
    const limit = FlowRouter.getQueryParam('limit') ? Number(FlowRouter.getQueryParam('limit')) : 25
    const selector = {}
    if(Template.instance().period?.get() && Template.instance().period.get() !== 'all'){
      const {startDate, endDate} = periodToDates(Template.instance().period.get())
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
    return Projects.find(selector, { sort: { priority: 1, name: 1 }, limit })
  },
  moreThanOneProject() {
    const selector = {}
    if(Template.instance().period?.get() && Template.instance().period.get() !== 'all'){
      const {startDate, endDate} = periodToDates(Template.instance().period.get())
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
    return Projects.find(selector, { sort: { priority: 1, name: 1 } }).count() > 1
  },
  hasArchivedProjects: () => Projects.find({}).count()
    !== Projects.find({ $or: [{ archived: { $exists: false } }, { archived: false }] }).count(),
  isProjectOwner(_id) {
    return Projects.findOne({ _id })
      ? (Projects.findOne({ _id }).userId === Meteor.userId()
        || Projects.findOne({ _id })?.admins?.indexOf(Meteor.userId() >= 0)) : false
  },
  colorOpacity(hex, op) {
    return hex2rgba(hex || '#009688', !isNaN(op) ? op : 50)
  },
  archived(_id) {
    return Projects.findOne({ _id }).archived
  },
  projectCount() {
    const selector = {}
    if(Template.instance().period?.get() && Template.instance().period.get() !== 'all'){
      const {startDate, endDate} = periodToDates(Template.instance().period.get())
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
  projectId: () => Template.instance().projectId,
})

Template.projectlist.events({
  'click .js-delete-project': (event) => {
    event.preventDefault()
    event.stopPropagation()
    const projectId = event.currentTarget.parentElement.parentElement.id
    if (confirm(t('notifications.project_delete_confirm'))) {
      Meteor.call('deleteProject', { projectId }, (error) => {
        if (!error) {
          showToast(t('notifications.project_delete_success'))
        } else {
          console.error(error)
        }
      })
    }
  },
  'click .js-archive-project': (event) => {
    event.preventDefault()
    event.stopPropagation()
    const projectId = event.currentTarget.dataset.id
    Meteor.call('archiveProject', { projectId }, (error) => {
      if (!error) {
        showToast(t('notifications.project_archive_success'))
      } else {
        console.error(error)
      }
    })
  },
  'click .js-restore-project': (event) => {
    event.preventDefault()
    event.stopPropagation()
    const projectId = event.currentTarget.dataset.id
    Meteor.call('restoreProject', { projectId }, (error) => {
      if (!error) {
        showToast(t('notifications.project_restore_success'))
      } else {
        console.error(error)
      }
    })
  },
  'click .js-edit-project': (event) => {
    event.preventDefault()
    event.stopPropagation()
    const projectId = event.currentTarget.dataset.id
    FlowRouter.go('editproject', { id: projectId })
  },
  'click .js-share': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.projectId.set(event.currentTarget.dataset.id)
    const dashboardModal = new bootstrap.Modal($('.js-dashboard-modal')[0], { focus: false }).toggle()
  },
})

Template.projectlist.onDestroyed(() => {
  $(window).off()
})
