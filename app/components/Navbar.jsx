'use client';

import { FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { SignedIn, SignedOut, useUser, UserButton, SignInButton } from '@clerk/nextjs';

const Navbar = () => {
    const { user } = useUser();

    return (
        <nav className="flex items-center justify-between py-4 px-6 lg:px-12 bg-white sticky top-0 z-50 shadow-md">
            {/* Logo Section */}
            <div className="flex items-center gap-6">
                <Image
                    className="mx-2"
                    src="/assets/SamipDevkotaLogo.png"
                    alt="Samip Devkota Logo"
                    width={80}
                    height={80}
                    priority
                />
                {/* Navigation Links */}
                <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
                    Home
                </Link>
                <Link href="/blogs" className="text-gray-700 hover:text-blue-600 transition">
                    Blogs
                </Link>
            </div>

            {/* Auth & Social Links Section */}
            <div className="flex items-center gap-4">
                {/* Social Links */}
                <a
                    href="https://github.com/samipdevkota10"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="text-gray-700 hover:text-blue-600 transition"
                >
                    <FaGithub />
                </a>
                <a
                    href="https://www.linkedin.com/in/samip-devkota/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="text-gray-700 hover:text-blue-600 transition"
                >
                    <FaLinkedin />
                </a>
                <a
                    href="https://www.instagram.com/samip002/?igsh=MWptOHozNG55OG5rMQ%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="text-gray-700 hover:text-blue-600 transition"
                >
                    <FaInstagram />
                </a>

                {/* Auth Links */}
                <SignedOut>
                    <SignInButton />
                </SignedOut>
                <SignedIn>
                    {user?.emailAddresses[0]?.emailAddress === 'samip.devkota@gmail.com' && (
                        <Link
                            href="/write"
                            className="text-gray-700 hover:text-blue-600 transition"
                        >
                            Write
                        </Link>
                    )}
                    <UserButton />
                </SignedIn>
            </div>
        </nav>
    );
};

export default Navbar;
