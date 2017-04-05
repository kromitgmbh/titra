import { Meteor } from 'meteor/meteor'
import './projectlist.html'
import Projects from '../../api/projects/projects'
import '../components/timetracker.js'
import '../components/projectchart.js'

Template.projectlist.onCreated(function createProjectList() {
  this.subscribe('myprojects')
})
Template.projectlist.helpers({
  projects() {
    return Projects.find({}, { sort: { name: 1 } })
  },
  isProjectOwner(_id) {
    return Projects.findOne({ _id }) ? Projects.findOne({ _id }).userId === Meteor.userId() : false
  },
})

Template.projectlist.events({
  'click .js-delete-project': (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (confirm('Do you really want to delete this project?')) {
      const projectId = event.currentTarget.id
      Meteor.call('deleteProject', { projectId }, (error) => {
        if (!error) {
          $.notify('Project deleted successfully')
        } else {
          console.error(error)
        }
      })
    }
  },
})
