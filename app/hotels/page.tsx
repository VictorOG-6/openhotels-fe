import type { Metadata } from "next";

import LocationDirectory from "@/components/hotels/location-directory";

export const metadata: Metadata = {
  title: "Hotels",
  description: "Hotels in top cities. Open a city to filter stays and see them on the map.",
};

export default function HotelsPage() {
  return <LocationDirectory />;
}
