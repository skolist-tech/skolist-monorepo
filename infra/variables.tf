variable "project_id" {}
variable "region"      { default = "us-central1" }
variable "github_repo" {}
variable "artifact_registry_repo_id" { default = "my-app" }
variable "app_image_prod"  {}
variable "app_image_stage" {}