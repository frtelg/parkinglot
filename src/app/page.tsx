import { ParkingLotApp } from "@/components/parking-lot-app";
import { getParkingLotItemDetail, listParkingLotItems } from "@/lib/parking-lot";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const initialItems = listParkingLotItems("active").items;
  const firstItem = initialItems[0] ?? null;

  return (
    <ParkingLotApp
      initialItems={initialItems}
      initialSelectedDetail={
        firstItem ? getParkingLotItemDetail(firstItem.id) : null
      }
    />
  );
}
