import type { Meta, StoryObj } from "@storybook/react";
import { HexBoard } from "./HexBoard";

const meta = {
  title: "Components/HexBoard",
  component: HexBoard,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    width: { control: "number", defaultValue: 800 },
    height: { control: "number", defaultValue: 600 },
    radius: { control: "number", min: 1, max: 10, defaultValue: 4 },
    flat: { control: "boolean", defaultValue: false },
    spacing: {
      control: "number",
      min: 1,
      max: 2,
      step: 0.05,
      defaultValue: 1.1,
    },
  },
} satisfies Meta<typeof HexBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    width: 800,
    height: 600,
    radius: 4,
  },
};

export const HexCell: Story = {
  args: {
    width: 800,
    height: 600,
    radius: 0,
  },
};

export const WithMarks: Story = {
  args: {
    width: 800,
    height: 600,
    radius: 4,
    marks: {
      "0,0,0": "X",
      "1,0,-1": "O",
      "0,1,-1": "X",
      "-1,1,0": "O",
      "2,0,-2": "X",
    },
  },
};

export const SmallRadius: Story = {
  args: {
    width: 600,
    height: 450,
    radius: 2,
  },
};

export const LargeRadius: Story = {
  args: {
    width: 1000,
    height: 750,
    radius: 6,
  },
};

export const FlatHexagons: Story = {
  args: {
    width: 800,
    height: 600,
    radius: 4,
    flat: true,
    spacing: 1.05,
  },
};

export const CustomSize: Story = {
  args: {
    width: 800,
    height: 600,
    radius: 4,
    size: { x: 8, y: 8 },
    spacing: 1.05,
  },
};
