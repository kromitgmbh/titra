import moment from 'moment'
import i18next from 'i18next'
import './about.html'

Template.about.onCreated(function aboutCreated() {
  this.statistics = new ReactiveVar()
  Meteor.call('getStatistics', (error, result) => {
    if (!error) {
      this.statistics.set(result)
    } else {
      console.error(error)
    }
  })
})
Template.about.events({
  'click #retrieveChangeLog': (event, templateInstance) => {
    event.preventDefault()
    if (!templateInstance.$('#changelog').hasClass('show')) {
        import('node-emoji').then((emojiImport) => {
          const emoji = emojiImport.default
          const replacer = (match) => emoji.emojify(match)
          $.getJSON('https://api.github.com/repos/kromitgmbh/titra/tags', (data) => {
            const tag = data[2]
            $.getJSON(tag.commit.url, (commitData) => {
              templateInstance.$('#titra-changelog').html(`Version <a href='https://github.com/kromitgmbh/titra/tags' target='_blank'>${tag.name}</a> (${moment(commitData.commit.committer.date).format('DD.MM.YYYY')}) :<br/>${commitData.commit.message.replace(/(:.*:)/g, replacer)}`)
            })
          }).fail(() => {
            templateInstance.$('#titra-changelog').html(i18next.t('settings.titra_changelog_error'))
          })
        })
    }
  },
})
Template.about.helpers({
  statistics() {
    return Template.instance().statistics.get()
  },
  humanize(duration) {
    return moment.duration(duration, 'seconds').humanize()
  },
  bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) {
      return '0 Byte'
    }
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
    return `${Math.round(bytes / Math.pow(1024, i), 2)}  ${sizes[i]}`
  },
})
