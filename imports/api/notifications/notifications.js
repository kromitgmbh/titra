import { Mongo } from 'meteor/mongo'
import { Email } from 'meteor/email'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { getGlobalSettingAsync } from '../../utils/server_method_helpers'

const Notifications = new Mongo.Collection('notifications')
const DailyMailLimit = new Mongo.Collection('dailymaillimit')
async function addNotification(message, userId) {
  dayjs.extend(utc)
  const id = Random.id()
  const meteorUser = await Meteor.users.findOneAsync({ _id: userId, inactive: { $ne: true } })
  const start = dayjs.utc().startOf('day').toDate()
  const end = dayjs.utc().endOf('day').toDate()
  const mailFrom = await getGlobalSettingAsync('fromAddress')
  const mailName = await getGlobalSettingAsync('fromName')
  let recipient = ''
  if (meteorUser) {
    recipient = meteorUser.emails[0].address
    await Notifications.removeAsync({ userId })
    await Notifications.insertAsync({ _id: id, userId, message })
    Meteor.setTimeout(async () => {
      await Notifications.removeAsync({ _id: id })
    }, 60000)
  } else {
    recipient = userId
  }
  if (!await DailyMailLimit
    .findOneAsync({ email: recipient, timestamp: { $gte: start, $lte: end } })) {
    await Email.sendAsync({
      to: recipient,
      from: `${mailName} <${mailFrom}>`,
      subject: `New notification from ${mailName}`,
      text: `Hey there ${meteorUser.profile.name},

I just wanted to let you know that something happened on ${mailName}:

${message}

Go to ${process.env.ROOT_URL} and login to learn more!

Have a nice day,
${mailName} Bot`,
    }).then(async () => {
      await DailyMailLimit.insertAsync({ email: recipient, timestamp: new Date() })
    })
  }
}

export { addNotification, Notifications as default }
