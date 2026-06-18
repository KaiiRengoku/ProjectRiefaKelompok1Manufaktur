import { useState } from "react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/prodify/PageHeader";
import { Card } from "@/components/ui/card";
import { Award, Calendar } from "lucide-react";
import { EmptyState } from "@/components/prodify/EmptyState";
import { AnimatedNumber } from "@/components/prodify/AnimatedNumber";
import { History } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const formatRupiah = (value: number | string) => {
  const numeric = typeof value === "number" ? value : parseFloat(value) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(numeric);
};

export default function PengrajinHistory() {
  const { currentUser, points } = useStore();
  if (!currentUser) return null;

  const mine = points
    .filter((p) => p.userId === currentUser.id)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  // filter dropdown — tahun & bulan terpisah
  const [filterYear, setFilterYear] = useState(() => String(new Date().getFullYear()));
  const [filterMonth, setFilterMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, "0"));

  // stat cards — berdasarkan filter terpilih
  const statPoints = mine.filter((p) => {
    const d = new Date(p.date);
    return String(d.getFullYear()) === filterYear
        && String(d.getMonth() + 1).padStart(2, "0") === filterMonth;
  });
  const statTotal = statPoints.reduce((s, p) => s + p.point, 0);
  const statTasks = statPoints.length;

  const availableYears = [...new Set(
    mine.map((p) => String(new Date(p.date).getFullYear()))
  )].sort((a, b) => +b - +a);

  const months = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  // data terfilter
  const filtered = mine.filter((p) => {
    const d = new Date(p.date);
    return String(d.getFullYear()) === filterYear
        && String(d.getMonth() + 1).padStart(2, "0") === filterMonth;
  });

  // group by hari
  const grouped = filtered.reduce((acc, p) => {
    const key = new Date(p.date).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key)!.push(p);
    return acc;
  }, new Map<string, typeof mine>());

  // bar chart — per bulan dalam tahun terpilih
  const yearData = months.map((m) => {
    const monthPoints = mine.filter((p) => {
      const d = new Date(p.date);
      return String(d.getFullYear()) === filterYear
          && String(d.getMonth() + 1).padStart(2, "0") === m.value;
    });
    return {
      name: m.label.slice(0, 3),
      pendapatan: monthPoints.reduce((s, p) => s + p.point, 0),
      tugas: monthPoints.length,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Riwayat & Upah" description="Riwayat pekerjaan dan pendapatan Anda." />

      {/* card stat + bar chart */}
      {mine.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-warning" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pendapatan Bulan Ini</span>
              </div>
              <p className="text-xl font-bold text-foreground"><AnimatedNumber value={statTotal} format={formatRupiah} /></p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tugas Selesai</span>
              </div>
              <p className="text-xl font-bold text-foreground"><AnimatedNumber value={statTasks} /></p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" hide />
              <YAxis yAxisId="right" hide />
              <Tooltip formatter={(v: number, name: string) => [formatRupiah(v), name === "pendapatan" ? "Pendapatan" : "Tugas Selesai"]} />
              <Bar yAxisId="left" dataKey="pendapatan" fill="#CA8A04" radius={[4, 4, 0, 0]}
                label={(props: any) => {
                  const { x, y, width, height, value } = props;
                  if (!value || value === 0) return null;
                  const formatted = formatRupiah(value);
                  return (
                    <text x={x + width / 2} y={y + height / 2} fill="#fff" fontSize={9} fontWeight={600}
                      textAnchor="middle" dominantBaseline="middle"
                      transform={`rotate(-90, ${x + width / 2}, ${y + height / 2})`}
                    >
                      {formatted}
                    </text>
                  );
                }}
              />
              <Bar yAxisId="right" dataKey="tugas" fill="#EA580C" radius={[4, 4, 0, 0]}
                label={(props: any) => {
                  const { x, y, width, height, value } = props;
                  if (!value || value === 0) return null;
                  return (
                    <text x={x + width / 2} y={y + height / 2} fill="#fff" fontSize={9} fontWeight={600}
                      textAnchor="middle" dominantBaseline="middle"
                      transform={`rotate(-90, ${x + width / 2}, ${y + height / 2})`}
                    >
                      {value}
                    </text>
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* card filter + riwayat */}
      {mine.length === 0 ? (
        <EmptyState icon={History} title="Belum ada riwayat" description="Selesaikan tugas untuk mulai mengumpulkan poin upah." />
      ) : (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex justify-center">
              <div className="flex gap-2">
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="p-5 border-b border-border">
            <h2 className="font-bold text-foreground">Riwayat Daftar Pekerjaan</h2>
          </div>

          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">Tidak ada pekerjaan pada bulan ini.</p>
            ) : (
              [...grouped.entries()].map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  <div className="px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground">
                    {dateLabel}
                  </div>
                  {items.map((p) => (
                    <div key={p.id} className="p-4 pl-8 flex items-center justify-between gap-3 hover:bg-muted/30">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{p.productName}</p>
                        <p className="text-xs text-muted-foreground">{p.orderCode} | Bagian {p.partName}</p>
                      </div>
                      <p className="font-bold text-success shrink-0">+{formatRupiah(p.point)}</p>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
