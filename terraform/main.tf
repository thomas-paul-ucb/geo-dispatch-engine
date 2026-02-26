provider "kubernetes" {
  config_path = "~/.kube/config"
}

resource "kubernetes_namespace" "prod" {
  metadata {
    name = "geo-dispatch-prod"
  }
}