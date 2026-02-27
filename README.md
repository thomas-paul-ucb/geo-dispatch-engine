# 🌍 Geo-Dispatch Engine

A high-performance, production-grade logistics dispatching system. This engine leverages **Geospatial indexing**, **Distributed Caching**, and **Cloud-Native Orchestration** to match riders with drivers in real-time.

---

## 🏗️ System Evolution
This project evolved through three distinct architectural phases:
1.  **Application Core**: NestJS API with GraphQL and PostGIS for spatial data persistence.
2.  **High-Performance Layer**: Integrated Redis Geospatial indexing and BullMQ for self-healing background tasks.
3.  **Cloud Infrastructure**: Full containerization, Infrastructure as Code (IaC) via Terraform, and Orchestration via Kubernetes.

---

## 🚀 Key Features

### 📍 Geospatial Intelligence
* **PostGIS Integration**: Advanced spatial queries to find nearby drivers within specific radii.
* **Redis Geospatial Indexing**: High-frequency location updates for sub-millisecond driver matching.
* **Real-time Tracking**: Live driver updates via **GraphQL Subscriptions** and **Redis Pub/Sub**.

### ⚡ Performance & Reliability
* **Hybrid Data Strategy**: Dual-layer logic using Redis for low-latency matching and Postgres for persistent state.
* **Self-Healing Workers**: **BullMQ** background workers to automatically recover driver statuses and maintain system integrity.
* **Validation & Safety**: Strict DTO validation and global pipes for reliable API consumption.

### ☁️ Cloud Architecture
* **Infrastructure as Code**: Entire environment (Namespaces, Secrets) managed via **Terraform**.
* **Orchestration**: Fully containerized deployment on **Kubernetes** with dedicated replicas for high availability.
* **CI/CD Ready**: Multi-stage **Docker** builds optimized for production-ready images.

---

## 🛠️ Tech Stack

| Category | Tools |
| :--- | :--- |
| **Backend** | NestJS (TypeScript), GraphQL (Apollo) |
| **Databases** | PostgreSQL + PostGIS, Redis |
| **Queueing** | BullMQ |
| **DevOps** | Docker, Kubernetes (kubectl), Terraform |
| **Monitoring** | Winston Structured Logging |

---

## 🚦 Getting Started

### Prerequisites
* Docker & Docker Desktop (with Kubernetes enabled)
* Terraform CLI
* Node.js (v20+)

### Local Development (Quick Start)
```bash
# Install dependencies
npm install

# Start local infrastructure (DB & Redis)
docker-compose up -d

# Run in development mode
npm run start:dev

```
### Cloud Infrastructure Deployment (K8s)

```bash
# 1. Initialize and apply Infrastructure
cd terraform
terraform init
terraform apply

# 2. Deploy API and Services
cd ..
kubectl apply -f k8s/

```
