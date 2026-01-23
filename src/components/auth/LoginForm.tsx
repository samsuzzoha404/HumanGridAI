"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signInWithEmail, signUpWithEmail } from "@/lib/auth";
import { toast } from "sonner";
import { Wallet, Mail } from "lucide-react";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      toast.success("Welcome back!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signUpWithEmail(email, password);
      toast.success("Account created! Please check your email to verify.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!walletAddress || walletAddress.length < 10) {
        alert("Please enter a valid wallet address");
        setLoading(false);
        return;
      }

      // Store wallet connection in localStorage
      localStorage.setItem("wallet_address", walletAddress);
      localStorage.setItem("wallet_connected", "true");

      toast.success("Connected! Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error: any) {
      toast.error(error.message || "Failed to connect wallet");
      setLoading(false);
    }
  };

  const handleMetaMaskConnect = async () => {
    setLoading(true);

    try {
      console.log("Starting wallet connection...");

      // Check if wallet exists
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        setLoading(false);
        return;
      }

      // Request accounts from MetaMask
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const address = accounts[0];
      console.log("Connected wallet:", address);

      // Store wallet connection in localStorage
      localStorage.setItem("wallet_address", address);
      localStorage.setItem("wallet_connected", "true");

      toast.success("Wallet Connected! Redirecting...");

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error: any) {
      console.error("Error:", error);
      alert("Connection failed: " + error.message);
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome to HumanGridAI</CardTitle>
        <CardDescription>
          Sign in to start earning by completing AI tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wallet">
              <Wallet className="w-4 h-4 mr-2" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-4">
            <div className="space-y-4">
              <Button
                onClick={handleMetaMaskConnect}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Connecting..." : "Connect Wallet"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or enter wallet address
                  </span>
                </div>
              </div>

              <form onSubmit={handleWalletSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wallet">Wallet Address</Label>
                  <Input
                    id="wallet"
                    placeholder="0x..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Connecting..." : "Connect Wallet"}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="email">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="worker@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="worker@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardFooter>
    </Card>
  );
}
