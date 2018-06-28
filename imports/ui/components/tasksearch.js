import { FlowRouter } from 'meteor/kadira:flow-router'
import { DDP } from 'meteor/ddp-client'
import { Mongo } from 'meteor/mongo'
import './tasksearch.html'
import Tasks from '../../api/tasks/tasks.js'
import Timecards from '../../api/timecards/timecards.js'
import Projects from '../../api/projects/projects.js'

Template.tasksearch.events({
  'click .js-tasksearch-result': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('.js-tasksearch-input').val($(event.currentTarget).children('.js-tasksearch-task-name').text())
    templateInstance.$('.js-tasksearch-results').addClass('d-none')
  },
  'focus .js-tasksearch-input': (event, templateInstance) => {
    // if (!templateInstance.filter.get()) {
    templateInstance.$('.js-tasksearch-results').removeClass('d-none')
    // }
  },
  'blur .js-tasksearch-input': (event, templateInstance) => {
    // if (!templateInstance.filter.get()) {
    templateInstance.$('.js-tasksearch-results').addClass('d-none')
    // }
  },
  'keyup .js-tasksearch-input': (event, templateInstance) => {
    templateInstance.filter.set($(event.currentTarget).val())
    templateInstance.$('.js-tasksearch-results').removeClass('d-none')
    // templateInstance.$('.js-tasksearch-results').show()
  },
})

Template.tasksearch.onCreated(function tasksearchcreated() {
  this.filter = new ReactiveVar()
  this.autorun(() => {
    if (FlowRouter.getParam('tcid')) {
      const handle = this.subscribe('singleTimecard', FlowRouter.getParam('tcid'))
      if (handle.ready()) {
        this.$('.js-tasksearch-input').val(Timecards.findOne().task)
      }
    }
  })
  this.autorun(() => {
    if (FlowRouter.getParam('projectId')) {
      const project = Projects.findOne({ _id: FlowRouter.getParam('projectId') })
      if (project) {
        if (project.wekanurl) {
          if (Meteor.settings.public.sandstorm) {
            const ddpcon = DDP.connect(project.wekanurl.replace('#', '/.sandstorm-token/'))
            this.wekanTasks = new Mongo.Collection('cards', { connection: ddpcon })
            ddpcon.subscribe('board', 'sandstorm')
          } else {
            const ddpcon = DDP.connect(project.wekanurl.substring(0, project.wekanurl.indexOf('/api')))
            ddpcon.call('login', { resume: project.wekanurl.match(/authToken=(.*)/)[1] })
            this.wekanTasks = new Mongo.Collection('cards', { connection: ddpcon })
            ddpcon.subscribe('board', project.wekanurl.match(/boards\/(.*)\//)[1])
          }
        }
        this.subscribe('lastTimecards', { projectId: FlowRouter.getParam('projectId'), limit: 3 })
      }
    }
    this.subscribe('mytasks', this.filter.get() ? this.filter.get() : '')
  })
})

Template.tasksearch.helpers({
  tasks: () => {
    if (!Template.instance().filter.get()) {
      return Timecards.find({ projectId: FlowRouter.getParam('projectId') }, { sort: { date: -1 }, limit: 3 })
    }
    if (Template.instance().wekanTasks) {
      const wekanResult = Template.instance().wekanTasks.find({ title: { $regex: `.*${Template.instance().filter.get()}.*`, $options: 'i' }, archived: false }, { limit: 5 })
      if (wekanResult.count() > 0) {
        return wekanResult.map(elem => ({ name: elem.title, wekan: true }))
      }
    }
    const result = Tasks.find({ name: { $regex: `.*${Template.instance().filter.get()}.*`, $options: 'i' } }, { limit: 5 })
    return result.count() > 0 ? result : false
  },
  filter: () => Template.instance().filter.get(),
})
