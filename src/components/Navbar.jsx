import { NavLink } from "react-router-dom";

export default function Navbar() {
  const baseClasses = "px-3 py-1 transition-colors duration-200";
  const activeClasses = "text-yellow-300 font-bold underline";
  const inactiveClasses = "text-white hover:text-yellow-200";

  const linkClass = ({ isActive }) =>
    `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;

  return (
    <nav className="text-gray-900 blur-bg p-4 bg-black">
      <ul className="flex gap-6 justify-center">
        <li>
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="#" className={linkClass}>
            About
          </NavLink>
        </li>
        <li>
          <NavLink to="#" className={linkClass}>
            Contact
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
