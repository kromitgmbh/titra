import { Meteor } from 'meteor/meteor'
import { FlowRouter } from 'meteor/kadira:flow-router'
import './resourceselect.html'

Template.resourceselect.onCreated(function createResourceSelect() {
  this.resources = new ReactiveVar()
  this.autorun(() => {
    Meteor.call('getResourcesInProject', { projectId: FlowRouter.getParam('projectId') }, (error, result) => {
      if (error) {
        console.error(error)
      } else {
        this.resources.set(result)
      }
    })
  })
})

Template.resourceselect.helpers({
  resources() {
    return Template.instance().resources.get()
  },
})
