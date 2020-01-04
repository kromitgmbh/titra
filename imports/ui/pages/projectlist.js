import { Meteor } from 'meteor/meteor'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import i18next from 'i18next'
import './projectlist.html'
import Projects from '../../api/projects/projects'
import '../components/timetracker.js'
import '../components/projectchart.js'
import '../components/allprojectschart.js'
import '../components/projectProgress.js'
import hex2rgba from '../../utils/hex2rgba.js'

Template.projectlist.onCreated(function createProjectList() {
  this.subscribe('myprojects')
  this.data.showArchived = new ReactiveVar(false)
})
Template.projectlist.onRendered(() => {
  if (Meteor.settings.public.adsenseClientId) {
    Meteor.setTimeout(() => {
      import('../../startup/client/googleads.js');
      (adsbygoogle = window.adsbygoogle || []).push({})
    }, 5000)
  }
  if ($().tooltip) {
    Meteor.setTimeout(() => {
      $('[data-toggle="tooltip"]').tooltip()
    }, 1000)
  }
  import('sortablejs').then((sortableImport) => {
    const Sortable = sortableImport.default
    const el = document.querySelector('.js-project-list')
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
  })
})
Template.projectlist.helpers({
  projects() {
    return Template.instance().data.showArchived.get()
      ? Projects.find({}, { sort: { priority: 1, name: 1 } })
      : Projects.find(
        { $or: [{ archived: { $exists: false } }, { archived: false }] },
        { sort: { priority: 1, name: 1 } },
      )
  },
  moreThanOneProject() {
    return Template.instance().data.showArchived.get()
      ? Projects.find({}).count() > 1
      : Projects.find({ $or: [{ archived: { $exists: false } }, { archived: false }] }).count() > 1
  },
  hasArchivedProjects: () => Projects.find({}).count()
    !== Projects.find({ $or: [{ archived: { $exists: false } }, { archived: false }] }).count(),
  isProjectOwner(_id) {
    return Projects.findOne({ _id }) ? Projects.findOne({ _id }).userId === Meteor.userId() : false
  },
  colorOpacity(hex, op) {
    return hex2rgba(hex || '#009688', !isNaN(op) ? op : 50)
  },
  archived(_id) {
    return Projects.findOne({ _id }).archived
  },
  adsenseClientId: () => Meteor.settings.public.adsenseClientId,
  adsenseAdSlot: () => Meteor.settings.public.adsenseAdSlot,
  projectCount: () => (Template.instance().data.showArchived.get()
    ? Projects.find({}).count()
    : Projects.find({ $or: [{ archived: { $exists: false } }, { archived: false }] }).count()),
})

Template.projectlist.events({
  'click .js-delete-project': (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (confirm(i18next.t('notifications.project_delete_confirm'))) {
      const projectId = event.currentTarget.parentElement.parentElement.id
      Meteor.call('deleteProject', { projectId }, (error) => {
        if (!error) {
          $.notify(i18next.t('notifications.project_delete_success'))
        } else {
          console.error(error)
        }
      })
    }
  },
  'click .js-archive-project': (event) => {
    event.preventDefault()
    event.stopPropagation()
    const projectId = event.currentTarget.parentElement.parentElement.id
    Meteor.call('archiveProject', { projectId }, (error) => {
      if (!error) {
        $.notify(i18next.t('notifications.project_archive_success'))
      } else {
        console.error(error)
      }
    })
  },
  'click .js-restore-project': (event) => {
    event.preventDefault()
    event.stopPropagation()
    const projectId = event.currentTarget.parentElement.parentElement.id
    Meteor.call('restoreProject', { projectId }, (error) => {
      if (!error) {
        $.notify(i18next.t('notifications.project_restore_success'))
      } else {
        console.error(error)
      }
    })
  },
  'click .js-edit-project': (event) => {
    event.preventDefault()
    event.stopPropagation()
    const projectId = event.currentTarget.parentElement.parentElement.id
    FlowRouter.go('editproject', { id: projectId })
  },
  'change #showArchived': (event) => {
    Template.instance().data.showArchived.set($(event.currentTarget).is(':checked'))
  },
})
