import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#030305] flex items-center justify-center p-6">
      <div className="absolute top-8 left-8">
        <Link href="/" className="font-serif text-xl text-white hover:opacity-80 transition-opacity">
          BeeVelt Halls
        </Link>
      </div>
      {children}
    </div>
  );
}
