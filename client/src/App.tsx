import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { InteractionSoundManager } from "./components/InteractionSoundManager";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Planner from "./pages/Planner";
import Explore from "./pages/Explore";
import TripDetail from "./pages/TripDetail";
import Trips from "./pages/Trips";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import DestinationDetail from "./pages/DestinationDetail";
import { TripProvider } from "./contexts/TripContext";
import { NatureBackdrop } from "./components/NatureBackdrop";
import { AuthDialog } from "./components/AuthDialog";
import { useGuardedLocation } from "./lib/navigationGuard";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <WouterRouter hook={useGuardedLocation}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/planner"} component={Planner} />
        <Route path={"/explore/:id"}>{params => <DestinationDetail destinationId={params.id} />}</Route>
        <Route path={"/explore"} component={Explore} />
        <Route path={"/trip/current"}><TripDetail /></Route>
        <Route path={"/trip/:id"}>{params => <TripDetail tripId={params.id} />}</Route>
        <Route path={"/trips"} component={Trips} />
        <Route path={"/pricing"} component={Pricing} />
        <Route path={"/profile"} component={Profile} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <InteractionSoundManager />
          <Toaster />
          <AuthDialog />
          <NatureBackdrop />
          <div className="application-layer"><TripProvider><Router /></TripProvider></div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
