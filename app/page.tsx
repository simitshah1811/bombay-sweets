import { SweetHero } from "@/components/sections/SweetHero";
import { SweetCollection } from "@/components/sections/SweetCollection";
import { CravingDiscoveryBand } from "@/components/sections/CravingDiscoveryBand";
import { SignatureDishes } from "@/components/sections/SignatureDishes";
import { MenuExploreBand } from "@/components/sections/MenuExploreBand";
import { BrandStoryBand } from "@/components/sections/BrandStoryBand";
import { CategoryDiscoveryBand } from "@/components/sections/CategoryDiscoveryBand";
import { CateringBand } from "@/components/sections/CateringBand";
import { LocationHoursBand } from "@/components/sections/LocationHoursBand";

export default function Home() {
  return (
    <main>
      <SweetHero />
      <SweetCollection />
      <CravingDiscoveryBand />
      <SignatureDishes />
      <MenuExploreBand />
      <BrandStoryBand />
      <CategoryDiscoveryBand />
      <CateringBand />
      <LocationHoursBand />
    </main>
  );
}
