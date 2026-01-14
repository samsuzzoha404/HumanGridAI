import { motion } from 'framer-motion';
import { Wallet, CheckCircle, ArrowUpRight, ArrowDownLeft, ExternalLink, Copy, Shield } from 'lucide-react';
import { Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface WalletViewProps {
  totalEarnings: number;
  transactions: Transaction[];
}

export function WalletView({ totalEarnings, transactions }: WalletViewProps) {
  const walletAddress = '0x7a9F...4b2C';
  const fullAddress = '0x7a9F8d2E1c3B5a6F0e9D8c7B6a5F4e3D2c1B0a9F4b2C';

  const copyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    toast.success('Wallet address copied!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">Arc Wallet</h2>
        <p className="text-sm text-muted-foreground">Manage your earnings and transactions</p>
      </motion.div>

      {/* Bento Grid for Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Connection Status Card - 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-item p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Wallet className="w-7 h-7 text-foreground" />
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
          <div className="p-5 rounded-xl bg-gradient-to-br from-muted/60 to-muted/30 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl lg:text-5xl font-bold text-gradient-success font-mono-data">
                ${totalEarnings.toFixed(2)}
              </span>
              <span className="text-lg text-muted-foreground">USDC</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <Button variant="outline" size="lg" className="gap-2">
              <ArrowDownLeft className="w-4 h-4" />
              Deposit
            </Button>
            <Button variant="gradient" size="lg" className="gap-2">
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
          className="bento-item p-6 flex flex-col justify-between"
        >
          <div>
            <h4 className="text-sm text-muted-foreground mb-3">This Month</h4>
            <p className="text-3xl font-bold text-foreground font-mono-data">$127.50</p>
            <p className="text-sm text-success mt-1">+23% from last month</p>
          </div>
          <div className="pt-4 border-t border-border/30 mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Tasks</span>
              <span className="font-medium font-mono-data">847</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
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
          <div className="p-4 lg:p-5 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Transaction History</h3>
            <button className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
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
                className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors"
              >
                <div className={`p-2.5 rounded-xl ${
                  tx.type === 'earning' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {tx.type === 'earning' 
                    ? <ArrowDownLeft className="w-4 h-4" />
                    : <ArrowUpRight className="w-4 h-4" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground font-mono-data">
                    {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                  </p>
                </div>
                <span className={`font-semibold font-mono-data ${
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
