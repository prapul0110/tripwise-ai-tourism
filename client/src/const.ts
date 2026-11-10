import { openAuthModal } from "./lib/authModal";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Open the native TripWise sign-in / registration dialog.
 */
export const startLogin = () => {
  openAuthModal();
};

