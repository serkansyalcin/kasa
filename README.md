# Kasa

Küçük işletmeler (cafe, bar, büfe vb.) için **Türkçe kasa takip** uygulaması.

Günlük gelir–gider, kasa açılış/kapanış, tezgâh satışı, masa adisyonu, alış, ürün/stok ve basit raporları tek yerden yönetmenizi sağlar. Bu depo **açık kaynak** bir MVP’dir; backend yoktur — veriler tarayıcıda (`localStorage`) tutulur.

Uygulama içi kullanım kılavuzu: menüden **Özellikler listesi** (`/ozellikler`).

## Özellikler

- **Dashboard** — günün özeti, hedefler, açık masa, kasa durumu
- **Satış** — tezgâh / paket satışı (anında tahsilat)
- **Masalar** — kat planı, adisyon açma, ürün ekleme, ödeme
- **Alış** — tedarik kayıtları (gider + stok artışı)
- **Ürünler** — katalog, fiyatlar, stok takibi, düşük stok uyarısı
- **İşlemler** — gelir/gider listesi, filtre, dışa aktarma
- **Kasa** — açılış, nakit beklenen, kapanış ve fark
- **Kategoriler** — gelir/gider grupları
- **Raporlar** — gün/hafta/ay/yıl, hedef karşılaştırması, CSV/PDF
- **Ayarlar** — işletme bilgisi, hedefler, JSON yedekleme / sıfırlama

## Teknoloji

| Katman | Seçim |
|--------|--------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Dil | TypeScript |
| İkon | lucide-react |
| PDF | jsPDF |

Gerçek API, kimlik doğrulama veya veritabanı yoktur (demo giriş + yerel state).

## Kurulum

Gereksinim: Node.js 20+ önerilir.

```bash
npm install
npm run dev
```

Tarayıcıda: [http://localhost:3000](http://localhost:3000)

Aynı ağdaki başka cihazdan erişmek için `npm run dev` `0.0.0.0` üzerinde dinler. Gerekirse `next.config.ts` içindeki `allowedDevOrigins` listesine makinenizin LAN IP’sini ekleyin.

```bash
npm run build   # üretim derlemesi
npm run start   # üretim sunucusu
npm run lint    # ESLint
```

## Proje yapısı (özet)

```
app/(app)/          # Dashboard, satış, masalar, alış, …
app/(auth)/login/   # Görsel giriş ekranı
components/ui/      # Ortak UI bileşenleri
components/domain/  # İş mantığına yakın bileşenler
lib/store/          # App state + localStorage
lib/types/          # Tip tanımları
lib/mock/           # Demo seed verisi
lib/utils/          # format, istatistik, stok yardımcıları
```

## Veri ve gizlilik

- Veriler yalnızca kullanıcının tarayıcısında saklanır.
- Ayarlar’dan JSON yedek alıp geri yükleyebilirsiniz.
- Sunucuya işlem veya kişisel veri gönderilmez.

## Katkı

Katkılar memnuniyetle karşılanır:

1. Depoyu fork’layın
2. Özellik veya düzeltme dalı açın
3. Anlaşılır commit / PR açıklaması yazın

Öneri ve hata bildirimleri için issue açabilirsiniz.

## Lisans

Bu proje açık kaynak olarak paylaşılmaktadır. Dağıtım ve katkı koşulları için depodaki lisans dosyasına bakın; henüz eklenmediyse kullanım amacı eğitim / demo / özelleştirme içindir — üretimde kendi sorumluluğunuzda kullanın.

---

**Kasa** — küçük işletme takibi, sade ve Türkçe.
