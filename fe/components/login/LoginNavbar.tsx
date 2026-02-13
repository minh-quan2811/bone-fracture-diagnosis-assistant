import { useRouter } from "next/navigation";

export function LoginNavbar() {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/");
  };

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-[var(--color-border)] sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-medium)] rounded-xl flex items-center justify-center">
              <div className="w-5 h-5 border-3 border-white rounded-md"></div>
            </div>
            <span className="text-xl font-bold text-gray-900">Bone Vision Assistant</span>
          </button>
        </div>
      </div>
    </nav>
  );
}