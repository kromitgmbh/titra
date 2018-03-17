import './customerselect.html'
import Customers from '../../api/customers/customers.js'

Template.customerselect.onCreated(function createCustomerSelect() {
  // this.resources = new ReactiveVar()
  this.autorun(() => {
    this.subscribe('projectCustomers', { projectId: Template.currentData().get() })
  })
})

Template.customerselect.helpers({
  customers() {
    return Customers.find()
  },
})
