"use client";

import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const { signIn, error, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!password.trim()) {
      setLocalError("Please enter the password");
      return;
    }

    const success = await signIn(password);
    if (!success) {
      setLocalError("Incorrect password");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-3xl font-bold text-white">J</span>
          </div>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              James OS
            </CardTitle>
            <CardDescription className="text-zinc-400">
              AI Assistant Command Center
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {(error || localError) && (
              <Alert variant="destructive" className="bg-red-950/30 border-red-800">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  {error || localError}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-600 h-12"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  "Enter Dashboard"
                )}
              </Button>
            </form>

            <p className="text-xs text-center text-zinc-600">
              Password protected. Only authorized users can access.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-zinc-600 text-sm mt-6">
          © {new Date().getFullYear()} James OS
        </p>
      </div>
    </div>
  );
}
