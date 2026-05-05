import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-12 h-12 text-[#7A1F2A] animate-spin mb-4" />
      <p className="text-[#1A1A1A]">{message}</p>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square bg-[#F5F5F5] rounded mb-3" />
      <div className="h-4 bg-[#F5F5F5] rounded w-3/4 mb-2" />
      <div className="h-4 bg-[#F5F5F5] rounded w-1/2 mb-2" />
      <div className="flex gap-1.5 mb-3">
        <div className="w-5 h-5 rounded-full bg-[#F5F5F5]" />
        <div className="w-5 h-5 rounded-full bg-[#F5F5F5]" />
        <div className="w-5 h-5 rounded-full bg-[#F5F5F5]" />
      </div>
      <div className="h-10 bg-[#F5F5F5] rounded" />
    </div>
  );
}
