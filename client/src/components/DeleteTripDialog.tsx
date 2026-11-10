import React, { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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

export function DeleteTripDialog({
  tripId,
  onDeleted,
  compact = false,
  initiallyOpen = false,
}: {
  tripId: number;
  onDeleted: () => void | Promise<void>;
  compact?: boolean;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const remove = trpc.travel.deleteTrip.useMutation();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (remove.isPending) return;

    try {
      const res = await remove.mutateAsync({ id: tripId });
      if (res?.success) {
        toast.success("Trip removed from your dashboard.");
        setOpen(false);
        await onDeleted();
      } else {
        toast.error("We could not remove this trip right now.");
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
          ? (err as { message: string }).message
          : "We could not remove this trip right now.";
      toast.error(message);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!remove.isPending) {
          setOpen(nextOpen);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        {compact ? (
          <button className="delete-trip-icon" aria-label="Delete saved trip">
            <Trash2 size={15} />
          </button>
        ) : (
          <Button variant="outline" className="button-outline button-delete">
            <Trash2 size={15} /> Delete trip
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="delete-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this journey?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes the itinerary and its saved budget from your TripWise dashboard. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Keep trip</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={remove.isPending}
            className="delete-confirm"
          >
            {remove.isPending ? (
              <>
                <Loader2 className="animate-spin" size={15} /> Removing…
              </>
            ) : (
              "Remove trip"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

