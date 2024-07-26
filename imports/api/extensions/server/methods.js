import { ValidatedMethod } from 'meteor/mdg:validated-method'
import AdmZip from 'adm-zip'
import Extensions from '../extensions'
import { adminAuthenticationMixin, transactionLogMixin } from '../../../utils/server_method_helpers'

/**
 * Adds an extension.
 *
 * @param {Object} args - The arguments to use when adding the extension.
 * @param {string} args.zipFile - The zip file containing the extension to add.
 *
 * @return {Promise} - A promise that resolves to a success message if the extension was added,
 * or an error message if not.
 */
const addExtension = new ValidatedMethod({
  name: 'addExtension',
  validate: null,
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({ zipFile }) {
    const regex = /^data:.+\/(.+)base64,(.*)$/
    const matches = zipFile.match(regex)
    const data = matches[2]
    let zip
    if (data) {
      zip = new AdmZip(Buffer.from(data, 'base64'))
    } else {
      throw new Meteor.Error('Invalid extension upload.')
    }
    const newExtension = {}
    for (const zipEntry of zip.getEntries()) {
      if (zipEntry.entryName === 'extension.json') {
        const extensionDetails = JSON.parse(zipEntry.getData().toString('utf-8'))
        extensionDetails.userId = this.userId
        extensionDetails.isActive = true
        Object.assign(newExtension, extensionDetails)
      }
      if (zipEntry.entryName === 'client.js') {
        newExtension.client = zipEntry.getData().toString('utf-8')
      }
      if (zipEntry.entryName === 'server.js') {
        newExtension.server = zipEntry.getData().toString('utf-8')
      }
    }
    const existingExtension = await Extensions.findOneAsync({ name: newExtension.name })
    if (!existingExtension) {
      await Extensions.insertAsync(newExtension)
      return 'notifications.success'
    }
    throw new Meteor.Error('Extension has been added before.')
  },
})
/**
 * Removes an extension.
 *
 * @param {Object} extensionId - The ID of the extension to remove.
 * @return {String|Meteor.Error} 'notifications.success' on success,
 * or a Meteor.Error with a message 'Extension does not exist.' if the extension does not exist.
 * @throws {Meteor.Error} If the current user is not an admin.
 */
const removeExtension = new ValidatedMethod({
  name: 'removeExtension',
  validate(args) {
    check(args, {
      extensionId: String,
    })
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({ extensionId }) {
    const extension = await Extensions.findOneAsync({ _id: extensionId })
    if (extension) {
      await Extensions.removeAsync({ _id: extension._id })
      return 'notifications.success'
    }
    return new Meteor.Error('Extension does not exist.')
  },
})
/**

Launches a specified extension
@param {LaunchExtensionParams} params
@param {string} params.extensionId - The ID of the extension to launch
@throws {Meteor.Error} If the extension does not exist
@returns {String} 'notifications.success' if the extension was successfully launched,
'notifications.extensionAlreadyLaunched' if the extension was already launched
*/
const launchExtension = new ValidatedMethod({
  name: 'launchExtension',
  validate(args) {
    check(args, {
      extensionId: String,
    })
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({ extensionId }) {
    const extension = await Extensions.findOneAsync({ _id: extensionId })
    if (!extension) throw new Meteor.Error('Extension does not exist')
    try {
      eval(extension.server)
    } catch (error) {
      return 'notifications.extensionAlreadyLaunched'
    }
    return 'notifications.success'
  },
})
/**
 * Toggles the state of an extension
 * @param {String} extensionId - The ID of the extension to toggle the state of
 * @param {Boolean} state - The new state to set for the extension
 * @throws {Meteor.Error} If the extension does not exist
 * @returns {String} 'notifications.success' if the state was successfully updated
 */

const toggleExtensionState = new ValidatedMethod({
  name: 'toggleExtensionState',
  validate(args) {
    check(args, {
      extensionId: String,
      state: Boolean,
    })
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({ extensionId, state }) {
    const extension = await Extensions.findOneAsync({ _id: extensionId })
    if (extension) {
      await Extensions.updateAsync({ _id: extension._id }, { $set: { isActive: state } })
      return 'notifications.success'
    }
    return new Meteor.Error('Extension does not exist.')
  },
})
export {
  toggleExtensionState, launchExtension, addExtension, removeExtension,
}
