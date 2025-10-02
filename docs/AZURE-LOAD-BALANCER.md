# ☁️ Azure Load Balancer - Complete Deep Dive

Giải thích chi tiết vai trò và hoạt động của Azure Load Balancer trong AKS.

## 📋 Table of Contents

1. [Azure Load Balancer Là Gì?](#azure-load-balancer-là-gì)
2. [Vai Trò và Chức Năng](#vai-trò-và-chức-năng)
3. [Không Có Load Balancer Sẽ Ra Sao?](#không-có-load-balancer-sẽ-ra-sao)
4. [Quan Hệ với Ingress Controller](#quan-hệ-với-ingress-controller)
5. [Technical Deep Dive](#technical-deep-dive)

---

## 🎯 Azure Load Balancer Là Gì?

### Định Nghĩa

**Azure Load Balancer** là một **Layer 4 (Transport Layer)** load balancer được Azure quản lý, hoạt động ở TCP/UDP level.

```
┌──────────────────────────────────────────────────┐
│  Azure Load Balancer                             │
│  ┌────────────────────────────────────────────┐  │
│  │  Managed Service by Azure                  │  │
│  │  - Layer 4 (TCP/UDP)                       │  │
│  │  - Public IP address                       │  │
│  │  - Health probes                           │  │
│  │  - Distribution rules                      │  │
│  │  - High availability                       │  │
│  │  - Automatic scaling                       │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Key Characteristics

| Feature | Description |
|---------|-------------|
| **Layer** | Layer 4 (Transport) - TCP/UDP |
| **Management** | Fully managed by Azure |
| **Type** | External (Public) or Internal |
| **IP** | Static Public IP address |
| **Cost** | ~$20-30/month |
| **Availability** | 99.99% SLA |

---

## 🎮 Vai Trò và Chức Năng

### 1. **Entry Point to Cluster**

Azure Load Balancer là **cổng vào duy nhất** từ internet vào AKS cluster của bạn.

```
                    THE WORLD
┌─────────────────────────────────────────────────┐
│  Internet Users Everywhere                      │
│  - USA, Europe, Asia, ...                       │
│  - Mobile, Desktop, IoT                         │
└────────────────┬────────────────────────────────┘
                 │
                 │ All traffic goes through
                 │ ONE public IP address
                 │
┌────────────────▼────────────────────────────────┐
│     Azure Load Balancer                         │
│     Public IP: 20.212.123.45                    │
│     ┌─────────────────────────────────────────┐ │
│     │  "I am the gatekeeper!"                 │ │
│     │  - Receives ALL external traffic        │ │
│     │  - Single point of entry                │ │
│     │  - Highly available                     │ │
│     └─────────────────────────────────────────┘ │
└────────────────┬────────────────────────────────┘
                 │
                 │ Distributes to
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   ┌─────────┐      ┌─────────┐
   │ Node 1  │      │ Node 2  │
   │ (VM)    │      │ (VM)    │
   └─────────┘      └─────────┘
        │                 │
        └────────┬────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   Ingress Pod 1    Ingress Pod 2
```

**Without LB:**
```
❌ No single entry point
❌ Each node would need its own public IP
❌ Users would need to know individual node IPs
❌ No automatic failover
❌ Manual management nightmare
```

### 2. **Public IP Address Provisioning**

Azure LB cung cấp một **Static Public IP** cho cluster.

```
┌─────────────────────────────────────────────────┐
│  DNS Configuration                              │
│                                                 │
│  domain.com          A    20.212.123.45        │
│  api.domain.com      A    20.212.123.45        │
│  www.domain.com      A    20.212.123.45        │
│                                                 │
│  ALL domains → SAME IP (Azure LB)              │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Azure Load Balancer                            │
│  IP: 20.212.123.45 (Static, never changes)     │
│                                                 │
│  Benefits:                                      │
│  ✅ One IP for all services                     │
│  ✅ Easy DNS management                         │
│  ✅ Stable (IP doesn't change)                  │
│  ✅ Can whitelist in firewalls                  │
└─────────────────────────────────────────────────┘
```

**Scenario Without LB:**
```
Option 1: NodePort
├─ Expose services on node IPs
├─ Each node has different IP
├─ domain.com → 10.0.1.1:30080
├─ api.domain.com → 10.0.1.2:30081
└─ ❌ Messy, unreliable, not production-ready

Option 2: Each Service = LoadBalancer
├─ Each service gets own LB
├─ domain.com → 20.1.1.1 (LB 1)
├─ api.domain.com → 20.1.1.2 (LB 2)
└─ ❌ Expensive ($20 × services)
```

### 3. **Traffic Distribution**

Azure LB phân phối traffic đến multiple backend targets.

```
┌──────────────────────────────────────────────────┐
│  Azure Load Balancer                             │
│  IP: 20.212.123.45                               │
│  ┌────────────────────────────────────────────┐  │
│  │  Distribution Algorithm: Hash-based        │  │
│  │  - 5-tuple hash (srcIP, srcPort,           │  │
│  │    dstIP, dstPort, protocol)               │  │
│  │  - Sticky sessions optional                │  │
│  └────────────────────────────────────────────┘  │
└────────┬───────────────────────┬─────────────────┘
         │                       │
         │ Distribute traffic    │
         │                       │
    ┌────▼────┐             ┌────▼────┐
    │ Node 1  │             │ Node 2  │
    │ 10.0.1.4│             │ 10.0.1.5│
    └────┬────┘             └────┬────┘
         │                       │
         │ Has Ingress Pod?      │ Has Ingress Pod?
         │                       │
    ┌────▼──────────┐      ┌────▼──────────┐
    │ Ingress Pod 1 │      │ Ingress Pod 2 │
    │ Running ✅     │      │ Running ✅     │
    └───────────────┘      └───────────────┘
```

**Distribution Example:**
```
User 1 (IP: 1.1.1.1) → hash → Node 1
User 2 (IP: 2.2.2.2) → hash → Node 2
User 3 (IP: 3.3.3.3) → hash → Node 1
User 1 (IP: 1.1.1.1) → hash → Node 1 (same!)

Benefits:
✅ Even distribution across nodes
✅ Session persistence (same IP → same node)
✅ Automatic with no configuration
```

**Without LB:**
```
❌ No automatic distribution
❌ Manual DNS round-robin (unreliable)
❌ No session persistence
❌ Users hit dead nodes
```

### 4. **Health Probing**

Azure LB liên tục kiểm tra health của backend targets.

```
┌──────────────────────────────────────────────────┐
│  Azure Load Balancer                             │
│  ┌────────────────────────────────────────────┐  │
│  │  Health Probe Configuration                │  │
│  │  - Probe: HTTP GET /healthz                │  │
│  │  - Interval: 15 seconds                    │  │
│  │  - Timeout: 5 seconds                      │  │
│  │  - Unhealthy threshold: 2 failures         │  │
│  └────────────────────────────────────────────┘  │
└────────┬───────────────────────┬─────────────────┘
         │                       │
         │ Probe every 15s       │ Probe every 15s
         │                       │
    ┌────▼────┐             ┌────▼────┐
    │ Node 1  │             │ Node 2  │
    │         │             │         │
    │ Health: │             │ Health: │
    │ ✅ OK   │             │ ❌ FAIL │
    └─────────┘             └─────────┘
         │                       │
         ▲                       ▲
         │                       │
         │                       │ No traffic sent!
         │ Traffic sent          │
         │                       │
    Active                   Removed from
    backend                  rotation
```

**Health Check Flow:**
```
Every 15 seconds:
1. LB → Node 1 → GET /healthz
   └─ Response: 200 OK ✅
   └─ Action: Keep in rotation

2. LB → Node 2 → GET /healthz
   └─ Response: Timeout ❌ (1st failure)
   
3. LB → Node 2 → GET /healthz (15s later)
   └─ Response: Timeout ❌ (2nd failure)
   └─ Action: Remove from rotation
   └─ Traffic stops going to Node 2

4. When Node 2 recovers:
   LB → Node 2 → GET /healthz
   └─ Response: 200 OK ✅
   └─ Action: Add back to rotation
```

**Benefits:**
```
✅ Automatic failure detection
✅ No traffic to unhealthy backends
✅ Self-healing (auto recovery)
✅ Zero-downtime maintenance
```

**Without LB:**
```
❌ No automatic health checks
❌ Traffic sent to failed nodes
❌ Users get errors
❌ Manual intervention needed
❌ Downtime during failures
```

### 5. **Port Forwarding**

Azure LB forwards traffic từ public ports đến internal ports.

```
┌──────────────────────────────────────────────────┐
│  Azure Load Balancer                             │
│  Public IP: 20.212.123.45                        │
│  ┌────────────────────────────────────────────┐  │
│  │  Port Forwarding Rules:                    │  │
│  │                                            │  │
│  │  Port 80 (HTTP)  → Node Port 30080        │  │
│  │  Port 443 (HTTPS) → Node Port 30443       │  │
│  │                                            │  │
│  │  Standard ports → Non-standard node ports │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘

Public Access:
http://20.212.123.45:80    → Forwarded to → Node:30080
https://20.212.123.45:443  → Forwarded to → Node:30443

Benefits:
✅ Users use standard ports (80, 443)
✅ Internal ports can be anything
✅ Security through obscurity
✅ Flexibility in configuration
```

**Example Traffic:**
```
User Request:
https://domain.com/api/users
   ↓
DNS resolves: 20.212.123.45
   ↓
User connects: 20.212.123.45:443
   ↓
Azure LB receives: Port 443
   ↓
Azure LB forwards to: Node IP:30443
   ↓
Node receives: Port 30443
   ↓
iptables routes to: Ingress Pod:443
   ↓
Ingress Pod processes request
```

### 6. **High Availability**

Azure LB itself là highly available.

```
┌──────────────────────────────────────────────────┐
│  Azure Load Balancer (Zone Redundant)           │
│  ┌────────────────────────────────────────────┐  │
│  │  Availability Zone 1                       │  │
│  │  ├─ LB Instance 1 ✅                       │  │
│  │                                            │  │
│  │  Availability Zone 2                       │  │
│  │  ├─ LB Instance 2 ✅                       │  │
│  │                                            │  │
│  │  Availability Zone 3                       │  │
│  │  └─ LB Instance 3 ✅                       │  │
│  │                                            │  │
│  │  - 99.99% SLA                              │  │
│  │  - Automatic failover                      │  │
│  │  - No single point of failure             │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘

If one zone fails:
Zone 1 ❌ Down
   ↓
Automatic failover
   ↓
Zone 2 ✅ Takes over
   ↓
Zero downtime
   ↓
Users don't notice anything
```

**SLA Guarantee:**
```
Azure LB: 99.99% uptime
= 52.56 minutes downtime per year
= 4.38 minutes per month
= Highly reliable!
```

---

## ❌ Không Có Load Balancer Sẽ Ra Sao?

### Scenario 1: NodePort Service

```yaml
# Service without LoadBalancer
apiVersion: v1
kind: Service
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  type: NodePort  # ❌ No LoadBalancer
  ports:
  - port: 80
    nodePort: 30080
  - port: 443
    nodePort: 30443
```

**Architecture:**
```
┌──────────────────────────────────────────────────┐
│  Internet Users                                  │
└────────────┬─────────────────────┬───────────────┘
             │                     │
             │ Need to know        │ Need to know
             │ individual IPs!     │ individual IPs!
             │                     │
        ┌────▼────┐           ┌────▼────┐
        │ Node 1  │           │ Node 2  │
        │ Public: │           │ Public: │
        │10.0.1.4 │           │10.0.1.5 │
        └────┬────┘           └────┬────┘
             │                     │
     Access via:           Access via:
     10.0.1.4:30080       10.0.1.5:30080
     10.0.1.4:30443       10.0.1.5:30443
```

**Problems:**

❌ **No Single Entry Point**
```
Users need to know:
- node1.example.com:30080
- node2.example.com:30080
- node3.example.com:30080

If Node 1 dies:
└─ Users accessing node1.example.com get errors
└─ No automatic failover
└─ Manual intervention needed
```

❌ **Non-Standard Ports**
```
Users must use:
- http://domain.com:30080  (not :80)
- https://domain.com:30443 (not :443)

Problems:
├─ Ugly URLs
├─ Port blocked by firewalls
├─ Not user-friendly
└─ Not production-ready
```

❌ **No Health Checks**
```
If Node is down:
├─ DNS still points to it
├─ Users get connection errors
├─ No automatic removal
└─ Manual DNS update needed
```

❌ **No Traffic Distribution**
```
How to distribute traffic?
├─ Manual DNS round-robin
│  └─ Unreliable
│  └─ No health awareness
│  └─ Cache issues
└─ Client-side load balancing
   └─ Complex
   └─ Not standard
```

❌ **Security Issues**
```
- Node IPs exposed publicly
- All nodes need public IPs
- Larger attack surface
- Port scanning concerns
```

### Scenario 2: Multiple LoadBalancers

```yaml
# Each service gets own LoadBalancer
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  type: LoadBalancer  # Costs $20/month
  ports:
  - port: 3001

---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  type: LoadBalancer  # Costs $20/month
  ports:
  - port: 3000

---
apiVersion: v1
kind: Service
metadata:
  name: admin-service
spec:
  type: LoadBalancer  # Costs $20/month
  ports:
  - port: 8080
```

**Architecture:**
```
┌──────────────────────────────────────────────────┐
│  Internet                                        │
└───┬──────────────┬──────────────┬────────────────┘
    │              │              │
    │              │              │
┌───▼──────────┐ ┌─▼──────────┐ ┌─▼──────────┐
│ LB 1         │ │ LB 2       │ │ LB 3       │
│ IP: 20.1.1.1 │ │ IP: 20.1.1.2│ │ IP: 20.1.1.3│
│ $20/month    │ │ $20/month   │ │ $20/month  │
└───┬──────────┘ └─┬──────────┘ └─┬──────────┘
    │              │              │
┌───▼──────────┐ ┌─▼──────────┐ ┌─▼──────────┐
│ Backend Svc  │ │ Frontend   │ │ Admin Svc  │
└──────────────┘ └────────────┘ └────────────┘
```

**Problems:**

❌ **High Cost**
```
3 services = 3 Load Balancers
= $20 × 3 = $60/month

10 services = 10 Load Balancers
= $20 × 10 = $200/month

Cost grows linearly with services!
```

❌ **Complex DNS Management**
```
api.domain.com      → 20.1.1.1
app.domain.com      → 20.1.1.2
admin.domain.com    → 20.1.1.3

Need to manage:
├─ Multiple A records
├─ Multiple IP addresses
├─ Update each separately
└─ Complex to maintain
```

❌ **No Central SSL Management**
```
Each LoadBalancer needs:
├─ Own SSL certificate
├─ Own cert-manager setup
├─ Separate renewals
└─ More complexity
```

❌ **No Central Routing**
```
Can't do:
├─ Path-based routing (domain.com/api → service 1)
├─ Header-based routing
├─ Centralized auth
└─ Unified logging
```

### Scenario 3: Direct Pod Access

```yaml
# Exposing pods directly (DON'T DO THIS!)
apiVersion: v1
kind: Pod
metadata:
  name: backend
spec:
  hostNetwork: true  # ❌ Uses node's network
  containers:
  - name: backend
    ports:
    - containerPort: 3001
```

**Architecture:**
```
┌──────────────────────────────────────────────────┐
│  Internet                                        │
└────────┬─────────────────────────────────────────┘
         │
         │ Direct access to node!
         │
    ┌────▼────┐
    │ Node 1  │
    │ Port    │
    │ 3001    │
    │ exposed │
    └────┬────┘
         │
    ┌────▼────┐
    │ Pod     │
    │ Running │
    │ directly│
    │ on node │
    └─────────┘
```

**Problems:**

❌ **Major Security Risk**
```
- Pod has full node network access
- Can access other pods
- Can sniff network traffic
- Huge attack surface
- NOT RECOMMENDED!
```

❌ **Port Conflicts**
```
- Only one pod can use port 3001
- Can't scale
- Can't run multiple replicas
- Single point of failure
```

❌ **No Isolation**
```
- Pods can interfere with each other
- No network policies
- Hard to secure
- Debugging nightmare
```

---

## 🔗 Quan Hệ với Ingress Controller

### Complete Architecture

```
┌─────────────────────────────────────────────────────┐
│                    INTERNET                         │
│        Users from around the world                  │
└────────────────────┬────────────────────────────────┘
                     │
                     │ All traffic to
                     │ domain.com (20.212.123.45)
                     │
┌────────────────────▼────────────────────────────────┐
│         ☁️ AZURE LOAD BALANCER (Layer 4)            │
│  ┌────────────────────────────────────────────────┐ │
│  │  Role: Internet Gateway                        │ │
│  │  - Public IP: 20.212.123.45                    │ │
│  │  - Receives ALL external traffic               │ │
│  │  - Port 80 → Forward to nodes                  │ │
│  │  - Port 443 → Forward to nodes                 │ │
│  │  - Health check nodes                          │ │
│  │  - Distribute across healthy nodes             │ │
│  │  - TCP/UDP level (Layer 4)                     │ │
│  │  - Fast, simple, efficient                     │ │
│  └────────────────────────────────────────────────┘ │
└────────┬───────────────────────┬─────────────────────┘
         │                       │
         │ Distribute to         │ Distribute to
         │ healthy nodes         │ healthy nodes
         │                       │
    ┌────▼────┐             ┌────▼────┐
    │ Node 1  │             │ Node 2  │
    │ (VM)    │             │ (VM)    │
    │         │             │         │
    │ Port    │             │ Port    │
    │ 30080   │             │ 30080   │
    │ 30443   │             │ 30443   │
    └────┬────┘             └────┬────┘
         │                       │
         │ NodePort Service      │ NodePort Service
         │                       │
    ┌────▼──────────────┐   ┌────▼──────────────┐
    │ 🌐 INGRESS POD 1  │   │ 🌐 INGRESS POD 2  │
    │ (Layer 7)         │   │ (Layer 7)         │
    │ ┌───────────────┐ │   │ ┌───────────────┐ │
    │ │ Role: Router  │ │   │ │ Role: Router  │ │
    │ │ - SSL Term    │ │   │ │ - SSL Term    │ │
    │ │ - Host routing│ │   │ │ - Host routing│ │
    │ │ - Path routing│ │   │ │ - Path routing│ │
    │ │ - Load balance│ │   │ │ - Load balance│ │
    │ └───────────────┘ │   │ └───────────────┘ │
    └────┬──────────────┘   └────┬──────────────┘
         │                       │
         │ Forward to service    │ Forward to service
         │                       │
    ┌────▼────────┐         ┌────▼────────┐
    │ Backend Svc │         │ Frontend Svc│
    │ (ClusterIP) │         │ (ClusterIP) │
    └────┬────────┘         └────┬────────┘
         │                       │
    ┌────▼────┐             ┌────▼────┐
    │ Backend │             │ Frontend│
    │ Pods    │             │ Pods    │
    └─────────┘             └─────────┘
```

### Division of Responsibilities

| Component | Layer | Responsibilities |
|-----------|-------|------------------|
| **Azure Load Balancer** | Layer 4 | • Public IP<br>• Internet gateway<br>• TCP/UDP distribution<br>• Health checks<br>• Node-level routing |
| **Ingress Controller** | Layer 7 | • SSL/TLS termination<br>• HTTP routing<br>• Path-based routing<br>• Host-based routing<br>• Service-level routing |
| **Service** | Proxy | • Pod discovery<br>• Pod load balancing<br>• Internal networking |
| **Pods** | App | • Application logic<br>• Business logic |

### Why Both Are Needed?

**Azure LB Alone:**
```
✅ Can distribute traffic to nodes
❌ No HTTP/HTTPS understanding
❌ No path-based routing
❌ No SSL termination
❌ No advanced rules
❌ Only node-level distribution
```

**Ingress Alone:**
```
❌ No public IP
❌ No internet access
❌ Can't receive external traffic
❌ Needs something to forward traffic to it
```

**Both Together:**
```
✅ Azure LB: Internet → Cluster gateway
✅ Ingress: Intelligent routing inside cluster
✅ Complete solution
✅ Production-ready
```

### Traffic Flow Example

**User Request:**
```
User types: https://api.domain.com/users/123
```

**Step-by-Step:**

```
1️⃣ DNS Resolution
   api.domain.com → 20.212.123.45 (Azure LB Public IP)

2️⃣ User → Azure Load Balancer
   Source: User IP (1.2.3.4:54321)
   Dest: 20.212.123.45:443
   Protocol: TCP
   
3️⃣ Azure LB Processing
   ├─ Check: Port 443? ✅
   ├─ Health: Which nodes healthy?
   │  └─ Node 1: ✅ Healthy
   │  └─ Node 2: ✅ Healthy
   ├─ Algorithm: Hash(1.2.3.4) → Node 1
   └─ Forward: Node1:30443

4️⃣ Node 1 Receives Traffic
   ├─ NodePort Service listening on 30443
   ├─ iptables rules route to Ingress Pod
   └─ Forward: Ingress Pod:443

5️⃣ Ingress Controller Processing (Layer 7)
   ├─ Decrypt HTTPS (SSL termination)
   ├─ Read HTTP headers
   ├─ Host: api.domain.com ✅
   ├─ Path: /users/123 ✅
   ├─ Match Ingress rules
   ├─ Route to: backend-service:3001
   └─ Forward: http://backend-service:3001/users/123

6️⃣ Backend Service (ClusterIP)
   ├─ Discover backend pods
   ├─ Pod 1: 10.244.0.5:3001 ✅
   ├─ Pod 2: 10.244.0.6:3001 ✅
   ├─ Load balance (round robin)
   └─ Forward: Pod 1

7️⃣ Backend Pod Processes Request
   └─ Return: { users: [...] }

8️⃣ Response Flow (Reverse)
   Pod → Service → Ingress (encrypt) → Node → LB → User
```

---

## 🔧 Technical Deep Dive

### How Azure LB is Created

When you create a Service with `type: LoadBalancer`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  type: LoadBalancer  # ← This triggers Azure LB creation
  ports:
  - port: 80
    targetPort: 80
  - port: 443
    targetPort: 443
```

**What Happens Behind the Scenes:**

```
1️⃣ Kubernetes API receives Service creation
   └─ Type: LoadBalancer detected

2️⃣ Cloud Controller Manager (Azure)
   ├─ Detects LoadBalancer service
   ├─ Calls Azure ARM API
   └─ Request: Create Load Balancer

3️⃣ Azure Creates Resources
   ├─ Public IP address (static)
   ├─ Load Balancer instance
   ├─ Backend pool (AKS nodes)
   ├─ Health probes
   ├─ Load balancing rules
   └─ NAT rules

4️⃣ Azure Configures Load Balancer
   ├─ Frontend IP: Public IP
   ├─ Backend pool: Add all nodes
   ├─ Rules: Port 80 → NodePort
   ├─ Rules: Port 443 → NodePort
   └─ Probes: Check node health

5️⃣ Update Service Status
   └─ External IP: 20.212.123.45

Process takes: 2-5 minutes
```

### Azure LB Configuration

**Generated Configuration:**
```json
{
  "loadBalancer": {
    "name": "kubernetes",
    "location": "southeastasia",
    "sku": "Standard",
    "properties": {
      "frontendIPConfigurations": [{
        "name": "ingress-nginx-controller",
        "properties": {
          "publicIPAddress": {
            "id": "/subscriptions/.../publicIPAddresses/xxx"
          }
        }
      }],
      "backendAddressPools": [{
        "name": "aks-nodepool",
        "properties": {
          "backendIPConfigurations": [
            { "id": "node1-nic" },
            { "id": "node2-nic" }
          ]
        }
      }],
      "loadBalancingRules": [
        {
          "name": "http",
          "properties": {
            "frontendPort": 80,
            "backendPort": 30080,
            "protocol": "Tcp",
            "enableFloatingIP": false,
            "idleTimeoutInMinutes": 4,
            "loadDistribution": "Default"
          }
        },
        {
          "name": "https",
          "properties": {
            "frontendPort": 443,
            "backendPort": 30443,
            "protocol": "Tcp"
          }
        }
      ],
      "probes": [{
        "name": "health-probe",
        "properties": {
          "protocol": "Http",
          "port": 10254,
          "requestPath": "/healthz",
          "intervalInSeconds": 15,
          "numberOfProbes": 2
        }
      }]
    }
  }
}
```

### Monitoring Azure LB

```bash
# View load balancer
az network lb list --resource-group MC_mindx-onboarding-rg_* --output table

# View frontend IPs
az network lb frontend-ip list --lb-name kubernetes --resource-group MC_* --output table

# View backend pool
az network lb address-pool list --lb-name kubernetes --resource-group MC_* --output table

# View rules
az network lb rule list --lb-name kubernetes --resource-group MC_* --output table

# View probes
az network lb probe list --lb-name kubernetes --resource-group MC_* --output table

# View metrics
az monitor metrics list --resource <lb-resource-id> --metric-names "ByteCount" "PacketCount"
```

---

## 💰 Cost Breakdown

### Azure Load Balancer Pricing

**Standard Load Balancer:**
```
Base cost: ~$18-25/month (region dependent)

Includes:
✅ Unlimited rules
✅ Unlimited backend instances
✅ 99.99% SLA
✅ Zone redundancy
✅ Metrics and diagnostics

Data processing: ~$0.005 per GB

Example monthly cost:
├─ Base: $20
├─ Data (100GB): $0.50
└─ Total: ~$20.50/month
```

**Cost Comparison:**

| Scenario | Monthly Cost | Notes |
|----------|--------------|-------|
| 1 Service + 1 LB | $20 | ✅ Good |
| 5 Services + 1 LB + Ingress | $20 | ✅ Great! |
| 5 Services + 5 LBs (no Ingress) | $100 | ❌ Expensive |
| NodePort (no LB) | $0 | ❌ Not production-ready |

**Cost Savings with Ingress:**
```
Without Ingress:
├─ Backend LB: $20
├─ Frontend LB: $20
├─ Admin LB: $20
├─ API v2 LB: $20
├─ WebSocket LB: $20
└─ Total: $100/month

With Ingress:
├─ 1 LB: $20
├─ All services behind it
└─ Total: $20/month

Savings: $80/month (80%!)
```

---

## 📊 Summary

### Azure Load Balancer Does:

✅ **Provides Public IP**
- Single entry point
- Static, stable IP
- Easy DNS management

✅ **Distributes Traffic**
- Across healthy nodes
- Hash-based algorithm
- Session persistence

✅ **Health Checking**
- Continuous monitoring
- Automatic failover
- Self-healing

✅ **High Availability**
- 99.99% SLA
- Zone redundant
- No single point of failure

✅ **Port Forwarding**
- Standard ports (80, 443)
- To NodePorts
- Transparent to users

### Without Load Balancer:

❌ No single entry point  
❌ No automatic failover  
❌ No health checking  
❌ Complex DNS management  
❌ Non-standard ports  
❌ Security concerns  
❌ Not production-ready  

### Relationship with Ingress:

```
Azure LB: Internet gateway (Layer 4)
Ingress: Smart router (Layer 7)

Both needed for:
✅ Production-ready setup
✅ Cost-effective architecture
✅ Advanced routing
✅ SSL/TLS termination
```

---

**Related Guides:**
- [Ingress Controller Guide](INGRESS-GUIDE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Troubleshooting](TROUBLESHOOTING.md)

