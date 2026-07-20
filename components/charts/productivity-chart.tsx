import dynamic from "next/dynamic";

interface ProductivityChartProps {
  data: { day: string; hours: number }[];
}

const ProductivityChartInner = dynamic(() => import("./productivity-chart-inner"), {
  ssr: false,
  loading: () => <div className="h-[240px] animate-shimmer rounded-lg bg-muted/30" />,
});

export default function ProductivityChart({ data }: ProductivityChartProps) {
  return <ProductivityChartInner data={data} />;
}
