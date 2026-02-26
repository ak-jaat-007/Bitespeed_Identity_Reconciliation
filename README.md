# 📝 Identity Reconciliation Service

A backend service built for the Bitespeed technical challenge to consolidate user identities across different contact points.

## 🔗 Live Endpoint
**URL:** [Live API Endpoint](https://bitespeed-identity-reconciliation-4lj3.onrender.com/identify)

## 🛠️ Tech Stack
- **Node.js & TypeScript** 🚀 (v22+)
- **Express.js** 🌐 (Web Framework)
- **Prisma 7** 💎 (ORM)
- **PostgreSQL** 🐘 (Database hosted on Neon.tech)
- **Execution:** tsx

## 📋 Logic Overview
The service handles identity reconciliation as follows:
- **New Contact:** ✨ If neither email nor phone exists, a new `primary` record is created.
- **Identity Linking:** 🔗 If the email or phone matches an existing contact, a new `secondary` record is created and linked to the primary.
- **Primary Merge:** 🔄 If a request contains an email and phone that belong to two different primary contacts, the newer primary contact (and all its secondaries) are merged into the older primary contact.

## 🚀 How to Run Locally

1. **Clone the repository:**
```bash
git clone https://github.com/ak-jaat-007/Bitespeed_Identity_Reconciliation
cd bitespeed-identity-reconciliation
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure Environment Variables:**
Create a `.env` file in the root directory:
```env
DATABASE_URL="your_postgresql_connection_string"
PORT=3000
```

4. **Sync Database Schema:**
```bash
npx prisma db push
npx prisma generate
```

5. **Start the Server:**
```bash
npm start
```

## 🧪 Sample Request & Response

### POST /identify

**Payload (JSON Body):**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Success Response (200 OK):**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

---

**Author:** Aman Kaliramna ✍️  
**Project:** Bitespeed Identity Reconciliation Task
