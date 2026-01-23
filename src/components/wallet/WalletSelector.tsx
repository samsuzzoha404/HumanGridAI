"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, X } from "lucide-react";
import { onProviderDiscovered, getInjectedProviders } from "@/lib/wallet";

interface WalletSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectWallet: (provider?: any) => void;
}

export function WalletSelector({
  open,
  onOpenChange,
  onSelectWallet,
}: WalletSelectorProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [hasBrowserWallet, setHasBrowserWallet] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check for standard injected wallet (e.g. single MetaMask)
    setHasBrowserWallet(!!window.ethereum);

    // Initial check for EIP-6963 wallets
    setProviders(getInjectedProviders());

    // Listen for new ones
    const unsubscribe = onProviderDiscovered((newProvider) => {
      setProviders((prev) => {
        if (prev.some((p) => p.info.uuid === newProvider.info.uuid)) return prev;
        return [...prev, newProvider];
      });
    });

    return () => unsubscribe();
  }, []);

  const handleSelect = (provider?: any) => {
    onOpenChange(false);
    onSelectWallet(provider);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/50 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Choose Your Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {/* EIP-6963 Detected Wallets */}
          {providers.map((p) => (
            <Button
              key={p.info.uuid}
              variant="outline"
              className="h-16 justify-between px-4 border-2 hover:border-primary/50 hover:bg-muted/50 transition-all font-semibold"
              onClick={() => handleSelect(p.provider)}
            >
              <div className="flex items-center gap-3">
                <img src={p.info.icon} alt={p.info.name} className="w-8 h-8 rounded-lg" />
                <span className="text-lg">{p.info.name}</span>
              </div>
              <div className="bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-full">
                DETECTED
              </div>
            </Button>
          ))}

          {/* Standard Fallback (MetaMask etc if not announcing) */}
          {hasBrowserWallet && providers.length === 0 && (
            <Button
              variant="outline"
              className="h-16 justify-between px-4 border-2 hover:border-primary/50 hover:bg-muted/50 transition-all font-semibold"
              onClick={() => handleSelect()}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                   <Wallet className="w-5 h-5 text-orange-500" />
                </div>
                <span className="text-lg">Browser Wallet</span>
              </div>
               <div className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">
                INSTALLED
              </div>
            </Button>
          )}
          
          {/* Empty State / Install Links */}
          {!hasBrowserWallet && providers.length === 0 && (
             <div className="text-center py-6 text-muted-foreground">
                <p>No wallet detected.</p>
                <div className="mt-4 flex gap-2 justify-center">
                    <Button variant="link" size="sm" asChild>
                        <a href="https://metamask.io/download/" target="_blank">Install MetaMask</a>
                    </Button>
                    <Button variant="link" size="sm" asChild>
                         <a href="https://phantom.app/" target="_blank">Install Phantom</a>
                    </Button>
                </div>
             </div>
          )}

          {/* WalletConnect Placeholder */}
          <Button
            variant="ghost"
            disabled
            className="h-14 justify-start px-4 opacity-50 cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-lg">🔗</span>
               </div>
               <div className="flex flex-col items-start">
                 <span>WalletConnect</span>
                 <span className="text-[10px] text-muted-foreground">Coming Soon</span>
               </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
