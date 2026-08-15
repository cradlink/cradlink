import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useDeleteActivity } from "@/hooks/use-activities";
import { errorMessage } from "@/lib/errors";
import type { Activity } from "@/lib/types";

export function ActivityOwnerMenu({
  activity,
  onDeleted,
}: {
  activity: Activity;
  onDeleted?: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const remove = useDeleteActivity();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user || user.id !== activity.creatorId || activity.id === "preview") return null;

  async function onDelete() {
    if (!user) return;
    try {
      await remove.mutateAsync({ id: activity.id, actorId: user.id });
      setConfirm(false);
      toast.success(t("activity.deleted"));
      if (onDeleted) onDeleted();
      else navigate("/");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-[#1d9bf01a] hover:text-primary"
        aria-label={t("activity.more")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreHorizontal className="size-5" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-64 overflow-hidden rounded-2xl border border-border bg-card py-1 shadow-[0_0_15px_rgba(15,20,25,0.12)] dark:shadow-[0_0_15px_rgba(255,255,255,0.08)]"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] font-bold text-[#f4212e] hover:bg-hover"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              setConfirm(true);
            }}
          >
            <Trash2 className="size-5" />
            {t("activity.delete")}
          </button>
          <Link
            to={`/activities/edit/${activity.id}`}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold hover:bg-hover"
            onClick={() => setOpen(false)}
          >
            <Pencil className="size-5" />
            {t("common.edit")}
          </Link>
        </div>
      ) : null}

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <h2 className="text-xl font-bold">{t("activity.deleteTitle")}</h2>
        <p className="mt-2 text-[15px] leading-5 text-muted-foreground">{t("activity.deleteBody")}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            className="bg-[#f4212e] text-white hover:bg-[#dc1e29]"
            disabled={remove.isPending}
            onClick={() => void onDelete()}
          >
            {remove.isPending ? t("common.working") : t("activity.deleteAction")}
          </Button>
          <Button variant="outline" disabled={remove.isPending} onClick={() => setConfirm(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
