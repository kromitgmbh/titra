workflow "automatically tag pushes" {
  resolves = ["Autotag"]
  on = "push"
}

action "Autotag" {
  uses = "author/action-autotag@1.0.1"
  secrets = ["GITHUB_TOKEN"]
  env = {
    TAG_PREFIX = "v"
  }
}
