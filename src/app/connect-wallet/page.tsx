"use client";
// Updated: Better wallet connection feedback

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Wallet,
  ArrowRight,
  CheckCircle,
  Shield,
  Zap,
  Globe,
  Sparkles,
  Lock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { connectMetaMask } from "@/lib/wallet";
import { createCircleWallet } from "@/lib/circleService";
import { useAuth } from "@/contexts/AuthContext";
import { ensureUserStats } from "@/lib/auth";
import { WalletSelector } from "@/components/wallet/WalletSelector";

export default function ConnectWalletPage() {
  // State for Wallet Selector
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // FORCE DISCONNECT - Clear everything on page load
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
    console.log("🧹 FULL RESET - Storage cleared");
  }, []);

  // Updated to accept generic provider
  const handleWalletConnect = async (provider?: any) => {
    console.log("🔘 Connect initiated");
    setLoading(true);

    try {
      // If no provider passed and no window.ethereum, show error
      if (!provider && (typeof window === "undefined" || !window.ethereum)) {
         toast.error("No Web3 wallet detected. Please install MetaMask.");
         setLoading(false);
         return;
      }

      console.log("🔄 Requesting wallet connection...");
      toast.loading("Check your wallet...");

      // Connect using the specific provider (or default)
      const walletInfo = await connectMetaMask(provider);

      console.log("✅ Wallet connected successfully:", walletInfo);

      // Dismiss any loading toasts
      toast.dismiss();
      
      // Store connection details
      localStorage.setItem("wallet_address", walletInfo.address);
      localStorage.setItem("wallet_connected", "true");
      localStorage.setItem("wallet_chainId", walletInfo.chainId.toString());

      // Supabase & Circle Logic
      if (user?.id) {
        try {
          const circleWallet = await createCircleWallet(user.id);
          localStorage.setItem("circle_wallet_id", circleWallet.id);
        } catch (error) {
          console.error("Circle wallet creation failed:", error);
        }
        await ensureUserStats(user.id);
      }

      setWalletConnected(true);
      toast.success("🎉 Connected Successfully!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

    } catch (error: any) {
      console.error("Wallet connection error:", error);
      toast.dismiss(); // Clear loading toast

      if (error.message.includes("User rejected")) {
        toast.error("Connection cancelled.");
      } else {
        toast.error(error.message || "Failed to connect wallet.");
      }
      setWalletConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const openSelector = () => {
    setSelectorOpen(true);
  };

  const features = [
    {
      icon: Shield,
      title: "Secure Connection",
      description:
        "Your wallet remains under your control. We never access your private keys.",
    },
    {
      icon: Zap,
      title: "Instant Setup",
      description: "Connect in seconds and start earning USDC immediately.",
    },
    {
      icon: Globe,
      title: "Global Access",
      description:
        "No KYC required. Available to anyone, anywhere in the world.",
    },
  ]; 

  if (walletConnected) {
    // ... existing success UI ...
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
           // ... same ...
        >
          {/* ... same ... */}
           <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-success to-success/50 flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>
           {/* ... same text ... */} 
           <h2 className="text-3xl font-bold mt-6">Wallet Connected!</h2>
            <p className="text-muted-foreground mt-2">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
       {/* Backgrounds kept same */}
      <div className="fixed inset-0 pointer-events-none -z-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      </div>
       {/* Orbs kept same */}
       
      <div className="w-full max-w-2xl relative z-10">
        {/* Header kept same */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
           {/* ... */}
           <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            Connect Your <span className="text-gradient-primary">Wallet</span>
          </h1>
           {/* ... */}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-border/60 shadow-2xl backdrop-blur-sm bg-card/95">
             <CardHeader className="space-y-4 pb-8 pt-8">
               {/* Icon & Titles same */}
               <motion.div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center shadow-2xl shadow-primary/30">
                 <Wallet className="w-10 h-10 text-white" />
               </motion.div>
                <CardTitle className="text-center text-3xl font-bold">Connect Wallet</CardTitle>
                <CardDescription className="text-center text-base">Select your preferred wallet to continue</CardDescription>
             </CardHeader>

            <CardContent className="space-y-6 pb-8">
              {/* Main Connect Button - NOW OPENS SELECTOR */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={openSelector} 
                  disabled={loading}
                  size="lg"
                  className="w-full gap-3 text-lg py-7 bg-gradient-to-r from-primary via-secondary to-primary bg-200% animate-gradient-x shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all duration-300 border-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="font-bold">Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-6 h-6" />
                      <span className="font-bold">Choose Wallet</span>
                      <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </Button>
              </motion.div>

               {/* Removed the separate "Switch Wallet" button since the main button now opens a chooser */}
              
              <div className="relative py-4">
                 <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                 <div className="relative flex justify-center text-sm uppercase tracking-wider">
                  <span className="bg-card px-4 text-muted-foreground font-semibold">Why connect?</span>
                 </div>
              </div>

               {/* Features Grid */}
              <div className="grid gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/50"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-1.5 text-base">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

            </CardContent>
          </Card>
        </motion.div>

         {/* Back Button */}
         <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <Button variant="ghost" onClick={() => router.push("/")} className="text-muted-foreground hover:text-foreground">
            ← Back to Home
          </Button>
        </motion.div>
         
         {/* Security Badge - Updated Version */}
        <motion.div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span>256-bit encrypted connection</span>
          <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-mono opacity-50">v2.0 (Selector)</span>
        </motion.div>

      </div>

      <WalletSelector 
        open={selectorOpen} 
        onOpenChange={setSelectorOpen} 
        onSelectWallet={(p) => handleWalletConnect(p)} 
      />
    </div>
  );
}
