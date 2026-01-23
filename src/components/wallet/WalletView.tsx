'use client';

import { motion } from 'framer-motion';
import { Wallet, CheckCircle, ArrowUpRight, ArrowDownLeft, ExternalLink, Copy, Shield } from 'lucide-react';
import { Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface WalletViewProps {
  totalEarnings: number;
  transactions: Transaction[];
}

export function WalletView({ totalEarnings, transactions }: WalletViewProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [fullAddress, setFullAddress] = useState('');

  useEffect(() => {
    // Get wallet address from localStorage
    const address = localStorage.getItem("wallet_address");
    if (address) {
      setFullAddress(address);
      // Format address for display (0x1234...5678)
      const shortened = `${address.slice(0, 6)}...${address.slice(-4)}`;
      setWalletAddress(shortened);
    } else {
      setWalletAddress('0x7a9F...4b2C');
      setFullAddress('0x7a9F8d2E1c3B5a6F0e9D8c7B6a5F4e3D2c1B0a9F4b2C');
    }
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    toast.success('Wallet address copied!');
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Arc Wallet</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Manage your earnings and transactions</p>
      </motion.div>

      {/* Bento Grid for Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {/* Connection Status Card - 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-item p-5 sm:p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-foreground">Circle Wallet</h3>
                  <Badge variant="success" className="gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
                    </span>
                    Connected
                  </Badge>
                </div>
                <button 
                  onClick={copyAddress}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mt-1 font-mono-data"
                >
                  {walletAddress}
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4 text-success" />
              Secured by Arc
            </div>
          </div>

          {/* Balance */}
          <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-muted/60 to-muted/30 border border-border/50">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">Available Balance</p>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-3xl xs:text-4xl sm:text-4xl lg:text-5xl font-bold text-gradient-success font-mono-data">
                ${(totalEarnings || 0).toFixed(2)}
              </span>
              <span className="text-base sm:text-lg text-muted-foreground">USDC</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-4 sm:mt-5">
            <Button variant="outline" size="lg" className="gap-1.5 sm:gap-2 text-sm sm:text-base h-10 sm:h-11">
              <ArrowDownLeft className="w-4 h-4" />
              Deposit
            </Button>
            <Button variant="gradient" size="lg" className="gap-1.5 sm:gap-2 text-sm sm:text-base h-10 sm:h-11">
              <ArrowUpRight className="w-4 h-4" />
              Withdraw
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bento-item p-5 sm:p-6 flex flex-col justify-between"
        >
          <div>
            <h4 className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">This Month</h4>
            <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono-data">$127.50</p>
            <p className="text-xs sm:text-sm text-success mt-1">+23% from last month</p>
          </div>
          <div className="pt-3 sm:pt-4 border-t border-border/30 mt-3 sm:mt-4">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Total Tasks</span>
              <span className="font-medium font-mono-data">847</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm mt-1.5 sm:mt-2">
              <span className="text-muted-foreground">Avg/Task</span>
              <span className="font-medium font-mono-data text-success">$0.15</span>
            </div>
          </div>
        </motion.div>

        {/* Transaction History - Full width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bento-item overflow-hidden lg:col-span-3"
        >
          <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Transaction History</h3>
            <button className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              View All <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-border/30">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * index }}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/20 transition-colors"
              >
                <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${
                  tx.type === 'earning' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {tx.type === 'earning' 
                    ? <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    : <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">{tx.description}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-mono-data">
                    {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                  </p>
                </div>
                <span className={`text-sm sm:text-base font-semibold font-mono-data ${
                  tx.type === 'earning' ? 'text-success' : 'text-foreground'
                }`}>
                  {tx.type === 'earning' ? '+' : '-'}${tx.amount.toFixed(2)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
