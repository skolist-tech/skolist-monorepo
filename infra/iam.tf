# --- Cloud Run Runtime Service Account ---
# Separate SA for Cloud Run (better than using compute default)
resource "google_service_account" "cloud_run_sa" {
  account_id   = "cloud-run-runtime"
  display_name = "Cloud Run Runtime SA"
}

resource "google_secret_manager_secret_iam_member" "run_secret_access" {
  for_each  = local.all_secrets
  secret_id = google_secret_manager_secret.secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# --- GitHub Actions SA ---
resource "google_service_account" "github_actions" {
  account_id   = "github-actions-deployer"
  display_name = "GitHub Actions Deployer"
}

# Workload Identity Federation (no long-lived JSON keys)
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions Pool"
  depends_on                = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  attribute_condition = "assertion.repository == '${var.github_repo}'"  # security: lock to your repo

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account_iam_member" "github_wif" {
  service_account_id = google_service_account.github_actions.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}

# GitHub Actions permissions
resource "google_project_iam_member" "github_run_deploy" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "github_sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "github_artifact_push" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}