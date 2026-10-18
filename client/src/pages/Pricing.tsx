import { Check, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { TripNav } from "@/components/TripNav";
import { ThreeBackground } from "@/components/ThreeBackground";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const plans = [{ name: "Free", price: "₹0", description: "A deliberate way to begin planning.", features: ["5 AI itinerary generations", "Essential route and budget view", "3 saved journeys"], id: "free" as const }, { name: "Pro", price: "₹299", description: "For a travel practice with more range.", features: ["Unlimited AI itinerary generation", "Advanced budget optimisation", "Unlimited saved journeys", "Priority TripWise assistant"], id: "pro" as const }];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const current = trpc.subscription.current.useQuery(undefined, { enabled: isAuthenticated });
  const choose = trpc.subscription.selectDemoPlan.useMutation({ onSuccess: () => { void utils.subscription.current.invalidate(); toast.success("Your selected demo plan is now active."); } });
  const select = (plan: "free" | "pro") => { if (!isAuthenticated) { toast.info("Sign in before choosing a plan."); startLogin(); return; } choose.mutate({ plan }); };
  return <div className="app-shell pricing-page page-with-scene"><TripNav /><ThreeBackground scene="orbit" /><main className="page-main container"><div className="pricing-intro"><p className="eyebrow"><Sparkles size={14} /> Designed to grow with you</p><h1>Choose your<br /><em>way of going.</em></h1><p>Start with the essential TripWise planning space or unlock more room for every route.</p></div><div className="pricing-grid">{plans.map(plan => <section className={`price-card glass-card ${plan.id === "pro" ? "featured" : ""}`} key={plan.id}>{plan.id === "pro" && <span className="featured-label">MOST CONSIDERED</span>}<p className="eyebrow">TripWise {plan.name}</p><h2>{plan.price}<small>/ month</small></h2><p>{plan.description}</p><div className="price-rule" /> <ul>{plan.features.map(feature => <li key={feature}><Check size={16} /> {feature}</li>)}</ul><Button className={plan.id === "pro" ? "button-teal" : "button-outline"} variant={plan.id === "pro" ? "default" : "outline"} onClick={() => select(plan.id)} disabled={choose.isPending || current.data?.plan === plan.id}>{current.data?.plan === plan.id ? "Current plan" : plan.id === "pro" ? "Choose Pro" : "Choose Free"}</Button></section>)}</div><section className="demo-payment glass-card"><div><CreditCard size={20} /><div><p className="eyebrow">Payment architecture</p><h3>Demo payment mode is enabled</h3><p>This preview records a selected demo plan only. Production checkout remains deliberately disconnected until a secure provider such as Razorpay is configured with server-side credentials.</p></div></div><span><ShieldCheck size={15} /> No payment details are collected</span></section></main></div>;
}
