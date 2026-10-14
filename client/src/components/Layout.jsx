import { NavLink, Outlet } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `px-3 py-1 rounded-md text-sm font-medium ${
    isActive ? 'bg-white text-brand-700' : 'text-white/90 hover:bg-white/10'
  }`;

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-700">
        <nav className="mx-auto max-w-5xl flex items-center justify-between p-4">
          <span className="text-lg font-bold text-gold-500">Deenlearn</span>
          <div className="flex gap-2">
            <NavLink to="/" end className={linkClass}>Home</NavLink>
            <NavLink to="/status" className={linkClass}>Status</NavLink>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-6">
        <Outlet />
      </main>
      <footer className="p-4 text-center text-sm text-slate-500">© Deenlearn</footer>
    </div>
  );
}
