import Projects from './projects.js'

export default function initNewUser(userId, info) {
  Projects.insert({ userId, name: 'Default' })
}
