'use client';

import { FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { SignedIn, SignedOut, useUser, UserButton, SignInButton } from '@clerk/nextjs';
import { useState } from 'react';
import { IoMenu, IoClose } from 'react-icons/io5';

const Navbar = () => {
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);

    // Toggle Mobile Menu
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="bg-white sticky top-0 z-50 shadow-md">
            {/* Top-level Navbar */}
            <div className="flex items-center justify-between py-4 px-6 lg:px-12">
                {/* Logo */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/assets/SamipDevkotaLogo.png"
                            alt="Samip Devkota Logo"
                            width={80}
                            height={80}
                            priority
                        />
                    </Link>
                    <div className="hidden md:flex gap-6">
                        <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
                            Home
                        </Link>
                        <Link href="/Blogs" className="text-gray-700 hover:text-blue-600 transition">
                            Blogs
                        </Link>
                    </div>
                </div>

                {/* Desktop Social & Auth Links */}
                <div className="hidden md:flex items-center gap-4">
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

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center">
                    <button onClick={toggleMenu} aria-label="Toggle Menu">
                        {isOpen ? (
                            <IoClose className="text-3xl text-gray-700" />
                        ) : (
                            <IoMenu className="text-3xl text-gray-700" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white shadow-md">
                    <ul className="flex flex-col gap-4 px-6 py-4">
                        <li>
                            <Link href="/" className="text-gray-700 hover:text-blue-600 transition" onClick={toggleMenu}>
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link href="/Blogs" className="text-gray-700 hover:text-blue-600 transition" onClick={toggleMenu}>
                                Blogs
                            </Link>
                        </li>
                        {user?.emailAddresses[0]?.emailAddress === 'samip.devkota@gmail.com' && (
                            <li>
                                <Link href="/write" className="text-gray-700 hover:text-blue-600 transition" onClick={toggleMenu}>
                                    Write
                                </Link>
                            </li>
                        )}
                        <li>
                            <a
                                href="https://github.com/samipdevkota10"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub"
                                className="text-gray-700 hover:text-blue-600 transition"
                            >
                                GitHub
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.linkedin.com/in/samip-devkota/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="LinkedIn"
                                className="text-gray-700 hover:text-blue-600 transition"
                            >
                                LinkedIn
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.instagram.com/samip002/?igsh=MWptOHozNG55OG5rMQ%3D%3D"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="text-gray-700 hover:text-blue-600 transition"
                            >
                                Instagram
                            </a>
                        </li>
                        <li>
                            <SignedOut>
                                <SignInButton />
                            </SignedOut>
                        </li>
                        <li>
                            <SignedIn>
                                <UserButton />
                            </SignedIn>
                        </li>
                    </ul>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
