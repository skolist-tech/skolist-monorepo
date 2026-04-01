terraform {
  backend "gcs" {
    bucket = "skolist-tofu-state-61f315ab"
    prefix = "infra/prod"
  }
}
