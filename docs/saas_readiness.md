# Coastal Guardian - SaaS Readiness Integration Plan

This document outlines the architectural blueprints, implementation guidelines, and recommendations for transforming **Coastal Guardian** (CTAS) into a multi-tenant Commercial Software-as-a-Service (SaaS) platform.

---

## 1. Multi-Tenancy Architecture

To serve multiple organizations (e.g., municipalities, research institutes, enterprise port authorities) securely, we propose a hybrid database multi-tenancy model.

### Option A: Shared Database, Logical Isolation (Recommended for standard SaaS tier)
- **Concept**: A single MongoDB database. All models (`User`, `Questionnaire`, `CommunityReport`, `ThreatReport`) contain a `tenantId` field.
- **Access Control**: Database queries are filtered at the middleware layer using `tenantId` extracted from the authenticated user token (JWT).
- **Pros**: Low infrastructure overhead, simple global migrations.
- **Cons**: Potential "noisy neighbor" resource contention; strict security audits required to prevent cross-tenant data leaks.

### Option B: Database-Per-Tenant (Recommended for Enterprise/Government customers)
- **Concept**: Dynamic connection pooling. Based on the domain name (e.g., `mumbai.coastalguardian.com`) or authentication context, the Express backend opens a connection to a specific database name (e.g., `cg_tenant_mumbai`).
- **Implementation**:
  ```javascript
  const tenantConnections = {};

  const getTenantDbConnection = (tenantId) => {
    if (tenantConnections[tenantId]) return tenantConnections[tenantId];
    
    const dbUri = `${process.env.MONGODB_BASE_URI}/${tenantId}`;
    const conn = mongoose.createConnection(dbUri, { useNewUrlParser: true });
    tenantConnections[tenantId] = conn;
    return conn;
  };
  ```
- **Pros**: Complete data isolation (meets strict compliance requirements for public agencies).
- **Cons**: High maintenance overhead for database schema upgrades.

---

## 2. Subscription Billing & Tiering

We recommend integrating **Stripe** for handling multi-tier subscriptions and usage-based billing.

### Tier Structure
| Tier | Pricing | Core Features | Limits |
| :--- | :--- | :--- | :--- |
| **Community (Free)** | $0 / mo | Basic Dashboard, Public Alerts, Local Chatbot | 1 Active Region, 10 AI queries/mo |
| **Professional** | $149 / mo | Advanced Currents & Satellite Maps, PDF exports, SMS Notifications | 5 Active Regions, 500 AI queries/mo |
| **Enterprise / Gov** | Custom | Custom Mapbox overlays, isolated DBs, SLA, unlimited SMS, 24/7 priority support | Unlimited |

### Stripe Integration Workflow
1. **Webhooks**: Configure Stripe Webhook endpoints (e.g. `/api/billing/webhook`) to handle event notifications such as `customer.subscription.created`, `invoice.payment_succeeded`, and `customer.subscription.deleted`.
2. **Entitlements Middleware**:
   ```javascript
   const requireFeature = (featureName) => {
     return (req, res, next) => {
       const userPlan = req.user.subscriptionPlan; // e.g. 'free', 'pro', 'enterprise'
       const planFeatures = {
         free: ['dashboard', 'chatbot_limited'],
         pro: ['dashboard', 'satellite_advanced', 'chatbot_unlimited', 'questionnaire_history_pdf'],
         enterprise: ['dashboard', 'satellite_advanced', 'chatbot_unlimited', 'questionnaire_history_pdf', 'custom_mapbox']
       };

       if (planFeatures[userPlan]?.includes(featureName)) {
         return next();
       }
       return res.status(403).json({ error: 'Feature requires subscription upgrade' });
     };
   };
   ```

---

## 3. API Rate Limiting & Abuse Prevention

To protect the Express and Python AI endpoints (especially Gemini/OpenAI token budgets), rate limiting must be enforced.

- **Standard Limits**: Use `express-rate-limit` for Express endpoints:
  - Global API: 100 requests per 15 minutes.
  - Chatbot/Questionnaire (LLM actions): 10 requests per minute (to control API costs).
- **Tenant Quota Tracking**: Save active monthly API consumption on the Tenant/Organization record. Block or charge overages if AI token usage exceeds the billing threshold.

---

## 4. Audit Logs & Role-Based Access Control (RBAC)

Enterprise tenants require detailed activity trails and specific permission levels.

### Proposed User Roles
- **System Admin**: Platform-wide settings, global subscription logs, billing.
- **Tenant Admin**: Manage team members within the municipality/port, setup notification lists, configure custom Mapbox tokens.
- **Operator**: Submit community reports, review live currents, analyze analytics, configure alerts.
- **Viewer**: Read-only access to maps and dashboards.

### Audit Log Schema
Save actions like changing alert threshold configurations, downloading reports, and triggering emergency broadcasts in an audit log model:
```javascript
const AuditLogSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // 'ALERT_THRESHOLD_MODIFIED', 'EXPORT_PDF'
  ipAddress: String,
  details: mongoose.Schema.Types.Mixed
}, { timestamps: true });
```
