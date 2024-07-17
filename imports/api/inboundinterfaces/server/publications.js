import InboundInterfaces from '../inboundinterfaces.js'
import { checkAdminAuthentication } from '../../../utils/server_method_helpers.js'

/**
 * Publishes the inbound interfaces to the client.
 * Requires admin authentication.
 * @function getInboundInterfaces
 * @memberof Meteor.publish
 * @name 'inboundinterfaces'
 * @returns {Mongo.Cursor} The cursor containing the inbound interfaces.
 */
Meteor.publish('inboundinterfaces', async function getInboundInterfaces() {
  checkAdminAuthentication(this)
  return InboundInterfaces.find({})
})
