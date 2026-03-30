# Hosting Guide: Run Your PWA as a Web Application

This project is a **Progressive Web App (PWA)** built with HTML, CSS, and JavaScript. It includes a `manifest.json` for installability and works offline via service workers (if implemented in `script.js`). No build step or server is required – it's fully static.

You can host it **for free** and run as a web app (installable on desktop/mobile). Here are the easiest, tested methods:

## 1. **Netlify (Recommended: 1-click deploy, auto-HTTPS, custom domain)**
   - **Free tier**: Unlimited sites, 100GB bandwidth/month.
   1. Go to [netlify.com](https://netlify.com) → Sign up (GitHub/Google).
   2. Drag & drop the entire folder (`New folder (2)`) onto the deploy dropzone.
   3. Netlify auto-deploys! Get URL like `https://amazing-app-123.netlify.app`.
   4. **Install as app**: Visit URL → Click install icon in browser (Chrome/Edge/Safari).
   5. **Custom domain** (optional): In Netlify dashboard → Domain settings.

## 2. **Vercel (Great for speed, CLI option)**
   - **Free tier**: Unlimited sites, generous limits.
   1. Go to [vercel.com](https://vercel.com) → Sign up (GitHub/Google).
   2. Connect GitHub → Import this folder as new repo (or drag folder).
   3. Deploy instantly! URL like `https://your-app-abc.vercel.app`.
   4. Install as PWA from browser.

## 3. **GitHub Pages (If you use GitHub)**
   1. Create GitHub repo → Upload all files (including `assets/` and `data/`).
   2. Settings → Pages → Source: Deploy from `main` branch → `/ (root)`.
   3. Live at `https://yourusername.github.io/repo-name`.
   4. Enable PWA install via browser.

## 4. **Local Testing (Run instantly without hosting)**
   - **Live Server (VSCode extension)**:
     1. Install 'Live Server' extension.
     2. Right-click `index.html` → 'Open with Live Server'.
     3. Opens at `http://127.0.0.1:5500` → Test PWA install.
   - **Python server** (if Python installed):
     ```
     cd "c:/Users/jaspr/OneDrive/Desktop/New folder (2)"
     python -m http.server 8000
     ```
     Visit `http://localhost:8000`.

## 5. **Production Checklist**
   - [ ] Ensure `manifest.json` has correct `start_url: '/'` and icons.
   - [ ] Test offline: Use DevTools → Application → Service Worker → Offline.
   - [ ] HTTPS required for PWA install (all hosts above provide it).
   - **Supabase Integration** (if used): Update API URLs in `script.js` to your Supabase project URL (no changes needed for hosting).

## Troubleshooting
- PWA not installing? Check Lighthouse audit in Chrome DevTools (Aims for 100% PWA score).
- Assets missing? Verify `assets/` folder uploaded.
- Custom port/domain? All platforms support it free.

Your app is now live and runnable as a native-like application! 🚀

**Need help?** Run `npm install -g serve` then `serve .` for quick local HTTPS server.

