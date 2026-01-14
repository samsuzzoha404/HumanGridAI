import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Globe, Cpu, ArrowRight, Sparkles, Shield, Clock, ChevronDown, Hexagon, Triangle, Box, Layers, Binary, Network, Wallet, Users, BarChart3, Lock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

const mockTransactions = [
  { id: '0x8A92...F3D1', amount: 0.05, task: 'Captcha Solve', time: '2s ago' },
  { id: '0x7B31...A4E2', amount: 0.08, task: 'Sentiment Analysis', time: '5s ago' },
  { id: '0x9C45...B8F7', amount: 0.12, task: 'Image Label', time: '8s ago' },
  { id: '0x6D78...C9A3', amount: 0.03, task: 'Text Verify', time: '12s ago' },
  { id: '0x5E19...D2B8', amount: 0.07, task: 'Audio Check', time: '15s ago' },
  { id: '0x4F82...E1C4', amount: 0.15, task: 'Data Label', time: '18s ago' },
];

const features = [
  {
    icon: Zap,
    title: 'Instant Settlement',
    description: 'Get paid in USDC the moment your task is verified. Zero delays, zero minimums.',
    gradient: 'from-success/20 to-success/5',
    iconColor: 'text-success',
    borderGlow: 'group-hover:shadow-[0_0_40px_-10px_hsl(160_84%_39%/0.5)]',
  },
  {
    icon: Globe,
    title: 'Permissionless Access',
    description: 'No KYC, no interviews. Connect your wallet and start earning globally.',
    gradient: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
    borderGlow: 'group-hover:shadow-[0_0_40px_-10px_hsl(217_91%_60%/0.5)]',
  },
  {
    icon: Cpu,
    title: 'AI-Native Protocol',
    description: 'Purpose-built for autonomous agents. Seamless integration with any LLM.',
    gradient: 'from-secondary/20 to-secondary/5',
    iconColor: 'text-secondary',
    borderGlow: 'group-hover:shadow-[0_0_40px_-10px_hsl(258_90%_66%/0.5)]',
  },
  {
    icon: Lock,
    title: 'Trustless & Secure',
    description: 'Smart contract escrow ensures fair payment. Cryptographically verified results.',
    gradient: 'from-amber-500/20 to-amber-500/5',
    iconColor: 'text-amber-400',
    borderGlow: 'group-hover:shadow-[0_0_40px_-10px_rgba(251,191,36,0.5)]',
  },
  {
    icon: Network,
    title: 'Decentralized Network',
    description: 'No single point of failure. Tasks distributed across the global worker pool.',
    gradient: 'from-cyan-500/20 to-cyan-500/5',
    iconColor: 'text-cyan-400',
    borderGlow: 'group-hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)]',
  },
  {
    icon: BarChart3,
    title: 'Transparent Metrics',
    description: 'On-chain reputation scores. Verifiable earnings history for all workers.',
    gradient: 'from-rose-500/20 to-rose-500/5',
    iconColor: 'text-rose-400',
    borderGlow: 'group-hover:shadow-[0_0_40px_-10px_rgba(251,113,133,0.5)]',
  },
];

const stats = [
  { label: 'Total Volume', value: '$2.4M', suffix: '+', icon: Wallet },
  { label: 'Tasks Completed', value: '847K', suffix: '+', icon: Layers },
  { label: 'Active Workers', value: '12.5K', suffix: '', icon: Users },
  { label: 'AI Integrations', value: '340', suffix: '+', icon: Cpu },
];

const floatingShapes = [
  { icon: Hexagon, delay: 0, duration: 20, x: '10%', y: '20%' },
  { icon: Triangle, delay: 2, duration: 25, x: '85%', y: '15%' },
  { icon: Box, delay: 4, duration: 22, x: '75%', y: '70%' },
  { icon: Hexagon, delay: 1, duration: 18, x: '15%', y: '75%' },
  { icon: Triangle, delay: 3, duration: 23, x: '50%', y: '10%' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 pointer-events-none -z-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      </div>

      {/* Animated Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -50, 100, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[1000px] h-[1000px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(217 91% 60% / 0.15) 0%, transparent 60%)',
            top: '-30%',
            right: '-20%',
            filter: 'blur(120px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, -80, 60, 0],
            y: [0, 80, -40, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(258 90% 66% / 0.2) 0%, transparent 60%)',
            bottom: '-20%',
            left: '-15%',
            filter: 'blur(100px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, 60, -80, 0],
            y: [0, -80, 60, 0],
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(160 84% 39% / 0.12) 0%, transparent 60%)',
            top: '50%',
            left: '40%',
            filter: 'blur(80px)',
          }}
        />
        
        {/* Floating geometric shapes */}
        {floatingShapes.map((shape, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: shape.duration,
              repeat: Infinity,
              delay: shape.delay,
              ease: "easeInOut",
            }}
            className="absolute"
            style={{ left: shape.x, top: shape.y }}
          >
            <shape.icon className="w-12 h-12 text-primary/10" strokeWidth={1} />
          </motion.div>
        ))}
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-4 mt-4">
          <div className="max-w-7xl mx-auto px-6 py-4 rounded-2xl border border-border/50 backdrop-blur-xl bg-background/60">
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center animate-gradient-x bg-200%">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-primary to-secondary opacity-30 blur-lg -z-10" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-foreground leading-tight">HumanGrid AI</span>
                  <span className="text-[10px] font-medium text-muted-foreground tracking-wide">by BlockNexa Labs</span>
                </div>
              </motion.div>
              
              <div className="hidden lg:flex items-center gap-1">
                {['Features', 'How it Works', 'Docs', 'Community'].map((item) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                  >
                    {item}
                  </motion.a>
                ))}
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  className="hidden sm:flex text-muted-foreground hover:text-foreground" 
                  onClick={() => navigate('/app')}
                >
                  Sign In
                </Button>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="gradient" 
                    onClick={() => navigate('/app')} 
                    className="gap-2 shadow-lg shadow-primary/20"
                  >
                    <span className="hidden sm:inline">Launch</span> App
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="max-w-7xl mx-auto text-center">
          {/* Company Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-medium text-success uppercase tracking-wider">Live on Mainnet</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <span className="text-sm text-foreground font-medium">Powered by Arc Blockchain</span>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
          </motion.div>

          {/* Product Name - Large Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center justify-center gap-3 sm:gap-5">
              <motion.h1 
                className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{
                  background: 'linear-gradient(90deg, hsl(217 91% 60%), hsl(258 90% 66%), hsl(160 84% 39%), hsl(217 91% 60%))',
                  backgroundSize: '300% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                HumanGrid
              </motion.h1>
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
                className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gradient-primary"
              >
                AI
              </motion.span>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-sm sm:text-base text-muted-foreground mt-3"
            >
              by <span className="text-foreground font-semibold">BlockNexa Labs</span>
            </motion.p>
          </motion.div>

          {/* Tagline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6"
          >
            The Human Layer for the{' '}
            <span className="relative">
              <span className="text-gradient-primary">AI Economy</span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              />
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Earn <span className="text-success font-semibold">USDC</span> instantly by solving edge-cases for the world's smartest AIs.
            <br className="hidden sm:block" />
            No interviews, no barriers — just connect and earn.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Button 
                size="xl" 
                onClick={() => navigate('/app')}
                className="gap-3 text-lg px-10 py-7 bg-gradient-to-r from-primary via-secondary to-primary bg-200% animate-gradient-x shadow-2xl shadow-primary/30 border-0 text-white font-semibold"
              >
                Start Earning Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Button 
                size="xl" 
                variant="outline"
                className="gap-2 text-lg px-10 py-7 border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50"
              >
                <ExternalLink className="w-5 h-5" />
                Read Docs
              </Button>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Live Transaction Ticker */}
      <section className="py-4 border-y border-border/30 bg-card/20 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none" />
        <div className="relative">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex gap-6 whitespace-nowrap"
          >
            {[...mockTransactions, ...mockTransactions, ...mockTransactions, ...mockTransactions].map((tx, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-xl bg-muted/20 border border-border/30">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="font-mono-data text-xs text-muted-foreground">{tx.id}</span>
                <span className="text-muted-foreground/60">→</span>
                <span className="font-mono-data text-success font-bold">${tx.amount.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">{tx.task}</span>
                <span className="text-xs text-muted-foreground/50">{tx.time}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium text-primary uppercase tracking-widest">Platform Metrics</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">Trusted by Thousands</h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass-card p-6 lg:p-8 text-center group cursor-default"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <motion.div 
                  className="font-mono-data text-3xl lg:text-4xl xl:text-5xl font-bold mb-2"
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                >
                  <span className="text-gradient-primary">{stat.value}</span>
                  <span className="text-primary">{stat.suffix}</span>
                </motion.div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-card/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium text-secondary uppercase tracking-widest">Why BlockNexa</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
              Built for the <span className="text-gradient-primary">Future of Work</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A decentralized protocol connecting human intelligence with AI systems that need it most.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className={`glass-card p-8 group cursor-default transition-all duration-500 ${feature.borderGlow}`}
              >
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} blur-xl opacity-0 group-hover:opacity-50 transition-opacity`} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium text-success uppercase tracking-widest">Getting Started</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3">
              Earn in <span className="text-gradient-primary">3 Simple Steps</span>
            </h2>
          </motion.div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 left-[16%] right-[16%] h-px bg-gradient-to-r from-primary/50 via-secondary/50 to-success/50" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Connect Wallet', description: 'Link your Circle or any USDC-compatible wallet in seconds. No registration needed.', icon: Shield, color: 'primary' },
                { step: '02', title: 'Choose Tasks', description: 'Browse available micro-tasks from AI agents. Pick what interests you.', icon: Cpu, color: 'secondary' },
                { step: '03', title: 'Get Paid Instantly', description: 'Complete tasks and receive USDC directly to your wallet. No delays.', icon: Clock, color: 'success' },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
                  <motion.div 
                    whileHover={{ y: -10 }}
                    className="glass-card p-8 h-full relative overflow-hidden group"
                  >
                    {/* Step number background */}
                    <div className="absolute -top-4 -right-4 font-mono-data text-[120px] font-bold text-muted/20 leading-none select-none">
                      {item.step}
                    </div>
                    
                    <div className="relative z-10">
                      <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`w-14 h-14 rounded-2xl bg-${item.color}/10 border border-${item.color}/20 flex items-center justify-center mb-6`}
                      >
                        <item.icon className={`w-7 h-7 text-${item.color}`} />
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-3 text-foreground">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Animated border */}
            <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-r from-primary via-secondary to-success animate-gradient-x bg-200%">
              <div className="absolute inset-[2px] rounded-[22px] bg-card" />
            </div>
            
            <div className="relative p-10 sm:p-16 text-center">
              {/* Background effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
                >
                  <Zap className="w-10 h-10 text-white" />
                </motion.div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  Ready to Join <span className="text-gradient-primary">HumanGrid</span>?
                </h2>
                <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
                  Start earning USDC today. No experience required — just your human intelligence and a crypto wallet.
                </p>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    size="xl"
                    onClick={() => navigate('/app')}
                    className="gap-3 text-lg px-12 py-7 bg-gradient-to-r from-primary via-secondary to-primary bg-200% animate-gradient-x shadow-2xl shadow-primary/30 border-0 text-white font-semibold"
                  >
                    Launch App Now
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-16 px-4 sm:px-6 lg:px-8 bg-card/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-lg text-foreground">HumanGrid AI</span>
                  <p className="text-xs text-muted-foreground">by BlockNexa Labs</p>
                </div>
              </div>
              <p className="text-muted-foreground max-w-sm mb-6">
                HumanGrid AI — Building the bridge between human intelligence and AI systems. Earn crypto by doing what humans do best.
              </p>
              <div className="flex gap-4">
                {['Twitter', 'Discord', 'GitHub', 'Telegram'].map((social) => (
                  <a 
                    key={social}
                    href="#" 
                    className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <span className="text-xs font-medium">{social[0]}</span>
                  </a>
                ))}
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3 text-muted-foreground">
                {['Features', 'How it Works', 'Pricing', 'API'].map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-foreground transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3 text-muted-foreground">
                {['About', 'Blog', 'Careers', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-foreground transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2026 <span className="text-foreground font-medium">BlockNexa Labs</span>. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
