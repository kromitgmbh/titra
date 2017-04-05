import { Mongo } from 'meteor/mongo'

const Projects = new Mongo.Collection('projects')
const ProjectStats = new Mongo.Collection('projectStats')
export { ProjectStats, Projects as default }
