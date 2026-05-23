interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="h-16 bg-card border-b border-border flex items-center px-4">
        <h1 className="text-xl font-bold">Document Extraction Engine</h1>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
};
