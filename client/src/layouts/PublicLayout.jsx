import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <div className="mx-auto w-full max-w-6xl px-4 pb-2 text-end sm:px-6">
        <ThemeToggle />
      </div>
      <Footer />
    </div>
  );
}
