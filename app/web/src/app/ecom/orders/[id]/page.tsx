import { OrderHistory } from "@/components/order-history";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderHistory highlightId={id} />;
}
