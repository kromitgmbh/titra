
// Import to load these templates
// import Popper from 'popper.js'
import './useraccounts-configuration.js'
import './routes.js'
import './startup.js'

window.BootstrapLoaded = new ReactiveVar(false)
import('popper.js').then((Popper) => {
  // window.Tether = Tether.default
  window.Popper = Popper.default
  import('bootstrap').then(() => {
    $('[data-toggle="tooltip"]').tooltip()
    window.BootstrapLoaded.set(true)
  })
})
