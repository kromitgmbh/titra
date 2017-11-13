import { Meteor } from 'meteor/meteor'
import { FlowRouter } from 'meteor/kadira:flow-router'
import './projectlist.html'
import Projects from '../../api/projects/projects'
import '../components/timetracker.js'
import '../components/projectchart.js'
import '../components/allprojectschart.js'
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
    $('[data-toggle="tooltip"]').tooltip()
  }
  import('jquery-ui').then(() => {
    import('jquery-ui/ui/version.js').then(() => {
      import('jquery-ui/ui/data.js').then(() => {
        import('jquery-ui/ui/plugin.js').then(() => {
          import('jquery-ui/ui/scroll-parent').then(() => {
            import('jquery-ui/ui/widgets/mouse.js').then(() => {
              import('jquery-ui/ui/widgets/sortable').then(() => {
                const projectList = $('.js-project-list')
                projectList.sortable({
                  // Only make the .panel-heading child elements support dragging.
                  // Omit this to make then entire <li>...</li> draggable.
                  // handle: '.card',
                  cursor: 'move',
                  opacity: 0.7,
                  update: () => {
                    $('.card', projectList).each((index, elem) => {
                      const $listItem = $(elem)
                      const priority = $listItem.index()
                      const projectId = $listItem.children('.card-body').children('.row.mt-2')[0].id
                      Meteor.call('updatePriority', { projectId, priority }, (error, result) => {
                        if (error) {
                          console.error(error)
                        }
                      })
                      // Persist the new indices.
                    })
                  },
                })
              })
            })
          })
        })
      })
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
    if (confirm('Do you really want to delete this project?')) {
      const projectId = event.currentTarget.parentElement.parentElement.id
      Meteor.call('deleteProject', { projectId }, (error) => {
        if (!error) {
          $.notify('Project deleted successfully')
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
        $.notify('Project archived successfully')
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
        $.notify('Project restored successfully')
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
