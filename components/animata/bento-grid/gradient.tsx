import { ReactNode } from "react";
import {
  ArrowRight,
  BarChart,
  BookPlus,
  GitBranch,
  HeartPulse,
  LineChart,
  Sun,
  TypeIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

function BentoCard({
  title,
  icon,
  description,
  children,
  gradient,
  className,
}: {
  children?: ReactNode;
  title: ReactNode;
  icon: ReactNode;
  gradient?: string;
  description: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <section className="flex h-full flex-col gap-2 p-4">
        <header>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-gray-600">{icon}</span>
            <p className="text-md line-clamp-1 font-bold text-gray-800">{title}</p>
          </div>
        </header>
        <div className="flex-1 text-sm font-medium text-gray-600">{description}</div>
        {children}
      </section>
    </div>
  );
}

function GradientCard() {
  return (
    <BentoCard
      title="Gradient"
      icon={<BarChart size={24} />}
      description={<span>A gradient is a smooth transition from one color to another.</span>}
      className="sm:col-span-1 sm:row-span-2"
    >
      <div className="group relative flex cursor-pointer flex-col justify-end rounded-xl bg-zinc-950 p-2 text-2xl tracking-tight text-gray-100 md:text-4xl">
        <div className="font-light">Get</div>
        <div className="-mt-2 font-bold">Gradients</div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-white transition-all duration-700 group-hover:rotate-[360deg] md:h-8 md:w-8">
          <ArrowRight size={16} className="text-blue-600" />
        </div>
        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white opacity-50 transition-all duration-700 group-hover:opacity-25" />
      </div>
    </BentoCard>
  );
}

function LinearGradientCard() {
  return (
    <BentoCard
      title="Linear Gradient"
      icon={<GitBranch size={24} />}
      description="A linear gradient is a gradient that goes in a straight line."
      className="group sm:col-span-1"
    >
      <div className="h-4 w-full rounded-xl bg-gray-100 group-hover:animate-pulse group-hover:bg-gray-300" />
      <div className="h-4 w-1/2 rounded-xl bg-gray-100 group-hover:animate-pulse group-hover:bg-gray-300" />
    </BentoCard>
  );
}

function RadialGradientCard() {
  return (
    <BentoCard
      title="Radial Gradient"
      icon={<LineChart size={24} />}
      description="A radial gradient is a gradient that goes in a circular direction."
      className="group sm:col-span-1"
    >
      <div className="flex w-full flex-row justify-end gap-2 rounded-xl border-gray-100 bg-gray-50 p-2">
        <HeartPulse
          size={16}
          className="delay-150 duration-75 group-hover:animate-in group-hover:slide-in-from-right-full text-gray-600"
        />
        <Sun
          size={16}
          className="delay-75 duration-75 group-hover:animate-in group-hover:slide-in-from-right-full text-gray-600"
        />
        <BookPlus
          size={16}
          className="duration-75 group-hover:animate-in group-hover:slide-in-from-right-full text-gray-600"
        />
      </div>
    </BentoCard>
  );
}

function ConicGradientCard() {
  return (
    <BentoCard
      title="Conic Gradient"
      icon={<TypeIcon size={24} />}
      description="A conic gradient is a gradient that goes in a circular direction."
      className="sm:col-span-2"
    />
  );
}

export default function GradientGrid() {
  return (
    <div className="bg-transparent p-4">
      <div className="grid grid-cols-1 gap-4 text-black sm:grid-cols-3 lg:grid-cols-3">
        <GradientCard />
        <LinearGradientCard />
        <RadialGradientCard />
        <ConicGradientCard />
      </div>
    </div>
  );
}
