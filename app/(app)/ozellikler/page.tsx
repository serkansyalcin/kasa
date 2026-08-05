"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type GuideSection = {
  title: string;
  href?: string;
  linkLabel?: string;
  points: string[];
};

const sections: GuideSection[] = [
  {
    title: "Dashboard",
    href: "/",
    linkLabel: "Dashboard’a git",
    points: [
      "Günün gelir, gider ve net tutarını özetler.",
      "Açık masa sayısı ve kasa durumunu gösterir.",
      "Gelir hedeflerinin (gün / hafta / ay / yıl) ne kadarını tamamladığınızı izlersiniz.",
      "Hızlı satış veya gelir/gider eklemek için üstteki butonları kullanın.",
    ],
  },
  {
    title: "Ürünler",
    href: "/urunler",
    linkLabel: "Ürünlere git",
    points: [
      "Menü ve tedarik kalemlerini tek yerden ekleyin, düzenleyin veya silin.",
      "Kullanım türü: sadece satış, sadece alış veya ikisi.",
      "Stok takibi açıksa: alış stoku artırır, satış ve masa ödemesi azaltır.",
      "Satılan / alınan miktarlar fiş geçmişinden otomatik hesaplanır.",
      "Düşük stok eşiği ile kritik ürünleri kolayca görürsünüz.",
      "Sayım için satırdaki ayar ikonuyla stoku elle düzeltebilirsiniz.",
    ],
  },
  {
    title: "Satış (tezgâh)",
    href: "/satis",
    linkLabel: "Satışa git",
    points: [
      "Paket veya tezgâh satışı içindir — anında ödeme alınır.",
      "Ürüne tıklayın, sepete ekleyin, ödeme yöntemini seçip tamamlayın.",
      "Kayıt otomatik olarak İşlemler’e gelir olarak düşer.",
      "Masa siparişi için bu sayfayı değil Masalar’ı kullanın.",
    ],
  },
  {
    title: "Masalar",
    href: "/masalar",
    linkLabel: "Masalara git",
    points: [
      "Kat planında boş / dolu masaları görürsünüz.",
      "Boş masaya tıklayıp adisyon açın; ürün ekleyin.",
      "Hesabı kapatırken Öde ile tahsil edin — kasa işlemi oluşur, masa boşalır.",
      "Masa tanımları sekmesinden masa ekleyip düzenleyebilirsiniz.",
      "Açık adisyonu iptal ederseniz kasa hareketi oluşmaz.",
    ],
  },
  {
    title: "Alış",
    href: "/alis",
    linkLabel: "Alışa git",
    points: [
      "Tedarik alışlarını kaydedin (süt, şeker, içecek vb.).",
      "İsteğe bağlı tedarikçi adı yazabilirsiniz.",
      "Kayıt gider olarak İşlemler’e eklenir; stok takibi açıksa stok artar.",
    ],
  },
  {
    title: "İşlemler",
    href: "/islemler",
    linkLabel: "İşlemlere git",
    points: [
      "Tüm gelir ve gider hareketlerinin listesidir.",
      "Tarih, tür, ödeme ve kategoriye göre filtreleyebilirsiniz.",
      "Elle gelir/gider ekleyebilir; satış veya alıştan gelen fişler etiketlenir.",
      "Satış/alış fişine bağlı işlemler düzenlenemez; silerseniz bağlı fiş de kalkar.",
    ],
  },
  {
    title: "Kasa",
    href: "/kasa",
    linkLabel: "Kasaya git",
    points: [
      "Güne açılış bakiyesiyle kasayı açın.",
      "Gün sonunda sayım yapıp kapatın; beklenen nakit ile farkı görürsünüz.",
      "Beklenen nakit yalnızca nakit ödemeleri sayar (kart/havale hariç).",
      "Satış yapmak için kasa açık olmak zorunda değildir; sayım için açmanız önerilir.",
    ],
  },
  {
    title: "Kategoriler",
    href: "/kategoriler",
    linkLabel: "Kategorilere git",
    points: [
      "Gelir ve giderleri gruplamak için kategoriler tanımlayın.",
      "Satış ve Alış için hazır kategoriler vardır.",
      "Raporlarda hangi kalemlerin öne çıktığını netleştirir.",
    ],
  },
  {
    title: "Raporlar",
    href: "/raporlar",
    linkLabel: "Raporlara git",
    points: [
      "Gün, hafta, ay veya yıl özetine bakın.",
      "Gelir hedefleri ve önceki dönem karşılaştırmasını inceleyin.",
      "CSV / PDF dışa aktarma veya yazdırma yapabilirsiniz.",
    ],
  },
  {
    title: "Ayarlar",
    href: "/ayarlar",
    linkLabel: "Ayarlara git",
    points: [
      "İşletme adı, e-posta ve varsayılan açılış bakiyesini düzenleyin.",
      "Günlük / haftalık / aylık / yıllık gelir hedeflerini belirleyin.",
      "Veriyi JSON olarak yedekleyip geri yükleyebilirsiniz.",
      "Demo veriyi sıfırlama seçeneği vardır — dikkatli kullanın.",
    ],
  },
];

const tips = [
  "Önce Ürünler’den menü ve tedarik kalemlerinizi tanımlayın.",
  "Güne Kasa’dan açılış yapın; gün sonunda sayımla kapatın.",
  "Tezgâh satışı → Satış; masa siparişi → Masalar.",
  "Stok için alış ve satışta aynı ürünü kullanın; takibi kapalı ürünler stok değiştirmez.",
  "Verileriniz tarayıcıda saklanır; önemli dönemlerde Ayarlar’dan yedek alın.",
];

export default function FeaturesPage() {
  return (
    <div>
      <PageHeader
        title="Özellikler listesi"
        description="Kasa’yı nasıl kullanacağınızı kısa ve sade anlatan kullanım kılavuzu"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Hızlı başlangıç</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-forest">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>{section.title}</CardTitle>
              {section.href && section.linkLabel ? (
                <Link
                  href={section.href}
                  className="text-sm font-medium text-olive hover:text-forest"
                >
                  {section.linkLabel}
                </Link>
              ) : null}
            </CardHeader>
            <CardContent className="pt-2">
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-forest/90">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
