import { Blaze } from 'meteor/blaze'
import './editTimeEntryModal.html'

Template.editTimeEntryModal.onRendered(() => {
  const templateInstance = Template.instance()
  let bodyInstance
  templateInstance.$('#edit-tc-entry-modal').on('hidden.bs.modal', () => {
    Blaze.remove(bodyInstance)
  })
  templateInstance.$('#edit-tc-entry-modal').on('show.bs.modal', () => {
    if (templateInstance.data?.tcid?.get()) {
      bodyInstance = Blaze.renderWithData(Template.tracktime, { tcid: templateInstance.data?.tcid }, templateInstance.$('#editTimeEntryModalBody')[0])
    } else if (((!!templateInstance.data?.selectedDate?.get())
      || (!!templateInstance.data?.selectedProjectId?.get()))) {
      bodyInstance = Blaze.renderWithData(Template.tracktime, { dateArg: templateInstance.data?.selectedDate, projectIdArg: templateInstance.data?.selectedProjectId }, templateInstance.$('#editTimeEntryModalBody')[0])
    }
  })
})
