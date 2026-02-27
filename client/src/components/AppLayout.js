import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/feedstock-types', label: 'Feedstock Types' },
  { to: '/farmers', label: 'Farmers' },
  { to: '/collection-centers', label: 'Collection Centers' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/land-parcels', label: 'Land Parcels' },
  { to: '/crop-plans', label: 'Crop Plans' },
  { to: '/harvest-batches', label: 'Harvest Batches' },
  { to: '/center-receipt-lots', label: 'Center Receipt Lots' },
  { to: '/center-stock-ledger', label: 'Center Stock Ledger' },
];

// Reusable protected shell for all authenticated pages.
export default function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="layout">
      <aside className="layout-sidebar">
        <h2 className="layout-brand">BioCNG Ops</h2>
        <p className="layout-subtext">Web MVP</p>

        <nav className="layout-nav" aria-label="Main Navigation">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `layout-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="layout-main">
        <header className="layout-header">
          <div>
            <p className="layout-user">
              {user?.name || '-'} | {user?.role || '-'}
            </p>
            <p className="layout-tenant">Tenant: {user?.tenantId || '-'}</p>
          </div>
          <button className="auth-button" type="button" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <section className="layout-content">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
