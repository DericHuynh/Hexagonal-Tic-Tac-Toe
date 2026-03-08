import type { Meta, StoryObj } from "@storybook/react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "./chart";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const meta = {
  title: "Components/Chart",
  component: ChartContainer,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof ChartContainer>;

const pieData = [
  { name: "Chrome", value: 65, fill: "var(--color-chrome)" },
  { name: "Safari", value: 20, fill: "var(--color-safari)" },
  { name: "Firefox", value: 10, fill: "var(--color-firefox)" },
  { name: "Edge", value: 5, fill: "var(--color-edge)" },
];

const barData = [
  { name: "Jan", value: 120 },
  { name: "Feb", value: 200 },
  { name: "Mar", value: 150 },
  { name: "Apr", value: 180 },
  { name: "May", value: 220 },
];

const chartConfig = {
  chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
  firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))",
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
};

export const PieChartStory: Story = {
  render: () => (
    <ChartContainer config={chartConfig} className="h-[200px] w-[300px]">
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={60}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
      </PieChart>
    </ChartContainer>
  ),
};

export const BarChartStory: Story = {
  render: () => (
    <ChartContainer
      config={{
        value: {
          label: "Value",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-[200px] w-[350px]"
    >
      <BarChart data={barData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" />
      </BarChart>
    </ChartContainer>
  ),
};

export const WithLegend: Story = {
  render: () => (
    <ChartContainer config={chartConfig} className="h-[250px] w-[350px]">
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={60}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  ),
};

export const StackedBar: Story = {
  render: () => (
    <ChartContainer
      config={{
        desktop: {
          label: "Desktop",
          color: "hsl(var(--chart-1))",
        },
        mobile: {
          label: "Mobile",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[200px] w-[350px]"
    >
      <BarChart
        data={[
          { name: "Jan", desktop: 186, mobile: 80 },
          { name: "Feb", desktop: 305, mobile: 200 },
          { name: "Mar", desktop: 237, mobile: 120 },
        ]}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" stackId="a" />
        <Bar dataKey="mobile" fill="var(--color-mobile)" stackId="a" />
      </BarChart>
    </ChartContainer>
  ),
};
