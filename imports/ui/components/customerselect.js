import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './customerselect.html'
import Customers from '../../api/customers/customers.js'

Template.customerselect.onRendered(() => {
  // this.resources = new ReactiveVar()
  Template.instance().autorun(() => {
    if (Template.currentData().get()) {
      Template.instance().subscribe('projectCustomers', { projectId: Template.currentData().get() })
    }
  })
})

Template.customerselect.helpers({
  customers() {
    return Customers.find({}, { sort: { name: 1 } })
  },
  selected(name) {
    return name === FlowRouter.getQueryParam('customer') ? 'selected' : false
  },
})
