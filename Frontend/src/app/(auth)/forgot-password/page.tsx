import Link from "next/link";
import { Activity } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Activity className="h-7 w-7 text-white" />
          </div>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Enter your email to receive a recovery link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/[0.02] border border-white/5 py-8 px-4 shadow sm:rounded-2xl sm:px-10 backdrop-blur-sm">
          <form className="space-y-6" action="#" method="POST">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input id="email" name="email" type="email" autoComplete="email" required className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm bg-black/50 placeholder-gray-500 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors" />
              </div>
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition-colors">
                Send Reset Link
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
