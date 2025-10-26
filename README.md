# 🚀 Facebook AutoPost Dashboard

Automate Facebook Marketplace and Page posting with intelligent scheduling, multi-image uploads, and complete post management.



## � Facebook Setup (Required)

### 1. Create Facebook App
1. Go to [developers.facebook.com](https://developers.facebook.com/) → **Create App** → Select **Business**
2. Fill in app details and create

### 2. Get Credentials
In your app dashboard:
- **Settings → Basic:** Copy `App ID` and `App Secret`
- **Graph API Explorer:** 
  - Select your app
  - Click **Generate Access Token**
  - Select permissions: `pages_manage_posts`, `pages_read_engagement`
  - Copy `Page Access Token`
- Get your **Page ID** from Facebook page settings

## 🚀 Quick Start with Docker

### 1. Clone & Configure
```bash
git clone <your-repo-url>
cd Autopost
cp .env.example .env
```

### 2. Edit `.env` with Your Facebook Credentials
```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_PAGE_ID=your_page_id
FACEBOOK_PAGE_TOKEN=your_page_access_token
FACEBOOK_PAGE_NAME=Your Page Name
SECRET_KEY=your-random-secret-key-here
```

### 3. Start Everything
```bash
docker-compose up -d
```

### 4. Access Dashboard
Open **http://localhost:3000** in your browser

**That's it!** 🎉 Your dashboard is ready to use.

> **Note:** MongoDB database and collections are **automatically created** when the app first starts. No manual database setup required!

## � Manual Installation (Without Docker)

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB 6.0+

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Create .env in root folder (if not exists)
cd ..
cp .env.example .env
# Edit .env with your Facebook credentials
cd backend
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

**Note:** Both backend and frontend read from the same `.env` file in the root folder.

## 📖 Usage

1. **Create Post:** Click "Create New Post" → Add details, images, and pricing → Post or save as draft
2. **Schedule Posts:** Select a post → "Schedule" → Choose date/time and platform → Confirm
3. **Manage Posts:** View all posts with filters, edit, delete, or track status in real-time
4. **Dark Mode:** Toggle theme from navbar

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose up -d --build

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

## 🔧 Troubleshooting

**Backend won't start:**
- Verify Facebook credentials in `.env`
- Check MongoDB is running: `docker ps`

**Posts not appearing on Facebook:**
- Verify Page Access Token is valid (tokens expire)
- Regenerate token from Graph API Explorer
- Check app permissions include `pages_manage_posts`

**Docker issues:**
- Restart services: `docker-compose restart`
- View logs: `docker-compose logs -f backend` or `frontend`
- Reset everything: `docker-compose down -v && docker-compose up -d`
