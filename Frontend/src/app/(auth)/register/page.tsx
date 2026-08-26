import Link from "next/link";
import { Activity } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Activity className="h-7 w-7 text-white" />
          </div>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Create an Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Already have an account? <Link href="/login" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">Sign in</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/[0.02] border border-white/5 py-8 px-4 shadow sm:rounded-2xl sm:px-10 backdrop-blur-sm">
          <form className="space-y-6" action="#" method="POST">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <div className="mt-1">
                <input id="name" name="name" type="text" required className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm bg-black/50 placeholder-gray-500 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input id="email" name="email" type="email" autoComplete="email" required className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm bg-black/50 placeholder-gray-500 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <input id="password" name="password" type="password" autoComplete="new-password" required className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm bg-black/50 placeholder-gray-500 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors" />
              </div>
            </div>

            <div className="text-xs text-gray-400">
              By registering, you agree to our <Link href="/terms" className="text-purple-400 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-purple-400 hover:underline">Privacy Policy</Link>.
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition-colors">
                Register
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
