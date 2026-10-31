# Gicomm

> **Discover. Trade. Grow.**

**Vision**  
To build a trusted and accessible digital commerce platform that connects people with valuable digital products and empowers creators and customers to participate in a better digital economy.

**Our Identity**  
Gicomm is a digital commerce platform. Its core purpose is to help people discover, buy, sell, and manage digital products. Our direction remains grounded in digital trade while our methods, technology, and capabilities evolve with user needs, responsible innovation, and changes in the global digital economy.

**Our Slogan**  
**Discover. Trade. Grow.**

- **Discover** — make useful digital products easier to find and evaluate.
- **Trade** — enable reliable, transparent, and secure digital transactions.
- **Grow** — help creators improve their products and help customers get lasting value.

**Development Principles**
1. Security and user trust before scale.
2. Reliable commerce before feature expansion.
3. Evidence-led decisions instead of trend chasing.
4. Privacy, transparency, and responsible data use by design.
5. Sustainable development within the project's real resources.

Gicomm may adopt technologies such as AI, automation, and advanced discovery when they measurably improve digital commerce. These technologies support the mission; they do not replace it.

---

A digital marketplace prototype built with HTML, CSS, and vanilla JavaScript. The current repository is an early frontend implementation, not a production-ready commerce service. See the status and roadmap below for the capabilities that are implemented versus planned.

---

## 🚀 Quick Start

### Prerequisites
- No build tools required! Pure vanilla JavaScript (ES modules).
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3 or Node.js (for local development server)

### Setup & Run Locally

```bash
# 1. Navigate to project directory
cd Gicomm_Marketplace_Final

# 2. Start a local development server
python -m http.server 8000
# or
py -m http.server 8000
# or with npm
npx http-server

# 3. Open in browser
# http://localhost:8000
```

---

## 📁 Project Structure

```
Gicomm_Marketplace_Final/
├── index.html              # Marketplace homepage with product grid
├── login.html              # Authentication (demo mode)
├── dashboard.html          # User dashboard with 6 dynamic tabs
├── css/
│   └── style.css           # Main stylesheet (Times New Roman + Helvetica)
├── js/
│   ├── components/
│   │   ├── storage.js      # Local UI preferences and demo cart helpers
│   │   └── ui.js           # Shared UI (theme, toast notifications)
│   ├── data/
│   │   └── products.js     # Demo catalog (not yet database-backed)
│   ├── lib/
│   │   ├── supabase.js     # Pinned Supabase browser client
│   │   └── auth.js         # Session, profile, and auth guards
│   └── pages/
│       ├── auth.js         # Supabase email authentication
│       ├── marketplace.js  # Search, filters, demo cart
│       └── dashboard.js    # Authenticated account dashboard
├── config/
│   ├── supabase.js         # Public project URL and publishable key
│   └── supabase.example.js # Safe configuration template
├── docs/
│   └── backend-implementation.md # Backend architecture and phased plan
├── README.md               # Project documentation
└── vercel.json            # Vercel deployment config
```

---

## ✨ Features

### 🏪 Marketplace
- **Product Discovery**: Browse and search digital products
- **Real-time Search**: Instant filtering by keywords
- **Shopping Cart**: Add/remove items, track cart status
- **Wishlist**: Save products for later
- **Product Details**: Modal with full product information
- **Smart Filtering**: Category, price range, format, rating filters

### 👤 User Dashboard  
Six dashboard sections; data-backed features are being connected in phases:
- **Overview** - Recent activity log
- **My Library** - placeholder until purchase entitlements are implemented
- **Saved** - will use the persistent saved_products table
- **Orders** - unavailable until the order lifecycle is implementedus tracking
- **Selling** - 3 creator products with sales metrics
- **Settings** - Account preferences and notification toggles

Additional features:
- Profile panel with user info and completion status
- Statistics dashboard showing account metrics
- Full-width expanded layout (not centered)
- Sticky navigation sidebar

### 🎨 Design System
- **Typography**: Times New Roman (headings) + Helvetica (body)
- **Theme**: Dark/light mode with persistent localStorage
- **Responsive**: Desktop, tablet, and mobile support
- **Glassmorphism**: Transparent surfaces with blur effects
- **Accessibility**: Semantic HTML, ARIA labels, high contrast

### 🔐 Authentication (Demo)
- Email/password login flow
- Social auth buttons (Google, GitHub)
- Demo user session management
- Logout functionality
- localStorage-based persistence

---

## 🎨 Customization

### Change Theme Colors

Edit CSS variables in `css/style.css`:

```css
:root {
  --bg: #f5f5f2;              /* Light background */
  --surface: rgba(255,255,255,.7);
  --text: #151515;
  --accent: #111111;
  /* ... more variables */
}

body.dark {
  --bg: #0e0e0d;              /* Dark background */
  /* ... dark theme variables */
}
```

### Update Fonts

Change `font-family` in `css/style.css`:

```css
body {
  font: 14px/1.6 Helvetica, system-ui, sans-serif;
}

h1, h2, h3 {
  font-family: "Times New Roman", Times, serif;
}
```

---

## 💾 Data & Storage

### Local Storage Keys
All data currently stored in browser localStorage:

```javascript
{
  "gicomm-cart": [{ id, name, price }, ...],
  "gicomm-saved": [productId, ...],
  "gicomm-theme": "light" | "dark",
  "gicomm-demo-user": "email@example.com"
}
```

**Note**: These keys are designed for easy migration to Supabase backend.

---

## 🔌 Supabase Integration (Planned — Not Yet Connected)

Supabase is **not yet connected**. The file `config/supabase.example.js` is a planning template only; real authentication, database access, storage policies, and Row Level Security still need to be implemented and tested.

### Quick Setup

1. **Create Supabase Project**
   - Go to https://app.supabase.com
   - Create new project
   - Save Project URL and API Key

2. **Install Client**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Add Credentials**
   ```bash
   cp config/supabase.example.js config/supabase.js
   # Edit config/supabase.js with your credentials
   ```

4. **Update Code**
   - Modify `js/components/storage.js` to use Supabase client
   - Replace localStorage calls with Supabase API
   - Enable auth providers in Supabase dashboard

### Required Database Tables

See `config/supabase.example.js` for full schema. Key tables:

- **profiles** - User accounts and profiles
- **products** - Digital product listings
- **reviews** - Product ratings and comments
- **orders** - Purchase history and transactions
- **saved_products** - Wishlist items

### Authentication Providers

Supported (after Supabase setup):
- Email/Password
- Google OAuth
- GitHub OAuth
- Magic Links
- Phone Authentication

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "Gicomm marketplace v1.1"
git push

# 2. On Vercel dashboard:
# - Click "New Project"
# - Import from GitHub repository
# - Auto-detected as static site
# - Click "Deploy"

# 3. Custom domain (optional)
# - Add domain in Vercel settings
```

### Deploy to Netlify

```bash
# 1. Connect GitHub repository to Netlify
# 2. Site auto-deploys on every push
# 3. Access via: netlify.app or custom domain
```

### Deploy to GitHub Pages

```bash
# 1. Repository settings → Pages
# 2. Select: main branch / root folder
# 3. Site: https://username.github.io/gicomm
```

---

## 🐛 Latest Updates (v1.1)

✅ **Fixed** theme toggle icon updating visibly on mode switch  
✅ **Enhanced** search functionality with edge case handling  
✅ **Expanded** dashboard layout to full width (not centered)  
✅ **Added** dynamic tab content (unique features per tab)  
✅ **Updated** font system (Times New Roman + Helvetica)  
✅ **Improved** overall UI friendliness and accessibility  
✅ **Prepared** Supabase integration structure with examples  
✅ **Updated** README with comprehensive documentation  

### Known Limitations (Demo)

- Email/password authentication is connected to Supabase Auth; live browser verification is still pending
- Marketplace catalog and cart are still demo/frontend data
- Wishlist UI is not yet connected to the existing saved_products table
- Product upload and private download flows are not yet wired to Supabase Storage
- Seller product workflows and admin moderation UI are not yet connected
- Orders, checkout, and payment processing are intentionally not implemented
- Google/GitHub OAuth providers are not enabled in the UI until provider configuration is verified

---

## 📊 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest 2 versions | ✅ Full Support |
| Firefox | Latest 2 versions | ✅ Full Support |
| Safari | Latest 2 versions | ✅ Full Support |
| Edge | Latest 2 versions | ✅ Full Support |
| Mobile | iOS Safari, Chrome | ✅ Full Support |

---

## 📚 Technology Stack

### Frontend (Current)
- **HTML5 / CSS3** - Static pages and responsive UI
- **Vanilla JavaScript** - Native ES Modules; no framework or build step
- **Supabase JS 2.118.0** - Version-pinned browser SDK loaded as an ES module
- **Supabase Auth** - Email/password registration, sign-in, and password recovery
- **PostgreSQL + RLS** - Database and row-level access controls
- **Supabase Storage** - Private asset/file buckets are provisioned; frontend integration is pending

### Hybrid Backend
- **Supabase Data API** - Direct client data access only where RLS and grants allow it
- **Supabase Edge Functions** - Reserved for trusted business logic; none are deployed yet
- **Server-side secrets** - Must never be included in browser codereSQL** - Reliable data persistence
- **Authentication** - Multiple provider support
- **Storage** - File hosting and CDN

### Deployment
- **Vercel** / **Netlify** / **GitHub Pages** - Static hosting
- **CDN** - Global content delivery
- **Automatic HTTPS** - Secure by default

---

## 🎯 Marketplace Categories

Currently supported product types:

- **Design** - UI kits, icon packs, illustrations, templates, design systems
- **Development** - Source code, website templates, components, libraries
- **Productivity** - Notion templates, spreadsheets, planners, systems
- **3D** - Models, textures, materials, Blender assets
- **Education** - E-books, courses, study materials, practice resources
- **Creative** - Presets, audio files, video templates, photography resources

---

## 📈 Roadmap

### Phase 1: Foundation ✅
- [x] Marketplace MVP
- [x] Theme system (dark/light)
- [x] Dashboard with tabs
- [x] Search & filtering
- [x] Responsive design

### Phase 2: Hybrid Backend Integration 🔄
- [x] Supabase project and database foundation (migrations 001–007)
- [x] Supabase browser client and email/password Auth implementation
- [x] Authenticated dashboard guard and real account identity
- [ ] Verify sign-up, confirmation, sign-in, recovery, and sign-out in a live browser
- [ ] Connect public product catalog and taxonomy to PostgreSQL
- [ ] Connect persistent wishlist to saved_products

### Phase 3: Seller and Asset Workflows
- [ ] Seller product CRUD and moderation submission
- [ ] Product revision review workflow
- [ ] Private Storage upload and signed download flows
- [ ] File-content validation and malware-scanning strategy

### Phase 4: Marketplace Business Logic
- [ ] Persistent cart design and validation
- [ ] Order lifecycle and entitlement records
- [ ] Admin operations and audit trail
- [ ] Payment gateway remains deferred until order flows are verified

### Phase 5: Production Hardening
- [ ] End-to-end authorization and RLS tests
- [ ] Rate limiting, abuse controls, and observability
- [ ] Performance and failure-recovery tests
- [ ] Deployment and rollback verification

---

## 🔒 Security

### Current Implementation
- Browser uses only the Supabase publishable key; no service-role or secret key is shipped
- Authenticated dashboard verifies the user through Supabase Auth
- Profile reads are constrained by database RLS
- Product catalog, cart, seller operations, and order data are not yet database-backed
- Supabase Edge Functions are not deployed yet
- Database Security Advisor currently reports no lints; this is not a substitute for end-to-end application testing

---

## 💡 Development Tips

### Adding a New Page
1. Create `pages/newpage.html`
2. Create `js/pages/newpage.js` (if needed)
3. Add route to `vercel.json`
4. Link from navigation menu

### Adding Products
1. Edit `js/data/products.js`
2. Add object to PRODUCTS array
3. Products display automatically

### Debugging
- Open DevTools (F12)
- Check Console for errors
- Check Network tab for requests
- Check localStorage in Application tab

### Testing
- Test in light and dark themes
- Verify responsive at: 900px, 620px
- Check mobile on real device
- Verify search functionality
- Test cart and wishlist

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📄 License

This project is open for educational and personal use. See LICENSE file for details.

---

## 👤 Author

**Khairul Azhar** (Zarr)
- GitHub: [@Zarr-Dev](https://github.com/Zarr-Dev)
- Website: [zarr.dev](https://zarr.dev)
- Email: hi@zarr.dev

---

## ❓ Frequently Asked Questions

**Q: Is this production-ready?**  
A: Frontend is production-ready. Backend needs Supabase integration for payments and real auth.

**Q: Can I customize colors and fonts?**  
A: Yes! Edit `css/style.css` CSS variables for easy customization.

**Q: How do I add real authentication?**  
A: Follow the setup guide in `config/supabase.example.js`.

**Q: Can I use this with React/Vue/Angular?**  
A: Yes, but you'd need to rewrite. Currently optimized for vanilla JS.

**Q: How many products can the marketplace handle?**  
A: Demo handles ~100. For thousands, add Supabase and implement pagination.

**Q: Is there a mobile app?**  
A: Not yet. The web app is fully responsive for mobile browsers.

---

## 📞 Support & Contact

For questions, suggestions, or issues:
- Open an issue on GitHub
- Check existing documentation
- Review code comments

---

**Last Updated**: August 2026  
**Current Version**: 1.1  
**Status**: Active Development  
**Next Phase**: Supabase Backend Integration

---

Made with ❤️ by Zarr Dev
