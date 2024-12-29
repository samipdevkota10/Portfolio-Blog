import { FaLinkedin, FaGithub, FaInstagram } from "react-icons/fa";
import Image from "next/image";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between py-6 px-6 lg:px-12 bg-white sticky top-0 z-50 shadow-none">
      {/* Logo Section */}
      <div className="flex flex-shrink-0 items-center">
        <Image
          className="mx-2"
          src="/assets/SamipDevkotaLogo.png" // Ensure the image is in the public/assets folder
          alt="Samip Devkota Logo"
          width={80}
          height={80}
          priority
        />
      </div>

      {/* Social Links */}
      <div className="flex items-center gap-4 text-2xl">
        <a
          href="https://github.com/samipdevkota10"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <FaGithub />
        </a>
        <a
          href="https://www.linkedin.com/in/samip-devkota/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
        >
          <FaLinkedin />
        </a>
        <a
          href="https://www.instagram.com/samip002/?igsh=MWptOHozNG55OG5rMQ%3D%3D"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <FaInstagram />
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
