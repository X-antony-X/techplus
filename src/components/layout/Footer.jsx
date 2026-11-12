
import { siteSettings } from "../../siteSetting";
import "./Footer.css";

const Footer = () => {
  const socialLinks = Object.entries(siteSettings.social || {}).filter(
    ([, url]) => url
  );

  const whatsappNumber = "201279354981";

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-links">
          <h3>LINKS</h3>

          <div className="footer-socials">
            {socialLinks.map(([name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {name}
              </a>
            ))}
          </div>
        </div>

        <div className="footer-developer">
          <h2>WEBSITE MADE BY ANTONY</h2>
          
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-whatsapp"
          >
            <i className="fab fa-whatsapp"></i>
            Contact Me
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
