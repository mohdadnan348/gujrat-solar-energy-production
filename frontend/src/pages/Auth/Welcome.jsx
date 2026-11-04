import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiSun,
  FiCheckCircle,
  FiPhone,
  FiCode,
} from "react-icons/fi";

import "./Welcome.css";

const features = [
  "Customer & Lead Management",
  "Quotation & Invoice Management",
  "Employee & Attendance Management",
];

const developers = [
  {
    name: "Mohd Adnan",
    role: "Full Stack Developer",
    phone: "9336176580",
    image: "/images/Adnan.jpeg",
  },
  {
    name: "Mohd Kaif",
    role: "Full Stack Developer",
    phone: "9519170797",
    image: "/images/kaif.png",
  },
];

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="gse-page">
      {/* BACKGROUND */}
      <div className="gse-bg" />
      <div className="gse-overlay" />

      {/* NAVBAR */}
      <nav className="gse-nav">
        <div className="gse-brand">
          <FiSun />
          <span>GUJRAT SOLAR ENERGY</span>
        </div>

        <button
          type="button"
          className="gse-nav-btn"
          onClick={() => navigate("/login")}
        >
          Login <FiArrowRight />
        </button>
      </nav>

      {/* HERO */}
      <main className="gse-hero">
        <div className="gse-tag">SOLAR BUSINESS MANAGEMENT SYSTEM</div>

        <div className="gse-title">
          <div className="gse-title-white">Welcome to</div>
          <div className="gse-title-gold">Gujrat Solar Energy</div>
        </div>

        <div className="gse-desc">
          Manage your complete solar business operations from one powerful
          platform. Customers, leads, quotations, invoices, attendance and
          payroll — all in one place.
        </div>

        <div className="gse-cta-wrap">
          <button
            type="button"
            className="gse-cta"
            onClick={() => navigate("/login")}
          >
            Login to Your Account
            <FiArrowRight />
          </button>
        </div>

        {/* FEATURES */}
        <div className="gse-features">
          {features.map((item) => (
            <div className="gse-feature" key={item}>
              <FiCheckCircle />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </main>

      {/* DEVELOPERS */}
      <section className="gse-devs">
        <div className="gse-devs-head">
          <div className="gse-devs-kicker">MEET OUR TEAM</div>
          <div className="gse-devs-title">Meet Our Developers</div>
          <div className="gse-devs-sub">
            The people behind the technology, building reliable digital
            solutions.
          </div>
        </div>

        <div className="gse-devs-grid">
          {developers.map((dev) => (
            <article className="gse-card" key={dev.name}>
              <div className="gse-card-img">
                <img src={dev.image} alt={dev.name} loading="lazy" />
              </div>

              <div className="gse-card-body">
                <div className="gse-card-icon">
                  <FiCode />
                </div>
                <div className="gse-card-name">{dev.name}</div>
                <div className="gse-card-role">{dev.role}</div>
                <a href={`tel:${dev.phone}`} className="gse-card-phone">
                  <FiPhone />
                  +91 {dev.phone}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="gse-footer">
        <div>© 2026 Gujrat Solar Energy. All rights reserved.</div>
        <div className="gse-footer-credit">
          Designed &amp; Developed by Adnan and Kaif
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
