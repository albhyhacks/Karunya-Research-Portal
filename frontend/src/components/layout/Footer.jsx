import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full border-t border-outline-variant/20 bg-surface-container-highest">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 py-10 w-full max-w-screen-2xl mx-auto">
        <div className="mb-8 md:mb-0">
          <div className="font-headline text-xl font-bold text-primary mb-2">
            Karunya Research Portal
          </div>
          <p className="font-body text-sm tracking-wide uppercase text-on-surface-variant">
            © {new Date().getFullYear()} Karunya Institute of Technology and Sciences. All Rights Reserved. Coimbatore, India.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <Link to="#" className="font-body text-sm tracking-wide uppercase text-on-surface-variant hover:text-secondary transition-colors">
            Institutional Credits
          </Link>
          <Link to="#" className="font-body text-sm tracking-wide uppercase text-on-surface-variant hover:text-secondary transition-colors">
            Privacy Policy
          </Link>
          <Link to="#" className="font-body text-sm tracking-wide uppercase text-on-surface-variant hover:text-secondary transition-colors">
            Contact Us
          </Link>
          <Link to="#" className="font-body text-sm tracking-wide uppercase text-on-surface-variant hover:text-secondary transition-colors">
            University Site
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
