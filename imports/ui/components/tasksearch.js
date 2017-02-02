import './tasksearch.html'
import Tasks from '../../api/tasks/tasks.js'

Template.tasksearch.events({
  'click .js-tasksearch-result': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('.js-tasksearch-input').val(event.currentTarget.innerHTML)
    templateInstance.$('js-tasksearch-results').hide()
    Materialize.updateTextFields()
  },
  'keyup .js-tasksearch-input': (event, templateInstance) => {
    templateInstance.filter.set($(event.currentTarget).val())
    templateInstance.$('js-tasksearch-results').show()
  },
})

Template.tasksearch.onCreated(function tasksearchcreated() {
  this.filter = new ReactiveVar()
  this.autorun(() => {
    this.subscribe('mytasks', this.filter.get())
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
