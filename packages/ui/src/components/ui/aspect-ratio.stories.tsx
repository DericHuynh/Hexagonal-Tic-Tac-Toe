import type { Meta, StoryObj } from "@storybook/react";
import { AspectRatio } from "./aspect-ratio";

const meta = {
  title: "Components/AspectRatio",
  component: AspectRatio,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    ratio: {
      control: "number",
      step: 0.1,
    },
  },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof AspectRatio>;

export const Default: Story = {
  render: () => (
    <AspectRatio ratio={16 / 9} className="w-[300px] overflow-hidden rounded-lg bg-muted">
      <img
        src="https://picsum.photos/seed/aspect/600/338"
        alt="16:9 aspect ratio"
        className="h-full w-full object-cover"
      />
    </AspectRatio>
  ),
};

export const Square: Story = {
  render: () => (
    <AspectRatio ratio={1} className="w-[200px] overflow-hidden rounded-lg bg-muted">
      <img
        src="https://picsum.photos/seed/square/400/400"
        alt="1:1 aspect ratio"
        className="h-full w-full object-cover"
      />
    </AspectRatio>
  ),
};

export const FourByThree: Story = {
  render: () => (
    <AspectRatio ratio={4 / 3} className="w-[300px] overflow-hidden rounded-lg bg-muted">
      <img
        src="https://picsum.photos/seed/4x3/600/450"
        alt="4:3 aspect ratio"
        className="h-full w-full object-cover"
      />
    </AspectRatio>
  ),
};

export const TwentyOneByNine: Story = {
  render: () => (
    <AspectRatio ratio={21 / 9} className="w-[400px] overflow-hidden rounded-lg bg-muted">
      <img
        src="https://picsum.photos/seed/21x9/840/360"
        alt="21:9 aspect ratio"
        className="h-full w-full object-cover"
      />
    </AspectRatio>
  ),
};

export const WithContent: Story = {
  render: () => (
    <AspectRatio ratio={16 / 9} className="w-[300px] overflow-hidden rounded-lg">
      <div className="relative h-full w-full bg-gradient-to-br from-primary to-primary/50">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-primary-foreground">
            16:9
          </span>
        </div>
      </div>
    </AspectRatio>
  ),
};

export const VideoPlaceholder: Story = {
  render: () => (
    <AspectRatio ratio={16 / 9} className="w-[400px] overflow-hidden rounded-lg bg-black">
      <div className="relative h-full w-full">
        <img
          src="https://picsum.photos/seed/video/800/450"
          alt="Video thumbnail"
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform hover:scale-110">
            <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>
    </AspectRatio>
  ),
};
