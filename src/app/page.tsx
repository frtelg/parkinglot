import { ParkingLotApp } from "@/components/parking-lot-app";
import { listParkingLotItems } from "@/lib/parking-lot";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const initialItems = listParkingLotItems("active").items;

  return <ParkingLotApp initialItems={initialItems} initialSelectedDetail={null} />;
}
