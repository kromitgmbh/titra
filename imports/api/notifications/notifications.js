import { Mongo } from 'meteor/mongo'
import { Email } from 'meteor/email'
import moment from 'moment'

const Notifications = new Mongo.Collection('notifications')
const DailyMailLimit = new Mongo.Collection('dailymaillimit')
function addNotification(message, userId) {
  const id = Random.id()
  const meteorUser = Meteor.users.findOne({ _id: userId })
  const start = moment().startOf('day').toDate()
  const end = moment().endOf('day').toDate()
  let recipient = ''
  if (meteorUser) {
    recipient = meteorUser.emails[0].address
    Notifications.remove({ userId })
    Notifications.insert({ _id: id, userId, message })
    Meteor.setTimeout(() => {
      Notifications.remove({ _id: id })
    }, 60000)
  } else {
    recipient = userId
  }
  if (!DailyMailLimit.findOne({ email: recipient, timestamp: { $gte: start, $lte: end } })) {
    Email.send({
      to: recipient,
      from: 'no-reply@titra.ga',
      subject: 'New notification from titra',
      text: `Hey there ${meteorUser.profile.name},

I just wanted to let you know that something happened on titra:

${message}

Go to ${process.env.ROOT_URL} and login to learn more!

Have a nice day,
Titra Bot`,
    })
    DailyMailLimit.insert({ email: recipient, timestamp: new Date() })
  }
}

export { addNotification, Notifications as default }
