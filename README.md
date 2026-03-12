# 📚 EduNote — Educational Notes Platform

A production-ready platform where students can access educational notes for free. Built with Node.js, Express, EJS, and MySQL.

---

## 🗂️ Project Structure

```
edunote/
├── config/
│   └── database.js          # MySQL connection pool
├── controllers/
│   ├── authController.js    # Admin login/logout
│   ├── dashboardController.js
│   ├── publicController.js  # Public pages
│   ├── sectorController.js  # CRUD sectors
│   └── noteController.js    # CRUD notes
├── middleware/
│   ├── auth.js              # Session auth guards
│   └── upload.js            # Multer file upload config
├── models/
│   ├── Admin.js
│   ├── Sector.js
│   └── Note.js
├── public/
│   ├── css/
│   │   ├── public.css       # Public site styles
│   │   └── admin.css        # Admin panel styles
│   └── js/
│       ├── public.js
│       └── admin.js
├── routes/
│   ├── public.js            # Public routes
│   └── admin.js             # Admin routes (protected)
├── uploads/                 # Uploaded note files
├── views/
│   ├── layouts/
│   │   ├── public.ejs
│   │   ├── admin.ejs
│   │   └── admin-auth.ejs
│   ├── public/
│   │   ├── index.ejs
│   │   ├── sectors.ejs
│   │   ├── notes.ejs
│   │   └── error.ejs
│   └── admin/
│       ├── login.ejs
│       ├── dashboard.ejs
│       ├── settings.ejs
│       ├── sectors/
│       │   ├── index.ejs
│       │   ├── create.ejs
│       │   └── edit.ejs
│       └── notes/
│           ├── index.ejs
│           ├── create.ejs
│           └── edit.ejs
├── .env.example
├── .gitignore
├── database.sql             # MySQL schema + sample data
├── seed.js                  # Admin account seeder
├── server.js                # Entry point
└── package.json
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### Steps

**1. Clone / extract the project**
```bash
cd edunote
```

**2. Install dependencies**
```bash
npm install
```

**3. Create MySQL database and tables**
```bash
mysql -u root -p < database.sql
```

**4. Configure environment**
```bash
cp .env.example .env
```
Edit `.env`:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=edunote
SESSION_SECRET=change_this_to_a_long_random_string
ADMIN_EMAIL=admin@edunote.com
ADMIN_PASSWORD=Admin@123
```

**5. Seed the admin account**
```bash
node seed.js
```

**6. Start the server**
```bash
npm start
# or for development with auto-reload:
npm run dev
```

**7. Open in browser**
- 🌐 Public site: http://localhost:3000
- 🔐 Admin panel: http://localhost:3000/admin/login
- Default credentials: `admin@edunote.com` / `Admin@123`

> ⚠️ **Change the default password immediately after first login!**

---

## 🌍 Deployment Guide

### Option A: VPS / Ubuntu Server (Recommended)

**1. Install Node.js and MySQL**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs mysql-server
```

**2. Upload project to server**
```bash
scp -r ./edunote user@your-server:/var/www/
```

**3. Set up MySQL on server**
```bash
sudo mysql_secure_installation
mysql -u root -p < /var/www/edunote/database.sql
```

**4. Install PM2 (process manager)**
```bash
sudo npm install -g pm2
```

**5. Configure .env for production**
```bash
cd /var/www/edunote
cp .env.example .env
nano .env
# Set NODE_ENV=production, strong SESSION_SECRET, DB credentials
```

**6. Install dependencies and seed**
```bash
npm install --production
node seed.js
```

**7. Start with PM2**
```bash
pm2 start server.js --name "edunote"
pm2 save
pm2 startup
```

**8. Set up Nginx reverse proxy**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**9. Enable HTTPS with Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

### Option B: Railway / Render / Fly.io (Cloud)

1. Push project to GitHub
2. Connect your GitHub repo to the cloud platform
3. Add a MySQL plugin/addon
4. Set environment variables in the platform dashboard
5. Deploy

---

### Option C: Shared Hosting (cPanel with Node.js support)

1. Upload files via FTP
2. Create a MySQL database in cPanel
3. Import `database.sql`
4. Set environment variables in cPanel's Node.js app manager
5. Run `npm install` via SSH
6. Set the entry point to `server.js`

---

## 🔒 Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- Session cookies are httpOnly and secure in production
- File uploads are validated by MIME type and extension
- Admin routes are protected by session middleware
- SQL queries use parameterized statements (MySQL2)
- Only one admin account is supported by design

---

## 📋 Features Summary

| Feature | Public | Admin |
|---------|--------|-------|
| View homepage | ✅ | ✅ |
| Browse sectors | ✅ | ✅ |
| View notes in sector | ✅ | ✅ |
| Download/view notes | ✅ | ✅ |
| Login/logout | ❌ | ✅ |
| Create/edit/delete sectors | ❌ | ✅ |
| Upload/edit/delete notes | ❌ | ✅ |
| View download stats | ❌ | ✅ |
| Update profile & password | ❌ | ✅ |

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: EJS templating + CSS3 + Vanilla JS
- **Database**: MySQL (mysql2 driver)
- **Auth**: express-session + bcryptjs
- **File Upload**: multer
- **Flash messages**: connect-flash
