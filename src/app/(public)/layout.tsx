import { AppFooter } from "@/src/components/ui/AppFooter";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <AppFooter />
    </>
  );
}
