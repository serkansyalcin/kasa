import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CashSession } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/utils/format";

type CashSessionCardProps = {
  session: CashSession;
  expectedBalance?: number | null;
};

export function CashSessionCard({
  session,
  expectedBalance,
}: CashSessionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            Güncel kasa oturumu
            <Badge variant={session.status === "open" ? "open" : "closed"}>
              {session.status === "open" ? "Açık" : "Kapalı"}
            </Badge>
          </CardTitle>
          <p className="mt-1 text-sm text-muted">
            Açılış: {formatDateTime(session.openedAt)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted">Açılış bakiyesi</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-forest">
            {formatMoney(session.openingBalance)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Beklenen nakit</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-forest">
            {expectedBalance != null ? formatMoney(expectedBalance) : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">Kart/havale hariç</p>
        </div>
        <div>
          <p className="text-xs text-muted">Not</p>
          <p className="mt-1 text-sm text-forest">{session.note || "—"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
