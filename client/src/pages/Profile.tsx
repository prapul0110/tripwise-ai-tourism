import { Compass, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { TripNav } from "@/components/TripNav";
import { ThreeBackground } from "@/components/ThreeBackground";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const trips = trpc.travel.listTrips.useQuery(undefined, { enabled: isAuthenticated });
  const subscription = trpc.subscription.current.useQuery(undefined, { enabled: isAuthenticated });
  const profile = trpc.profile.current.useQuery(undefined, { enabled: isAuthenticated });
  const updatePreferences = trpc.profile.updatePreferences.useMutation({ onSuccess: () => { void profile.refetch(); toast.success("Travel preferences updated."); }, onError: () => toast.error("We could not save your preferences yet.") });
  const [preferences, setPreferences] = useState<string[]>([]);
  useEffect(() => { if (profile.data?.preferences) setPreferences(profile.data.preferences); }, [profile.data]);
  const preferenceOptions = ["Slow mornings", "Local food", "Meaningful culture", "Outdoor days", "Design hotels", "Night markets"];
  const togglePreference = (preference: string) => setPreferences(current => current.includes(preference) ? current.filter(item => item !== preference) : [...current, preference]);
  if (!isAuthenticated && !loading) return <div className="app-shell profile-page page-with-scene"><TripNav /><ThreeBackground scene="halo" /><main className="container simple-state"><ShieldCheck size={27} /><h1>Your travel profile<br /><em>awaits.</em></h1><p>Sign in to save preferences and keep your journeys connected.</p><Button className="button-teal" onClick={startLogin}>Sign in with Manus</Button></main></div>;
  return <div className="app-shell profile-page page-with-scene"><TripNav /><ThreeBackground scene="halo" /><main className="page-main container"><div className="profile-hero glass-card"><div className="profile-avatar">{user?.name?.slice(0, 1) || "T"}</div><div><p className="eyebrow">Travel profile</p><h1>{user?.name || "TripWise traveller"}</h1><p><Mail size={15} /> {user?.email || "Your Manus account"}</p></div><span className="profile-plan"><Sparkles size={14} /> {subscription.data?.plan === "pro" ? "Pro explorer" : "Free explorer"}</span></div><div className="profile-grid"><section className="profile-card glass-card"><p className="eyebrow">Your patterns</p><h2>Travel preferences</h2><div className="preference-pills preference-editor">{preferenceOptions.map(preference => <button type="button" key={preference} className={preferences.includes(preference) ? "active" : ""} onClick={() => togglePreference(preference)}>{preference}</button>)}</div><div className="profile-preference-actions"><p className="muted-copy">Choose the details that should shape the journeys TripWise suggests.</p><Button className="button-teal" disabled={!preferences.length || updatePreferences.isPending} onClick={() => updatePreferences.mutate({ preferences })}>{updatePreferences.isPending ? "Saving" : "Save preferences"}</Button></div></section><section className="profile-card glass-card"><p className="eyebrow">The numbers</p><h2>At a glance</h2><div className="profile-stats"><div><strong>{trips.data?.length || 0}</strong><span>saved trips</span></div><div><strong>{trips.data?.reduce((sum, trip) => sum + trip.days, 0) || 0}</strong><span>days mapped</span></div><div><strong>{subscription.data?.plan === "pro" ? "∞" : "5"}</strong><span>AI plan allowance</span></div></div></section><section className="profile-card glass-card profile-note"><Compass size={21} /><p>TripWise keeps your itineraries, selected plan and travel preferences together under your Manus OAuth session.</p></section></div></main></div>;
}
