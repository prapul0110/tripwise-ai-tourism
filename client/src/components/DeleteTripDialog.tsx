import React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function DeleteTripDialog({ tripId, onDeleted, compact = false, initiallyOpen = false }: { tripId: number; onDeleted: () => void; compact?: boolean; initiallyOpen?: boolean }) {
  const remove = trpc.travel.deleteTrip.useMutation({
    onSuccess: () => { toast.success("Trip removed from your dashboard."); onDeleted(); },
    onError: () => toast.error("We could not remove this trip right now."),
  });
  return <AlertDialog defaultOpen={initiallyOpen}><AlertDialogTrigger asChild>{compact ? <button className="delete-trip-icon" aria-label="Delete saved trip"><Trash2 size={15} /></button> : <Button variant="outline" className="button-outline button-delete"><Trash2 size={15} /> Delete trip</Button>}</AlertDialogTrigger><AlertDialogContent className="delete-dialog"><AlertDialogHeader><AlertDialogTitle>Remove this journey?</AlertDialogTitle><AlertDialogDescription>This deletes the itinerary and its saved budget from your TripWise dashboard. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep trip</AlertDialogCancel><AlertDialogAction onClick={() => remove.mutate({ id: tripId })} disabled={remove.isPending} className="delete-confirm">{remove.isPending ? <><Loader2 className="animate-spin" size={15} /> Removing</> : "Remove trip"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
