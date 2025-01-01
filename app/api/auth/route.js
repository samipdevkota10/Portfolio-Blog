'use client';
import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Sign In</h1>
                <SignIn path="/login" />
            </div>
        </div>
    );
}
