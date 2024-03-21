import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './usersearch.html'
import Timecards from '../../../../api/timecards/timecards.js'
import Autocomplete from '../../../../utils/autocomplete'
import { getGlobalSetting } from '../../../../utils/frontend_helpers'

Template.usersearch.events({
  'click .js-remove-value': (event, templateInstance) => {
    event.preventDefault()
    event.stopPropagation()
    templateInstance.$('.js-usersearch-input').val('')
    templateInstance.targetUser.renderIfNeeded()
  },
})

Template.usersearch.onCreated(function usersearchcreated() {
  this.users = new ReactiveVar()
  this.autorun(() => {
    let tcid
    if (this.data.tcid && this.data.tcid.get()) {
      tcid = this.data.tcid.get()
    } else if (FlowRouter.getParam('tcid')) {
      tcid = FlowRouter.getParam('tcid')
    }
    if (tcid) {
      const handle = this.subscribe('singleTimecard', tcid)
      if (handle.ready()) {
        const card = Timecards.findOne({ _id: tcid })
        const user = this.users?.get()?.find((u) => u._id === card.userId)
        if (user?.profile) {
          this.$('.js-usersearch-input').val(user.profile.name)
        }
        Meteor.call('getProjectUsers', { projectId: card.projectId }, (error, result) => {
          const found = result.find((u) => u._id === card.userId)
          if (found?.profile) {
            this.$('.js-usersearch-input').val(found.profile.name)
          }
        })
      }
    }
  })
  this.autorun(() => {
    const loadUsers = (projectId) => {
      Meteor.call('getProjectUsers', { projectId }, (error, result) => {
        this.users.set(result)
      })
    }
    if (FlowRouter.getParam('projectId')) {
      loadUsers(FlowRouter.getParam('projectId'))
    }
    if (this.data.projectId.get()) {
      loadUsers(this.data.projectId.get())
    }
  })
})
Template.usersearch.onRendered(() => {
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    if (templateInstance.subscriptionsReady()) {
      const users = templateInstance.users.get() || []
      const userlist = users.map((entry) => ({ label: entry.profile.name, value: entry._id }))
      if (!templateInstance.targetUser) {
        templateInstance.targetUser = new Autocomplete(templateInstance.$('.js-usersearch-input').get(0), {
          data: userlist,
          maximumItems: getGlobalSetting('userSearchNumResults'),
          threshold: 0,
          onSelectItem: () => {
            templateInstance.$('.js-usersearch-input').removeClass('is-invalid')
            $('#tasks').first().trigger('focus')
          },
        })
      } else if (userlist.length > 0) {
        templateInstance.targetUser?.setData(userlist)
      }
    }
  })
})
Template.usersearch.helpers({
  user: () => Template.instance()?.data?.user,
})
