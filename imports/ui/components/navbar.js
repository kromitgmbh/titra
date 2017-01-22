import { Template } from 'meteor/templating'
import './timetracker.js'
import './navbar.html'
import { Projects } from '../../api/projects/projects.js'

Template.navbar.onCreated( function createAppLayout() {
    this.subscribe('myprojects')
})
Template.navbar.onRendered( () => {
  $(".button-collapse").sideNav()
  $(".dropdown-button").dropdown()
})
Template.navbar.helpers({
  projects() {
    return Projects.find()
  }
})
Template.navbar.events({
  'click .js-project-item'(event, instance) {
    event.preventDefault()
    // FlowRouter.go('projects', { id: event.target.id })
  }
})
