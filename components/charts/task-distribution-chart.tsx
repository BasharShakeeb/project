import dynamic from "next/dynamic";

interface TaskDistributionChartProps {
  data: { name: string; value: number; color: string }[];
}

const TaskDistributionChartInner = dynamic(() => import("./task-distribution-chart-inner"), {
  ssr: false,
  loading: () => <div className="h-[240px] animate-shimmer rounded-lg bg-muted/30" />,
});

export default function TaskDistributionChart({ data }: TaskDistributionChartProps) {
  return <TaskDistributionChartInner data={data} />;
}
