#!/bin/bash
# Exit on any error
set -e

# Function to display help
show_help() {
  echo "Usage: ./deploy.sh [action]"
  echo ""
  echo "Actions:"
  echo "  -start, start      Start Minikube, build Docker images, commit & push, apply manifests, and port-forward"
  echo "  -stop, stop        Kill port-forwards and clean up deployed Kubernetes resources"
  echo "  -help, help        Show this help message"
}

# Function to start everything
start_deployments() {
  echo "🚀 Starting DevOps progressive delivery & GitOps pipeline local setup..."

  # 1. Start Minikube if it is not already running
  if ! minikube status >/dev/null 2>&1; then
    echo "📦 Minikube is not running. Starting Minikube..."
    minikube start \
      --driver=docker \
      --cpus=4 \
      --memory=4096 \
      --extra-config=kubelet.fail-swap-on=false \
      --extra-config=kubelet.cgroup-driver=systemd
  else
    echo "✅ Minikube is already running."
  fi

  # 2. Enable Ingress Addon
  echo "🔌 Enabling Ingress addon..."
  minikube addons enable ingress

  # 3. Create Namespaces if they don't exist
  echo "🗂️ Setting up namespaces..."
  kubectl get ns finops >/dev/null 2>&1 || kubectl create namespace finops
  kubectl get ns argocd >/dev/null 2>&1 || kubectl create namespace argocd

  # 4. Install Argo CD if not already installed
  if ! kubectl get deployment argocd-server -n argocd >/dev/null 2>&1; then
    echo "💿 Installing Argo CD..."
    kubectl create -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
    echo "⏳ Waiting for Argo CD Server deployment to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd
  else
    echo "✅ Argo CD is already installed."
  fi

  # 5. Install Argo Rollouts if not already installed
  if ! kubectl get deployment argo-rollouts -n argo-rollouts >/dev/null 2>&1; then
    echo "💿 Installing Argo Rollouts..."
    kubectl create namespace argo-rollouts || true
    kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
  else
    echo "✅ Argo Rollouts is already installed."
  fi

  # 6. Build Docker Images inside Minikube Docker Daemon
  echo "🐳 Building Docker images in Minikube registry..."
  eval $(minikube docker-env)
  docker build -t fintech-backend:v1 ./backend
  docker build -t fintech-frontend:v2 ./frontend

  # 7. Git Add, Commit and Push changes
  echo "📤 Committing and pushing local changes to GitHub..."
  git add .
  if git diff-index --quiet HEAD --; then
    echo "✅ Git working directory clean. No changes to commit."
  else
    git commit -m "deploy: update local configurations and manifests"
    git push origin main
  fi

  # 8. Apply Argo CD App configuration
  echo "🐙 Applying Argo CD Application configuration..."
  kubectl apply -f k8s/argocd-app.yaml

  # 9. Start Port Forwards in background
  echo "🔌 Setting up port-forwards..."

  # Close existing port forwards to prevent conflicts
  pkill -f "kubectl port-forward" || true
  sleep 1

  echo "🌐 Starting port-forward for Argo CD on https://localhost:8181..."
  nohup kubectl port-forward svc/argocd-server -n argocd 8181:443 >/dev/null 2>&1 &

  echo "⏳ Waiting for fintech-frontend service to be created by Argo CD..."
  until kubectl get svc fintech-frontend -n finops >/dev/null 2>&1; do
    sleep 2
  done

  echo "💻 Starting port-forward for Frontend Dashboard on http://localhost:8080..."
  nohup kubectl port-forward svc/fintech-frontend -n finops 8080:80 >/dev/null 2>&1 &

  echo "⏳ Waiting for Grafana service to be created by Argo CD..."
  until kubectl get svc grafana -n finops >/dev/null 2>&1; do
    sleep 2
  done

  echo "⏳ Waiting for Grafana deployment to be fully ready..."
  kubectl rollout status deployment/grafana -n finops --timeout=120s

  echo "📊 Starting port-forward for Grafana on http://localhost:3000..."
  nohup kubectl port-forward svc/grafana -n finops 3000:3000 >/dev/null 2>&1 &

  echo "🎉 Done! Application is ready."
  echo "🔗 Frontend Dashboard: http://localhost:8080"
  echo "🔗 Argo CD Server: https://localhost:8181"
  echo "🔗 Grafana Dashboard: http://localhost:3000"
}

# Function to stop everything
stop_deployments() {
  echo "🛑 Stopping deployments and cleaning up..."

  # 1. Kill any active port forwarding
  echo "🔌 Killing port-forwarding processes..."
  pkill -f "kubectl port-forward" || true

  # 2. Delete ArgoCD Application configuration (this deletes all resources managed by it)
  if kubectl get application fintech-app -n argocd >/dev/null 2>&1; then
    echo "🐙 Deleting Argo CD Application (this will prune/delete the resources)..."
    kubectl delete -f k8s/argocd-app.yaml
  else
    echo "✅ Argo CD Application is not deployed."
  fi

  # 3. Clean namespace contents
  echo "🧹 Deleting namespace resources..."
  kubectl delete namespace finops --ignore-not-found=true || true

  echo "✅ Stopped! Cleaned up all Kubernetes deployments and port-forwards."
}

# Parse command line argument
ACTION=$1

case "$ACTION" in
  -start|start|--start)
    start_deployments
    ;;
  -stop|stop|--stop)
    stop_deployments
    ;;
  -help|help|--help|"")
    show_help
    ;;
  *)
    echo "❌ Unknown action: $ACTION"
    show_help
    exit 1
    ;;
esac
