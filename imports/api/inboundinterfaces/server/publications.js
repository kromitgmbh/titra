import InboundInterfaces from '../inboundinterfaces.js'
import { checkAdminAuthentication } from '../../../utils/server_method_helpers.js'

Meteor.publish('inboundinterfaces', async function getInboundInterfaces() {
  checkAdminAuthentication(this)
  return InboundInterfaces.find({})
})
