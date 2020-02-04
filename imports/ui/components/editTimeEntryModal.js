import './editTimeEntryModal.html'

Template.editTimeEntryModal.helpers({
  isEdit: () => (!!Template.instance().data.tcid && !!Template.instance().data.tcid.get()),
  isNewEntry: () => !(!!Template.instance().data.tcid && !!Template.instance().data.tcid.get())
    && ((!!Template.instance().data.selectedDate
    && !!Template.instance().data.selectedDate.get())
    || (!!Template.instance().data.selectedProjectId
        && !!Template.instance().data.selectedProjectId.get())),
})
Template.editTimeEntryModal.onDestroyed(() => {
  $('#edit-tc-entry-modal').modal('dispose')
  $('.modal-backdrop').remove()
  $('body').removeClass('modal-open')
})
