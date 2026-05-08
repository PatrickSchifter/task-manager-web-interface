import Navbar from "@/components/navbar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen bg-[#0d3662]/20">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-6 flex-grow">
        {children}
      </main>
    </div>
  );
}
