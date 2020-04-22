import namedavatar from 'namedavatar'
import '@simonwep/pickr/dist/themes/monolith.min.css'
import Pickr from '@simonwep/pickr/dist/pickr.min'
import i18next from 'i18next'

import '../components/backbutton.js'
import './profile.html'
import { getUserSetting } from '../../utils/frontend_helpers.js'

Template.profile.helpers({
  name: () => getUserSetting('name'),
  svgAvatar() {
    namedavatar.config({
      nameType: 'initials',
      backgroundColors:
            [(Meteor.user() && getUserSetting('avatarColor')
              ? getUserSetting('avatarColor') : Template.instance().selectedAvatarColor.get())],
      minFontSize: 2,
    })
    const rawSVG = namedavatar.getSVG(Meteor.user() ? getUserSetting('name') : false)
    rawSVG.classList = 'rounded'
    rawSVG.style.width = '100px'
    rawSVG.style.height = '100px'
    return rawSVG.outerHTML
  },
  avatarColor: () => (Meteor.user() && getUserSetting('avatarColor')
    ? getUserSetting('avatarColor') : Template.instance().selectedAvatarColor.get()),
})


Template.profile.events({
  'click .js-save': (event, templateInstance) => {
    event.preventDefault()
    const updateJSON = {
      name: templateInstance.$('#name').val(),
      theme: templateInstance.$('#theme').val(),
      language: templateInstance.$('#language').val(),
      avatarColor: templateInstance.$('#avatarColor').val(),
    }
    if (!templateInstance.$('#avatarData').val() || templateInstance.$('#avatarData').val() !== 'false') {
      updateJSON.avatar = templateInstance.$('#avatarData').val()
    }
    Meteor.call('updateProfile', updateJSON, (error) => {
      if (error) {
        $.Toast.fire({ text: i18next.t(error.error), icon: 'error' })
      } else {
        $.Toast.fire(i18next.t('notifications.settings_saved_success'))
        templateInstance.$('#imagePreview').hide()
      }
    })
  },
  'click .js-logout': (event) => {
    event.preventDefault()
    Meteor.logout()
  },
  'change #avatarImage': (event, templateInstance) => {
    if (event.currentTarget.files && event.currentTarget.files[0]) {
      const reader = new FileReader()
      reader.onloadend = (callbackresult) => {
        const image = new Image()
        image.onload = () => {
          const maxHeight = 125
          const maxWidth = 125
          const resizeCanvas = document.createElement('canvas')
          let ratio = 1
          if (image.height > maxHeight) {
            ratio = maxHeight / image.height
          } else if (image.width > maxWidth) {
            ratio = maxWidth / image.width
          }
          if (resizeCanvas) {
            resizeCanvas.width = image.width * ratio
            resizeCanvas.height = image.height * ratio
            resizeCanvas
              .getContext('2d')
              .drawImage(image, 0, 0, resizeCanvas.width, resizeCanvas.height)
            const dataURL = resizeCanvas.toDataURL('image/png')
            templateInstance.$('#imagePreview img').attr('src', dataURL)
            templateInstance.$('#avatarData').val(dataURL)
            templateInstance.$('#imagePreview').show()
          } else {
            console.error('unable to create Canvas')
          }
        }
        image.src = callbackresult.target.result
      }
      reader.readAsDataURL(event.currentTarget.files[0])
    }
  },
  'click #removeAvatar': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('#avatarData').val('')
    templateInstance.$('.js-save').click()
  },
})
Template.profile.onCreated(function settingsCreated() {
  this.selectedAvatarColor = new ReactiveVar('#455A64')
})
Template.profile.onRendered(function settingsRendered() {
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user()
        && Meteor.user().profile && this.subscriptionsReady()) {
      templateInstance.$('#theme').val(getUserSetting('theme') ? getUserSetting('theme') : 'auto')
      templateInstance.$('#language').val(getUserSetting('language') ? getUserSetting('language') : 'auto')
      templateInstance.$('#avatarData').val(getUserSetting('avatar'))
      if (templateInstance.pickr) {
        templateInstance.pickr.destroy()
        delete templateInstance.pickr
      }
      if (!getUserSetting('avatar') && templateInstance.$('#avatarColorPickr').length) {
        const pickrOptions = {
          el: '#avatarColorPickr',
          theme: 'monolith',
          lockOpacity: true,
          comparison: false,
          position: 'left-start',
          default: (Meteor.user() && getUserSetting('avatarColor')
            ? getUserSetting('avatarColor') : Template.instance().selectedAvatarColor.get()),
          components: {
            preview: true,
            opacity: false,
            hue: true,
            interaction: {
              hex: false,
              input: false,
              clear: false,
              save: false,
            },
          },
        }
        templateInstance.pickr = Pickr.create(pickrOptions)
        templateInstance.pickr.on('change', (color) => {
          templateInstance.selectedAvatarColor.set(color.toHEXA().toString())
          templateInstance.$('#avatarColor').val(color.toHEXA().toString())
        })
      }
    }
  })
})
Template.profile.onDestroyed(function settingsDestroyed() {
  if (this.pickr) {
    this.pickr.destroy()
    delete this.pickr
  }
})
