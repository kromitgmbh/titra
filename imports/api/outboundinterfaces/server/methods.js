import { check, Match } from 'meteor/check'
import { NodeVM } from 'vm2'
import { fetch, Headers} from 'meteor/fetch'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import {
    adminAuthenticationMixin, authenticationMixin, transactionLogMixin,
} from '../../../utils/server_method_helpers'
import OutboundInterfaces from '../outboundinterfaces.js'

/**
 * Inserts a new outbound interface into the system.
 *
 * @method outboundinterfaces.insert
 * @param {Object} options - The options for the outbound interface.
 * @param {string} options.name - The name of the outbound interface.
 * @param {string} options.description - The description of the outbound interface.
 * @param {string} [options.processData] - The process data of the outbound interface (optional).
 * @param {string} [options.faIcon] - The font awesome icon of the outbound interface (optional).
 * @param {boolean} options.active - Indicates if the outbound interface is active.
 * @returns {string} - The success notification message.
 */
const outboundinterfacesinsert = new ValidatedMethod({
    name: 'outboundinterfaces.insert',
    validate({
        name, description, processData, active, faIcon,
    }) {
        check(name, String)
        check(description, String)
        check(processData, Match.Maybe(String))
        check(faIcon, Match.Maybe(String))
        check(active, Boolean)
    },
    mixins: [adminAuthenticationMixin, transactionLogMixin],
    async run({
        name, description, processData, active, faIcon,
    }) {
        await OutboundInterfaces.insertAsync({
            name,
            description,
            processData,
            active,
            faIcon,
        })
        return 'notifications.success'
    },
})
/**
 * Updates an outbound interface.
 *
 * @method outboundinterfaces.update
 * @param {Object} options - The options for updating the outbound interface.
 * @param {string} options._id - The ID of the outbound interface.
 * @param {string} options.name - The name of the outbound interface.
 * @param {string} options.description - The description of the outbound interface.
 * @param {string} [options.processData] - The processed data of the outbound interface (optional).
 * @param {boolean} options.active - The status of the outbound interface.
 * @param {string} [options.faIcon] - The font awesome icon of the outbound interface (optional).
 * @returns {string} - The success notification message.
 */
const outboundinterfacesupdate = new ValidatedMethod({
    name: 'outboundinterfaces.update',
    validate({
        _id,
        name,
        description,
        processData,
        faIcon,
        active,
    }) {
        check(_id, String)
        check(name, String)
        check(description, String)
        check(processData, Match.Maybe(String))
        check(active, Boolean)
        check(faIcon, Match.Maybe(String))
    },
    mixins: [adminAuthenticationMixin, transactionLogMixin],
    async run({
        _id,
        name,
        description,
        processData,
        faIcon,
        active,
    }) {
        await OutboundInterfaces.updateAsync({ _id }, {
            $set: {
                name,
                description,
                processData,
                active,
                faIcon,
            },
        })
        return 'notifications.success'
    },
})
/**
 * Removes an outbound interface.
 *
 * @method outboundinterfaces.remove
 * @param {Object} options - The options for removing the outbound interface.
 * @param {string} options._id - The ID of the outbound interface to be removed.
 * @returns {string} The success notification message.
 */
const outboundinterfacesremove = new ValidatedMethod({
    name: 'outboundinterfaces.remove',
    validate({ _id }) {
        check(_id, String)
    },
    mixins: [adminAuthenticationMixin, transactionLogMixin],
    async run({ _id }) {
        await OutboundInterfaces.removeAsync({ _id })
        return 'notifications.success'
    },
})

/**
 * Runs the outbound interface processData script with the given ID and data.
 *
 * @param {Object} options - The options for running the outbound interface.
 * @param {string} options._id - The ID of the outbound interface.
 * @param {Array} options.data - The data to be processed by the outbound interface.
 * @returns {string|boolean} - The result of running the outbound interface, or false if the outbound interface script threw an error.
 */
const outboundinterfacesrun = new ValidatedMethod({
    name: 'outboundinterfaces.run',
    validate({ _id, data }) {
        check(_id, String)
        check(data, Array)
    },
    mixins: [authenticationMixin],
    async run({ _id, data }) {
        const outboundInterface = await OutboundInterfaces.findOneAsync({ _id })
        if (outboundInterface) {
            const vm = new NodeVM({
                console: 'inherit',
                sandbox: {
                    fetch,
                    data,
                    Headers,
                },
            })
            const result = await vm.run(outboundInterface.processData)
            return 'notifications.success'
        }
        return false
    },
})
/**
 * Retrieves the active outbound interfaces.
 *
 * @method outboundinterfaces.get
 * @mixes authenticationMixin
 * @returns {Array} An array of active outbound interfaces.
 */
const getOutboundInterfaces = new ValidatedMethod({
    name: 'outboundinterfaces.get',
    validate: null,
    mixins: [authenticationMixin],
    async run() {
        return OutboundInterfaces.find({ active: true }, { fields: { processData: 0 } }).fetchAsync()
    },
})
export {
    outboundinterfacesinsert,
    outboundinterfacesupdate,
    outboundinterfacesremove,
    outboundinterfacesrun,
    getOutboundInterfaces,
}