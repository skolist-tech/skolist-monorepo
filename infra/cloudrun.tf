# ---- PROD ----
resource "google_cloud_run_v2_service" "prod" {
  name     = "backend-main"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"
  invoker_iam_disabled = true

  scaling {
    min_instance_count = 1
    max_instance_count = 10
  }

  deletion_protection = false

  template {
    service_account = google_service_account.cloud_run_sa.email

    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }

    containers {
      image = var.app_image_prod

      resources {
        limits = { memory = "1Gi" }
      }

      env {
        name = "SUPABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["SUPABASE_URL"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "SUPABASE_SERVICE_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["SUPABASE_SERVICE_KEY"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "SUPABASE_ANON_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["SUPABASE_ANON_KEY"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["GEMINI_API_KEY"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "OPENAI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["OPENAI_API_KEY"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "SMS_HOOK_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["SUPABASE_SMS_HOOK_SECRET"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "FIREBASE_CREDENTIALS"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["FIREBASE_CREDENTIALS"].secret_id
            version = "latest"
          }
        }
      }

      env { 
        name = "LOGGING_LEVEL"   
        value = "INFO" 
        }
      env { 
        name = "DEPLOYMENT_ENV"  
        value = "PRODUCTION" 
        }
      env { 
        name = "PING"
        value = "TRUE" 
        }
      env { 
        name = "LOG_IMAGES"      
        value = "FALSE" 
        }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image
    ]
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.backend
  ]
}

# ---- STAGE ----
resource "google_cloud_run_v2_service" "stage" {
  name     = "backend-stage"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"
  invoker_iam_disabled = true

  scaling {
    min_instance_count = 1
    max_instance_count = 5
  }

  deletion_protection = false

  template {
    service_account = google_service_account.cloud_run_sa.email

    scaling {
      min_instance_count = 1
      max_instance_count = 5    # stage doesn't need to scale as high
    }

    containers {
      image = var.app_image_stage

      resources {
        limits = { memory = "1Gi" }
      }

      env {
        name = "SUPABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["SUPABASE_URL_STAGE"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "SUPABASE_SERVICE_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["SUPABASE_SERVICE_KEY_STAGE"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "SUPABASE_ANON_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["SUPABASE_ANON_KEY_STAGE"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["GEMINI_API_KEY_STAGE"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "OPENAI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["OPENAI_API_KEY_STAGE"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "SMS_HOOK_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["SUPABASE_SMS_HOOK_SECRET"].secret_id  # shared
            version = "latest"
          }
        }
      }
      env {
        name = "FIREBASE_CREDENTIALS"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["FIREBASE_CREDENTIALS"].secret_id  # shared
            version = "latest"
          }
        }
      }

      env { 
        name = "LOGGING_LEVEL"   
        value = "DEBUG" 
        }
      env { 
        name = "DEPLOYMENT_ENV"  
        value = "STAGING" 
        }
      env { 
        name = "PING"            
        value = "TRUE" 
        }
      env { 
        name = "LOG_IMAGES"      
        value = "FALSE" 
        }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image
    ]
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.backend
  ]
}

# Public access for both
resource "google_cloud_run_v2_service_iam_member" "prod_public" {
  name     = google_cloud_run_v2_service.prod.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "stage_public" {
  name     = google_cloud_run_v2_service.stage.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
