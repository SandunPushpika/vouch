import Shell from "@/components/layout/shell";
export const metadata = {
  title: "Workspace",
  robots: { index: false, follow: false },
};
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
