import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-[#030305]">{children}</main>
      <Footer />
    </>
  );
}
