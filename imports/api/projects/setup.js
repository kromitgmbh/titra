import { Projects } from './projects.js';

export function initNewUser (userId, info) {
  Projects.insert({ userId: userId, name:'Default' })
}
