locals {
  # Shared across both environments
  shared_secrets = [
    "SUPABASE_SMS_HOOK_SECRET",
    "FIREBASE_CREDENTIALS",
  ]

  # Prod specific
  prod_secrets = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "SUPABASE_ANON_KEY",
    "GEMINI_API_KEY",
    "OPENAI_API_KEY",
  ]

  # Stage specific
  stage_secrets = [
    "SUPABASE_URL_STAGE",
    "SUPABASE_SERVICE_KEY_STAGE",
    "SUPABASE_ANON_KEY_STAGE",
    "GEMINI_API_KEY_STAGE",
    "OPENAI_API_KEY_STAGE",
  ]

  all_secrets = toset(concat(local.shared_secrets, local.prod_secrets, local.stage_secrets))
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = local.all_secrets
  secret_id = each.value

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}