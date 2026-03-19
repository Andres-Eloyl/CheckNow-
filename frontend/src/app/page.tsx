import { redirect } from "next/navigation";

/**
 * AI Context: Root entry point.
 * CheckNow uses a flow where scanning a QR code redirects here, which immediately
 * directs the user to the `/join` page to set up their alias before seeing the menu.
 */
export default function Home() {
  redirect("/join");
}
