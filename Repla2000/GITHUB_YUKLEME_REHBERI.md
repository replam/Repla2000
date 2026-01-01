# GitHub Pages Dağıtım Rehberi 🚀

Uygulamanı arkadaşlarına göndermek için GitHub Pages harika bir çözüm. Hosting tamamen ücretsizdir.

## Adım 1: GitHub Hesabı ve Repo
1. [GitHub.com](https://github.com)'a gir ve giriş yap.
2. Sağ üst köşedeki **+** ikonuna basıp **New repository** seç.
3. Repository name kısmına `voice-analysis-app` gibi bir isim ver.
4. **Public** seçeneğinin işaretli olduğundan emin ol (Ücretsiz Pages için şart).
5. **Create repository** butonuna bas.

## Adım 2: Dosyaları Yükleme
*(Eğer Git kullanmayı biliyorsan terminalden pushlayabilirsin. Bilmiyorsan bu kolay yöntem:)*

1. Oluşturduğun repo sayfasında **"uploading an existing file"** linkine tıkla.
2. Bilgisayarındaki proje klasörünün içindeki şu dosyaları sürükleyip bırak:
   - `index.html`
   - `style.css`
   - `app.js`
   - `audio-engine.js`
   - `visualizer.js`
3. Aşağıdaki "Commit changes" butonuna bas.

## Adım 3: Sitemi Yayınla (Pages)
1. Reponun üst menüsünden **Settings** sekmesine tıkla.
2. Sol menüden **Pages** kısmını bul ve tıkla.
3. **Build and deployment** başlığı altında:
   - **Source:** `Deploy from a branch` seç.
   - **Branch:** `main` (veya `master`) seç ve yanındaki kutuyu `/ (root)` bırak.
   - **Save** butonuna bas.

## Adım 4: Linki Paylaş
1. Sayfayı 1-2 dakika sonra yenile.
2. En üstte şöyle bir mesaj çıkacak:
   > "Your site is live at **https://kullaniciadi.github.io/voice-analysis-app**"
3. Bu linki kopyala ve arkadaşlarına WhatsApp'tan at! 📲

---

### ⚠️ Önemli Notlar
*   **Mikrofon İzni:** Arkadaşların linki açtığında tarayıcı mikrofon izni isteyecektir. "İzin Ver" demeleri şart.
*   **iOS/iPhone:** iPhone'larda Safari tarayıcısı ile sorunsuz çalışır.
*   **Performans:** "Kasma" olursa, arkadaki diğer sekmeleri kapatmalarını söyleyebilirsin.
