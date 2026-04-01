output "prod_url" {
  value = google_cloud_run_v2_service.prod.uri
}

output "stage_url" {
  value = google_cloud_run_v2_service.stage.uri
}

output "workload_identity_provider" {
  value = google_iam_workload_identity_pool_provider.github.name
}

output "github_actions_sa" {
  value = google_service_account.github_actions.email
}