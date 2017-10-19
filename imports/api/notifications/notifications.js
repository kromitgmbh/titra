import { Mongo } from 'meteor/mongo'
import { Email } from 'meteor/email'

const Notifications = new Mongo.Collection('notifications')

function addNotification(message, userId) {
  const id = Random.id()
  const meteorUser = Meteor.users.findOne({ _id: userId })
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
}

export { addNotification, Notifications as default }
