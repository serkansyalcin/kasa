import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
      <p className="font-display text-5xl text-forest">Kasa</p>
      <h1 className="mt-4 text-xl font-semibold text-forest">
        Sayfa bulunamadı
      </h1>
      <p className="mt-2 text-sm text-muted">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-forest px-4 text-sm font-medium text-cream transition-colors hover:bg-olive"
      >
        Ana sayfaya dön
      </Link>
    </div>
  );
}
