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
    templateInstance.$('.js-tasksearch-results').hide()
  },
  'keyup .js-tasksearch-input': (event, templateInstance) => {
    templateInstance.filter.set($(event.currentTarget).val())
    templateInstance.$('.js-tasksearch-results').show()
  },
})

Template.tasksearch.onCreated(function tasksearchcreated() {
  this.filter = new ReactiveVar()
  this.autorun(() => {
    if (FlowRouter.getParam('projectId')) {
      const project = Projects.findOne({ _id: FlowRouter.getParam('projectId') })
      if (project) {
        if (project.wekanurl) {
          const ddpcon = DDP.connect(project.wekanurl.replace('#', '/.sandstorm-token/'))
          this.wekanTasks = new Mongo.Collection('cards', { connection: ddpcon })
          ddpcon.subscribe('board', 'sandstorm')
        }
      }
    }
    this.subscribe('mytasks', this.filter.get() ? this.filter.get() : '')
    if (FlowRouter.getParam('tcid')) {
      this.subscribe('singleTimecard', FlowRouter.getParam('tcid'))
      if (this.subscriptionsReady()) {
        this.$('.js-tasksearch-input').val(Timecards.findOne().task)
      }
    }
  })
})

Template.tasksearch.helpers({
  tasks: () => {
    if (!Template.instance().filter.get()) {
      return false
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
})
