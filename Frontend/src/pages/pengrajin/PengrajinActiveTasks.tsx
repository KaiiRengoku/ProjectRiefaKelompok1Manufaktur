import { useState } from "react";
import { useStore, daysUntil } from "@/store/useStore";
import { PageHeader } from "@/components/prodify/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/prodify/StatusBadge";
import { CheckCircle2, Calendar, MapPin, FileText, Zap, Clock } from "lucide-react";
import { EmptyState } from "@/components/prodify/EmptyState";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { cn, formatRupiah } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PengrajinActiveTasks() {
  const { currentUser, orders, finishSubtask } = useStore();
  const [finishId, setFinishId] = useState<string | null>(null);
  if (!currentUser) return null;

  const myTasks = orders
    .flatMap((o) =>
      o.subtasks
        .filter((s) => s.assignedTo === currentUser.id && s.status === "Sedang Dikerjakan")
        .map((s) => ({ ...s, order: o }))
    )
    .sort((a, b) => Number(b.order.fastTrack) - Number(a.order.fastTrack));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tugas Sedang Dikerjakan"
        description="Tugas yang sedang Anda kerjakan saat ini."
      />

      {myTasks.length === 0 ? (
        <EmptyState icon={Play} title="Tidak ada tugas aktif" description="Belum ada task yang sedang Anda kerjakan. Mulai tugas dari halaman Tugas Saya." />
      ) : (
        <div className="space-y-3">
          {myTasks.map((t) => {
            const days = daysUntil(t.order.deadline);
            const urgent = days <= 5;
            return (
              <Card key={t.id} className={cn(
                "p-4 sm:p-5",
                urgent && (t.order.fastTrack ? "border-l-4 border-l-destructive" : "border-l-4 border-l-warning")
              )}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono text-xs font-semibold text-secondary">{t.order.code}</p>
                      {t.order.fastTrack && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold uppercase">
                          <Zap className="h-3 w-3" /> Prioritas Tinggi
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-foreground mt-1">{t.order.productName}</h3>
                    <p className="text-sm text-secondary font-semibold mt-0.5">Bagian: {t.partName}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className={cn(urgent && "font-semibold text-warning")}>
                      Tenggat {new Date(t.order.deadline).toLocaleDateString("id-ID")} (H-{days})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> <span className="truncate">{t.order.address}</span>
                  </div>
                  {t.order.notes && (
                    <div className="flex items-start gap-1.5 sm:col-span-2">
                      <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{t.order.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Upah saat selesai</p>
                    <p className="font-bold text-foreground">{formatRupiah(t.point)}</p>
                  </div>
                  <AlertDialog open={finishId === t.id} onOpenChange={(open) => { if (!open) setFinishId(null) }}>
                    <AlertDialogTrigger asChild>
                      <Button onClick={() => setFinishId(t.id)} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Tandai Selesai
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Selesaikan Tugas</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin tugas <strong>{t.partName}</strong> dari pesanan <strong>{t.order.code}</strong> sudah selesai dikerjakan? Anda akan mendapatkan upah <strong>{formatRupiah(t.point)}</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setFinishId(null)}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { finishSubtask(t.id); setFinishId(null); toast.success(`Selamat! Anda mendapat ${formatRupiah(t.point)}`); }}>
                          Ya, Selesai
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
