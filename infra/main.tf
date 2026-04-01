terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "artifactregistry.googleapis.com"
  ])
  service            = each.value
  disable_on_destroy = false
}