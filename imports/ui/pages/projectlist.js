import { Meteor } from 'meteor/meteor'
import './projectlist.html'
import Projects from '../../api/projects/projects'
import '../components/timetracker.js'
import '../components/projectchart.js'
import hex2rgba from '../../utils/hex2rgba.js'

Template.projectlist.onCreated(function createProjectList() {
  this.subscribe('myprojects')
  this.data.showArchived = new ReactiveVar(false)
})
Template.projectlist.helpers({
  projects() {
    return Template.instance().data.showArchived.get() ? Projects.find({}, { sort: { name: 1 } })
      : Projects.find({ $or: [{ archived: { $exists: false } }, { archived: false }] },
        { sort: { name: 1 } })
  },
  isProjectOwner(_id) {
    return Projects.findOne({ _id }) ? Projects.findOne({ _id }).userId === Meteor.userId() : false
  },
  colorOpacity(hex, op) {
    return hex2rgba(hex || '#009688', !isNaN(op) ? op : 50)
  },
  archived(_id) {
    return Projects.findOne({ _id }).archived
  },
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
  'change #showArchived': (event) => {
    Template.instance().data.showArchived.set($(event.currentTarget).is(':checked'))
  },
})
