import { FlowRouter } from 'meteor/kadira:flow-router'
import './tasksearch.html'
import Tasks from '../../api/tasks/tasks.js'
import Timecards from '../../api/timecards/timecards.js'

Template.tasksearch.events({
  'click .js-tasksearch-result': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('.js-tasksearch-input').val(event.currentTarget.innerHTML)
    templateInstance.$('js-tasksearch-results').hide()
    // Materialize.updateTextFields()
  },
  'keyup .js-tasksearch-input': (event, templateInstance) => {
    if ($(event.currentTarget).val() !== '') {
      templateInstance.filter.set($(event.currentTarget).val())
      templateInstance.$('js-tasksearch-results').show()
    }
  },
})

Template.tasksearch.onCreated(function tasksearchcreated() {
  this.filter = new ReactiveVar()
  this.autorun(() => {
    this.subscribe('mytasks', this.filter.get())
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
    const result = Tasks.find({ name: { $regex: `.*${Template.instance().filter.get()}.*`, $options: 'i' } })
    return result.count() > 0 ? result : false
  },
})
