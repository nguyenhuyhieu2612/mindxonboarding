# 🌐 Ingress Controller & Load Balancing - Complete Guide

Hướng dẫn chi tiết về Ingress Controller, Load Balancing và Path-based Routing trong Kubernetes/AKS.

## 📚 Table of Contents

1. [Khái Niệm Cơ Bản](#khái-niệm-cơ-bản)
2. [Ingress Controller](#ingress-controller)
3. [Load Balancing](#load-balancing)
4. [Path-based Routing](#path-based-routing)
5. [SSL/TLS Termination](#ssltls-termination)
6. [Advanced Topics](#advanced-topics)

---

## 🎯 Khái Niệm Cơ Bản

### Tại Sao Cần Ingress Controller?

#### ❌ Vấn Đề: Không Có Ingress

```
┌─────────────────────────────────────────────────┐
│              Internet (User)                     │
└────────────┬───────────────┬────────────────────┘
             │               │
             │               │
   ┌─────────▼─────────┐  ┌─▼──────────────┐
   │  LoadBalancer 1    │  │ LoadBalancer 2 │
   │  IP: 20.1.1.1      │  │ IP: 20.1.1.2   │
   │  $20/month         │  │ $20/month      │
   └─────────┬─────────┘  └─┬──────────────┘
             │               │
   ┌─────────▼─────────┐  ┌─▼──────────────┐
   │  Backend Service   │  │ Frontend Svc   │
   │  (ClusterIP)       │  │ (ClusterIP)    │
   └────────────────────┘  └────────────────┘

Problems:
❌ Mỗi service cần 1 Load Balancer riêng
❌ Mỗi LB tốn ~$20/tháng
❌ Nhiều Public IPs khó quản lý
❌ Không có central routing
❌ Không có SSL termination chung
```

#### ✅ Giải Pháp: Có Ingress Controller

```
┌─────────────────────────────────────────────────┐
│              Internet (User)                     │
│         https://api.domain.com                   │
│         https://domain.com                       │
└────────────────────┬────────────────────────────┘
                     │
                     │ CHỈ 1 Public IP!
                     │
┌────────────────────▼────────────────────────────┐
│         Azure Load Balancer                      │
│         IP: 20.1.1.1 (1 cái thôi!)              │
│         Cost: $20/month                          │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│       Ingress Controller (Nginx/Traefik)        │
│  ┌──────────────────────────────────────────┐   │
│  │  Routing Rules:                          │   │
│  │  ✅ api.domain.com → backend-service     │   │
│  │  ✅ domain.com → frontend-service        │   │
│  │  ✅ SSL/TLS termination                  │   │
│  │  ✅ Load balancing                       │   │
│  │  ✅ Path-based routing                   │   │
│  └──────────────────────────────────────────┘   │
└─────────┬───────────────────────┬────────────────┘
          │                       │
┌─────────▼─────────┐    ┌───────▼──────────┐
│ Backend Service   │    │ Frontend Service │
│ (ClusterIP)       │    │ (ClusterIP)      │
└─────────┬─────────┘    └───────┬──────────┘
          │                       │
     ┌────▼────┐            ┌────▼────┐
     │ Pods    │            │ Pods    │
     │ (2+)    │            │ (2+)    │
     └─────────┘            └─────────┘

Benefits:
✅ Chỉ 1 Load Balancer cho tất cả services
✅ Tiết kiệm chi phí (1 IP thay vì nhiều)
✅ Central routing & management
✅ SSL/TLS termination tập trung
✅ Advanced routing (path, host, headers)
```

### So Sánh: Service Types

| Type | Public IP | Use Case | Cost |
|------|-----------|----------|------|
| **ClusterIP** | ❌ Không | Internal services | Free |
| **NodePort** | ✅ Có (qua node IP) | Development | Free |
| **LoadBalancer** | ✅ Có (dedicated) | Production (1 service) | ~$20/month |
| **Ingress** | ✅ Có (shared) | Production (nhiều services) | ~$20/month (shared) |

---

## 🎮 Ingress Controller

### Ingress Controller Là Gì?

**Định nghĩa:**
Ingress Controller là một **reverse proxy** chạy trong Kubernetes cluster, nhận traffic từ bên ngoài và route đến các services bên trong theo rules.

**Các loại phổ biến:**
- **Nginx Ingress Controller** ⭐ (phổ biến nhất)
- Traefik
- HAProxy
- Istio Gateway
- Kong
- Ambassador

### Architecture Chi Tiết

```
┌──────────────────────────────────────────────────────┐
│                    INTERNET                          │
└────────────────────┬─────────────────────────────────┘
                     │ HTTPS (443)
                     │ HTTP (80)
                     │
┌────────────────────▼─────────────────────────────────┐
│         Azure Load Balancer (Layer 4)                │
│  ┌────────────────────────────────────────────────┐  │
│  │  - Distribute TCP/UDP traffic                  │  │
│  │  - Health checks                               │  │
│  │  - Session affinity (optional)                 │  │
│  └────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│    Nginx Ingress Controller Pods (Layer 7)          │
│  ┌────────────────────────────────────────────────┐  │
│  │  Pod 1 (Active)          Pod 2 (Active)        │  │
│  │  ┌──────────────┐       ┌──────────────┐      │  │
│  │  │ Nginx Process│       │ Nginx Process│      │  │
│  │  │              │       │              │      │  │
│  │  │ - SSL Term   │       │ - SSL Term   │      │  │
│  │  │ - Routing    │       │ - Routing    │      │  │
│  │  │ - LB Logic   │       │ - LB Logic   │      │  │
│  │  └──────────────┘       └──────────────┘      │  │
│  └────────────────────────────────────────────────┘  │
└────────┬────────────────────────┬────────────────────┘
         │                        │
         │ Read Ingress Resources │
         │                        │
┌────────▼────────────────────────▼───────────────────┐
│        Kubernetes API Server                        │
│  ┌──────────────────────────────────────────────┐  │
│  │  Ingress Resources:                          │  │
│  │  - ingress-backend.yaml                      │  │
│  │  - ingress-frontend.yaml                     │  │
│  │  - Routes, TLS, Rules...                     │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │                        │
    Route traffic          Route traffic
         │                        │
┌────────▼──────────┐    ┌───────▼──────────┐
│ Backend Service   │    │ Frontend Service │
│ (ClusterIP)       │    │ (ClusterIP)      │
│ Port: 3001        │    │ Port: 3000       │
└────────┬──────────┘    └───────┬──────────┘
         │                        │
    ┌────▼────┐              ┌───▼────┐
    │Backend  │              │Frontend│
    │Pods     │              │Pods    │
    └─────────┘              └────────┘
```

### Components Chi Tiết

#### 1. Ingress Controller (Nginx Pod)

```yaml
# Deployment của Ingress Controller
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  replicas: 2  # High availability
  selector:
    matchLabels:
      app: ingress-nginx
  template:
    metadata:
      labels:
        app: ingress-nginx
    spec:
      containers:
      - name: controller
        image: registry.k8s.io/ingress-nginx/controller:v1.9.0
        args:
        - /nginx-ingress-controller
        - --election-id=ingress-controller-leader
        - --controller-class=k8s.io/ingress-nginx
        - --watch-ingress-without-class=true
        ports:
        - name: http
          containerPort: 80
        - name: https
          containerPort: 443
        resources:
          requests:
            cpu: 100m
            memory: 90Mi
          limits:
            cpu: 200m
            memory: 256Mi
```

**Vai trò:**
- 📖 Đọc Ingress resources từ Kubernetes API
- 🔄 Tự động cập nhật Nginx config khi Ingress thay đổi
- 🌐 Nhận traffic từ Load Balancer
- 🎯 Route traffic đến đúng service based on rules
- 🔒 Handle SSL/TLS termination

#### 2. Ingress Service (LoadBalancer)

```yaml
# Service expose Ingress Controller ra ngoài
apiVersion: v1
kind: Service
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  type: LoadBalancer  # Tạo Azure Load Balancer
  selector:
    app: ingress-nginx
  ports:
  - name: http
    port: 80
    targetPort: 80
    protocol: TCP
  - name: https
    port: 443
    targetPort: 443
    protocol: TCP
  externalTrafficPolicy: Local  # Keep source IP
```

**Vai trò:**
- ☁️ Tạo Azure Load Balancer với Public IP
- 🔌 Forward traffic từ LB đến Ingress Controller pods
- ❤️ Health checks cho Ingress pods

#### 3. Ingress Resource (Rules)

```yaml
# Ingress resource định nghĩa routing rules
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mindx-ingress
  namespace: mindx-onboarding
  annotations:
    # Annotations control Ingress behavior
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  
  # TLS configuration
  tls:
  - hosts:
    - api.domain.com
    - domain.com
    secretName: mindx-tls-secret
  
  # Routing rules
  rules:
  - host: api.domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 3001
  
  - host: domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 3000
```

**Vai trò:**
- 📋 Định nghĩa routing rules (host, path, service)
- 🔒 Configure SSL/TLS
- ⚙️ Set behaviors qua annotations

---

## ⚖️ Load Balancing

### Load Balancing Layers

```
┌──────────────────────────────────────────────────┐
│  OSI Model Layers                                │
├──────────────────────────────────────────────────┤
│  Layer 7 - Application (HTTP/HTTPS)              │
│  ↑ Ingress Controller (Nginx) hoạt động ở đây   │
│  │ - Hiểu HTTP headers, paths, methods           │
│  │ - Advanced routing (path, host, cookie)       │
│  │ - SSL/TLS termination                         │
│  │ - Content-based routing                       │
├──────────────────────────────────────────────────┤
│  Layer 4 - Transport (TCP/UDP)                   │
│  ↑ Azure Load Balancer hoạt động ở đây          │
│  │ - Distribute TCP connections                  │
│  │ - Simple, fast, efficient                     │
│  │ - Không hiểu HTTP                             │
├──────────────────────────────────────────────────┤
│  Layer 3 - Network (IP)                          │
│  Layer 2 - Data Link (MAC)                       │
│  Layer 1 - Physical                              │
└──────────────────────────────────────────────────┘
```

### Layer 4 vs Layer 7 Load Balancing

#### Layer 4 (Azure Load Balancer)

```
Client → [Layer 4 LB] → Backend Pods
         ↓
    Decision based on:
    - Source IP
    - Source Port
    - Destination IP
    - Destination Port
    - Protocol (TCP/UDP)

Characteristics:
✅ Very fast (no packet inspection)
✅ Low latency
✅ Protocol agnostic
❌ No content-based routing
❌ No SSL termination
❌ Limited routing options
```

**Example:**
```
Client 1 (IP: 1.1.1.1) → LB → Pod 1
Client 2 (IP: 2.2.2.2) → LB → Pod 2
Client 3 (IP: 3.3.3.3) → LB → Pod 1
```

#### Layer 7 (Nginx Ingress)

```
Client → [Layer 7 LB] → Backend Pods
         ↓
    Decision based on:
    - HTTP Host header
    - URL Path
    - HTTP Method (GET/POST)
    - Cookies
    - Headers
    - Query parameters

Characteristics:
✅ Content-based routing
✅ SSL/TLS termination
✅ Advanced rules
✅ URL rewriting
✅ Header manipulation
❌ Slower (packet inspection)
❌ Higher resource usage
```

**Example:**
```
GET /api/users → Backend API Pod
GET /         → Frontend Pod
GET /admin    → Admin Service Pod
```

### Load Balancing Algorithms

#### 1. Round Robin (Default)

```
Request 1 → Pod 1
Request 2 → Pod 2  
Request 3 → Pod 3
Request 4 → Pod 1  (back to first)
Request 5 → Pod 2
...

Pros:
✅ Simple, fair distribution
✅ Good for homogeneous pods

Cons:
❌ Không xét đến pod load
❌ Không xét đến response time
```

```nginx
# Nginx config
upstream backend {
    server backend-pod-1:3001;
    server backend-pod-2:3001;
    server backend-pod-3:3001;
}
```

#### 2. Least Connections

```
Current connections:
Pod 1: 10 connections
Pod 2: 5 connections   ← New request goes here
Pod 3: 8 connections

Pros:
✅ Better for long-lived connections
✅ Balanced load distribution

Cons:
❌ More complex
❌ Overhead tracking connections
```

```nginx
# Nginx config
upstream backend {
    least_conn;
    server backend-pod-1:3001;
    server backend-pod-2:3001;
}
```

#### 3. IP Hash (Session Affinity)

```
Client IP: 192.168.1.1 → hash → Pod 1 (always)
Client IP: 192.168.1.2 → hash → Pod 3 (always)
Client IP: 192.168.1.3 → hash → Pod 2 (always)

Pros:
✅ Session persistence
✅ Stateful applications

Cons:
❌ Uneven distribution nếu clients không đều
❌ Sticky sessions
```

```nginx
# Nginx config
upstream backend {
    ip_hash;
    server backend-pod-1:3001;
    server backend-pod-2:3001;
}
```

```yaml
# Kubernetes annotation
annotations:
  nginx.ingress.kubernetes.io/affinity: "cookie"
  nginx.ingress.kubernetes.io/session-cookie-name: "route"
```

#### 4. Weighted Round Robin

```
Pod 1 (weight: 3) → Gets 3x more requests
Pod 2 (weight: 2) → Gets 2x more requests
Pod 3 (weight: 1) → Gets 1x more requests

Use case:
- Pods có khác capacity
- Canary deployments
- A/B testing
```

```nginx
# Nginx config
upstream backend {
    server backend-pod-1:3001 weight=3;
    server backend-pod-2:3001 weight=2;
    server backend-pod-3:3001 weight=1;
}
```

### Kubernetes Service Load Balancing

```
┌─────────────────────────────────────────────┐
│  Ingress Controller                         │
│  Route: /api → backend-service              │
└────────────────┬────────────────────────────┘
                 │
                 │ Request to: backend-service:3001
                 │
┌────────────────▼────────────────────────────┐
│  Service: backend-service (ClusterIP)       │
│  ┌────────────────────────────────────────┐ │
│  │ kube-proxy load balancing:             │ │
│  │ - Round robin by default               │ │
│  │ - iptables rules                       │ │
│  │ - Service IP: 10.0.1.100:3001         │ │
│  └────────────────────────────────────────┘ │
└─────┬──────────────┬──────────────┬─────────┘
      │              │              │
      │              │              │
┌─────▼──────┐ ┌────▼──────┐ ┌────▼──────┐
│ Pod 1      │ │ Pod 2     │ │ Pod 3     │
│ 10.0.2.1   │ │ 10.0.2.2  │ │ 10.0.2.3  │
│ :3001      │ │ :3001     │ │ :3001     │
└────────────┘ └───────────┘ └───────────┘

Note: Có 2 layers của load balancing:
1. Ingress Controller → Service (Layer 7)
2. Service → Pods (Layer 4, kube-proxy)
```

---

## 🛣️ Path-based Routing

### Basic Path Routing

```
┌──────────────────────────────────────────────┐
│  domain.com/                                 │
│  ├── /             → Frontend Service        │
│  ├── /api/         → Backend Service         │
│  ├── /admin/       → Admin Service           │
│  └── /static/      → Static Files Service    │
└──────────────────────────────────────────────┘
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: path-based-ingress
spec:
  rules:
  - host: domain.com
    http:
      paths:
      
      # Frontend - catch-all (order matters!)
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 3000
      
      # Backend API
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 3001
      
      # Admin panel
      - path: /admin
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 8080
      
      # Static files (CDN)
      - path: /static
        pathType: Prefix
        backend:
          service:
            name: static-service
            port:
              number: 80
```

**Traffic Flow:**
```
GET /                    → frontend-service
GET /about               → frontend-service
GET /api/users           → backend-service
GET /api/auth/login      → backend-service
GET /admin               → admin-service
GET /admin/users         → admin-service
GET /static/image.png    → static-service
```

### PathType Options

#### 1. Prefix (Phổ biến nhất)

```yaml
path: /api
pathType: Prefix

Matches:
✅ /api
✅ /api/
✅ /api/users
✅ /api/users/123
✅ /api/auth/login

Doesn't match:
❌ /apiv2
❌ /api-docs
```

#### 2. Exact

```yaml
path: /api
pathType: Exact

Matches:
✅ /api
✅ /api/

Doesn't match:
❌ /api/users
❌ /api/anything
```

#### 3. ImplementationSpecific

```yaml
path: /api/*
pathType: ImplementationSpecific

# Depends on Ingress Controller implementation
# Nginx: supports regex, wildcards
```

### Path Matching Priority

```yaml
# ⚠️ ORDER MATTERS in some controllers!

rules:
- host: domain.com
  http:
    paths:
    
    # 1. Most specific first
    - path: /api/v2/users
      pathType: Exact
      backend:
        service:
          name: api-v2-users
    
    # 2. More specific
    - path: /api/v2
      pathType: Prefix
      backend:
        service:
          name: api-v2
    
    # 3. Less specific
    - path: /api
      pathType: Prefix
      backend:
        service:
          name: api-v1
    
    # 4. Catch-all (last!)
    - path: /
      pathType: Prefix
      backend:
        service:
          name: frontend

# Nginx evaluates by specificity, not order
# But best practice: put specific paths first
```

### URL Rewriting

#### Remove Path Prefix

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2

spec:
  rules:
  - host: domain.com
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: backend-service
            port:
              number: 3001
```

**Example:**
```
Client request:  GET /api/users/123
Nginx rewrites:  GET /users/123
Backend receives: GET /users/123

Without rewrite:
Backend receives: GET /api/users/123
```

#### Add Path Prefix

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/configuration-snippet: |
      rewrite ^/(.*)$ /api/$1 break;
```

**Example:**
```
Client request:  GET /users/123
Nginx rewrites:  GET /api/users/123
Backend receives: GET /api/users/123
```

### Advanced Routing Examples

#### 1. API Versioning

```yaml
rules:
- host: api.domain.com
  http:
    paths:
    
    # Version 2 API
    - path: /v2
      pathType: Prefix
      backend:
        service:
          name: api-v2-service
          port:
            number: 3002
    
    # Version 1 API (legacy)
    - path: /v1
      pathType: Prefix
      backend:
        service:
          name: api-v1-service
          port:
            number: 3001
    
    # Default to v2
    - path: /
      pathType: Prefix
      backend:
        service:
          name: api-v2-service
          port:
            number: 3002
```

#### 2. Microservices Architecture

```yaml
rules:
- host: api.domain.com
  http:
    paths:
    
    # User service
    - path: /users
      pathType: Prefix
      backend:
        service:
          name: user-service
          port:
            number: 3001
    
    # Product service
    - path: /products
      pathType: Prefix
      backend:
        service:
          name: product-service
          port:
            number: 3002
    
    # Order service
    - path: /orders
      pathType: Prefix
      backend:
        service:
          name: order-service
          port:
            number: 3003
    
    # Payment service
    - path: /payments
      pathType: Prefix
      backend:
        service:
          name: payment-service
          port:
            number: 3004
```

**Traffic Flow:**
```
GET /users/123      → user-service
GET /products/456   → product-service
POST /orders        → order-service
POST /payments      → payment-service
```

#### 3. Multi-tenant Routing

```yaml
# Option 1: Path-based tenants
rules:
- host: app.domain.com
  http:
    paths:
    - path: /tenant1
      pathType: Prefix
      backend:
        service:
          name: tenant1-service
    
    - path: /tenant2
      pathType: Prefix
      backend:
        service:
          name: tenant2-service

# Option 2: Subdomain-based tenants (better)
rules:
- host: tenant1.domain.com
  http:
    paths:
    - path: /
      pathType: Prefix
      backend:
        service:
          name: tenant1-service

- host: tenant2.domain.com
  http:
    paths:
    - path: /
      pathType: Prefix
      backend:
        service:
          name: tenant2-service
```

---

## 🔒 SSL/TLS Termination

### SSL Termination Architecture

```
┌──────────────────────────────────────────────┐
│  Client Browser                              │
│  https://domain.com                          │
└────────────┬─────────────────────────────────┘
             │
             │ ⚡ HTTPS (encrypted)
             │ Port 443
             │
┌────────────▼─────────────────────────────────┐
│  Ingress Controller (Nginx)                  │
│  ┌────────────────────────────────────────┐  │
│  │  SSL/TLS Termination happens here      │  │
│  │  - Decrypt HTTPS                       │  │
│  │  - Read certificates from Secret       │  │
│  │  - Forward as HTTP internally          │  │
│  └────────────────────────────────────────┘  │
└────────────┬─────────────────────────────────┘
             │
             │ 🔓 HTTP (plain, internal only)
             │ Port 80/3001/3000
             │
┌────────────▼─────────────────────────────────┐
│  Backend Services                            │
│  - No SSL needed                             │
│  - Faster (no encryption overhead)           │
│  - Simpler configuration                     │
└──────────────────────────────────────────────┘

Benefits:
✅ Centralized certificate management
✅ Backend services don't need SSL
✅ Better performance
✅ Automatic certificate renewal (cert-manager)
```

### TLS Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-ingress
  annotations:
    # Force HTTPS
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    
    # cert-manager auto-creates certificate
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    
    # TLS protocols
    nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2 TLSv1.3"
    
    # Ciphers for security
    nginx.ingress.kubernetes.io/ssl-ciphers: "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384"

spec:
  ingressClassName: nginx
  
  # TLS configuration
  tls:
  - hosts:
    - domain.com
    - api.domain.com
    - www.domain.com
    secretName: mindx-tls-secret  # Certificate stored here
  
  rules:
  - host: domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 3000
```

**Certificate Secret:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mindx-tls-secret
  namespace: mindx-onboarding
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-certificate>
  tls.key: <base64-encoded-private-key>
```

### Traffic Flow với SSL

```
1. Client → Ingress (HTTPS)
   GET https://domain.com/api/users
   ↓
   ✅ TLS handshake
   ✅ Certificate validation
   ✅ Encrypted connection

2. Ingress terminates SSL
   ↓
   🔓 Decrypt
   ✅ Read certificate from Secret
   ✅ Validate client request

3. Ingress → Backend (HTTP)
   GET http://backend-service:3001/api/users
   ↓
   🔓 Plain HTTP (inside cluster)
   ✅ Fast (no encryption overhead)
   ✅ Secure (internal network)

4. Backend → Ingress (HTTP)
   Response with data
   ↓

5. Ingress → Client (HTTPS)
   ⚡ Encrypt response
   ✅ Send back to client
```

---

## 🎯 Advanced Topics

### 1. Canary Deployments

```yaml
# Main production service
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: production
spec:
  rules:
  - host: api.domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-v1  # 90% traffic
            port:
              number: 3001

# Canary service (10% traffic)
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"  # 10% traffic
spec:
  rules:
  - host: api.domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-v2  # New version
            port:
              number: 3002
```

**Traffic Distribution:**
```
100 requests:
├── 90 requests → api-v1 (stable)
└── 10 requests → api-v2 (canary)

Gradually increase:
10% → 25% → 50% → 100%
```

### 2. Header-based Routing

```yaml
metadata:
  annotations:
    # Route based on header
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-by-header: "X-Canary"
    nginx.ingress.kubernetes.io/canary-by-header-value: "true"

# Usage:
curl -H "X-Canary: true" https://api.domain.com/
→ Routes to canary service

curl https://api.domain.com/
→ Routes to production service
```

### 3. Rate Limiting

```yaml
metadata:
  annotations:
    # Limit requests per IP
    nginx.ingress.kubernetes.io/limit-rps: "10"  # 10 requests/second
    nginx.ingress.kubernetes.io/limit-connections: "5"  # 5 concurrent connections
    
    # Burst
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "5"
```

### 4. Authentication

```yaml
metadata:
  annotations:
    # Basic Auth
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: basic-auth
    nginx.ingress.kubernetes.io/auth-realm: 'Authentication Required'
    
    # OAuth2 Proxy
    nginx.ingress.kubernetes.io/auth-url: "https://oauth2.domain.com/auth"
    nginx.ingress.kubernetes.io/auth-signin: "https://oauth2.domain.com/start"
```

### 5. CORS Configuration

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://frontend.domain.com"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization"
    nginx.ingress.kubernetes.io/cors-allow-credentials: "true"
```

### 6. Custom Error Pages

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/custom-http-errors: "404,503"
    nginx.ingress.kubernetes.io/default-backend: custom-error-pages
```

### 7. WebSocket Support

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/websocket-services: "websocket-service"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"

spec:
  rules:
  - host: ws.domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: websocket-service
            port:
              number: 8080
```

### 8. Request/Response Modification

```yaml
metadata:
  annotations:
    # Add custom headers to backend
    nginx.ingress.kubernetes.io/configuration-snippet: |
      proxy_set_header X-Request-ID $request_id;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Original-URI $request_uri;
    
    # Add headers to response
    nginx.ingress.kubernetes.io/server-snippet: |
      add_header X-Served-By $hostname;
      add_header X-Response-Time $request_time;
```

---

## 🛠️ Troubleshooting

### Debug Ingress Issues

```bash
# 1. Check Ingress resource
kubectl describe ingress mindx-ingress -n mindx-onboarding

# 2. Check Ingress Controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller --tail=100

# 3. Check service endpoints
kubectl get endpoints backend-service -n mindx-onboarding

# 4. Test from Ingress Controller pod
kubectl exec -it -n ingress-nginx deployment/ingress-nginx-controller -- curl http://backend-service.mindx-onboarding:3001/api/health

# 5. Check Nginx configuration
kubectl exec -it -n ingress-nginx deployment/ingress-nginx-controller -- cat /etc/nginx/nginx.conf

# 6. Validate Ingress syntax
kubectl apply --dry-run=client -f k8s/ingress.yaml
```

### Common Issues

#### Issue: 404 Not Found
```bash
# Check:
1. Ingress host matches request
2. Path matches correctly
3. Service exists and has endpoints
4. Backend pods are running

# Debug:
kubectl get ingress -n mindx-onboarding
kubectl get svc -n mindx-onboarding
kubectl get endpoints -n mindx-onboarding
kubectl get pods -n mindx-onboarding
```

#### Issue: 502 Bad Gateway
```bash
# Means: Ingress can't reach backend

# Check:
1. Backend pods running?
2. Service has endpoints?
3. Port correct?
4. Health checks passing?

# Debug:
kubectl describe pod <backend-pod> -n mindx-onboarding
kubectl logs <backend-pod> -n mindx-onboarding
```

#### Issue: 503 Service Unavailable
```bash
# Means: No healthy backends available

# Check:
1. Pods in CrashLoopBackOff?
2. Health checks failing?
3. Resource limits hit?

# Debug:
kubectl get pods -n mindx-onboarding
kubectl describe pod <pod> -n mindx-onboarding
```

---

## 📊 Best Practices

### 1. Security

```yaml
✅ Always use HTTPS (ssl-redirect: true)
✅ Use TLS 1.2+ only
✅ Enable HSTS
✅ Set strong cipher suites
✅ Use cert-manager for auto-renewal
✅ Implement rate limiting
✅ Add authentication where needed
```

### 2. Performance

```yaml
✅ Enable caching where appropriate
✅ Use compression (gzip)
✅ Set appropriate timeouts
✅ Use connection pooling
✅ Implement CDN for static assets
✅ Monitor response times
```

### 3. Reliability

```yaml
✅ Run multiple Ingress Controller replicas (2+)
✅ Set resource requests/limits
✅ Configure health checks
✅ Use readiness/liveness probes
✅ Implement circuit breakers
✅ Set up monitoring/alerting
```

### 4. Scalability

```yaml
✅ Use HPA for Ingress Controller
✅ Separate static/dynamic content
✅ Use appropriate load balancing algorithms
✅ Implement caching layers
✅ Optimize backend services
```

---

## 📚 Summary

### Key Concepts Recap

1. **Ingress Controller** = Reverse proxy trong K8s
   - Nhận traffic từ outside
   - Route đến services bên trong
   - Layer 7 load balancing

2. **Load Balancing**
   - Layer 4: Azure LB (TCP/UDP)
   - Layer 7: Nginx (HTTP/HTTPS)
   - Algorithms: Round Robin, Least Conn, IP Hash

3. **Path-based Routing**
   - Route dựa trên URL path
   - PathType: Prefix, Exact, ImplementationSpecific
   - Support rewriting, redirects

4. **SSL/TLS Termination**
   - Decrypt tại Ingress
   - Backend dùng HTTP plain
   - Automatic với cert-manager

### Architecture Flow

```
Internet → Azure LB (L4) → Ingress (L7) → Service → Pods
           │                │               │
           ▼                ▼               ▼
      Port 80/443      SSL Term         ClusterIP
      1 Public IP      Routing          Load balance
      Health checks    Path match       kube-proxy
```

---

**Chi tiết implementation:** [scripts/setup-ingress.sh](../scripts/setup-ingress.sh)  
**Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)  
**Back:** [README.md](../README.md)

