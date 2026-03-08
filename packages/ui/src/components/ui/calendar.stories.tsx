import type { Meta, StoryObj } from "@storybook/react";
import { Calendar } from "./calendar";
import { useState } from "react";

const meta = {
  title: "Components/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return <Calendar mode="single" selected={date} onSelect={setDate} />;
  },
};

export const Multiple: Story = {
  render: () => {
    const [date, setDate] = useState<Date[] | undefined>([
      new Date(2024, 0, 15),
      new Date(2024, 0, 20),
    ]);
    return <Calendar mode="multiple" selected={date} onSelect={setDate} />;
  },
};

export const Range: Story = {
  render: () => {
    const [date, setDate] = useState<
      | {
          from: Date | undefined;
          to?: Date | undefined;
        }
      | undefined
    >({
      from: new Date(2024, 0, 10),
      to: new Date(2024, 0, 20),
    });
    return <Calendar mode="range" selected={date} onSelect={setDate} />;
  },
};

export const WithDisabledDates: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={(date) => date.getDay() === 0 || date.getDay() === 6}
      />
    );
  },
};

export const Small: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return <Calendar mode="single" selected={date} onSelect={setDate} />;
  },
};

export const MultipleMonths: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        numberOfMonths={2}
        showOutsideDays={false}
      />
    );
  },
};
