import { BrandStrip } from "@/app/_components/brand-strip";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <BrandStrip />
      {children}
    </div>
  );
}
