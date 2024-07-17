/**
 * Publishes the outbound interfaces to the client.
 * Requires admin authentication.
 * @function getOutboundInterfaces
 * @memberof Meteor.publish
 * @name 'outboundinterfaces'
 * @returns {Mongo.Cursor} The cursor containing the outbound interfaces.
 */
import OutboundInterfaces from '../outboundinterfaces.js'
import { checkAdminAuthentication } from '../../../utils/server_method_helpers.js'

Meteor.publish('outboundinterfaces', async function getOutboundInterfaces() {
  checkAdminAuthentication(this)
  return OutboundInterfaces.find({})
})
