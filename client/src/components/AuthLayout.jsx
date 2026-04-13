import { motion } from "framer-motion";

function AuthLayout({ children }) {
  const snippets = [
    "function main() {",
    "std::cout <<",
    "def run():",
    "import sys",
    "console.log()",
    "return 0;",
    "std::vector<int>",
  ];

  const floatingParticles = Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    text: snippets[Math.floor(Math.random() * snippets.length)],
    x: Math.random() * 100, // percentage
    yStart: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 15 + Math.random() * 15,
  }));

  return (
    <div className="flex min-h-screen w-full bg-arena-950 font-sans text-paper-100">
    
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden border-r border-white/5 lg:flex">
        
        <div className="absolute -left-[10%] -top-[10%] h-[60%] w-[60%] rounded-full bg-arena-500/20 blur-[120px] mix-blend-screen" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[60%] w-[60%] rounded-full bg-flame-500/15 blur-[120px] mix-blend-screen" />

        
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
          {floatingParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute font-mono text-xs font-bold text-arena-500"
              style={{ left: `${particle.x}%` }}
              initial={{ y: `${particle.yStart}%`, opacity: 0 }}
              animate={{
                y: ["100%", "-20%"],
                opacity: [0, 0.4, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: "linear",
                delay: particle.delay,
              }}
            >
              {particle.text}
            </motion.div>
          ))}
        </div>

     
        <motion.div
          className="relative z-10 flex flex-col items-center text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="mb-6 flex h-36 w-36 items-center justify-center rounded-3xl border border-white/20 bg-white/5 shadow-[0_0_80px_rgba(61,217,184,0.3)] backdrop-blur-xl">
            <span className="bg-gradient-to-br from-arena-400 to-arena-500 bg-clip-text text-5xl font-black text-transparent">
              CA
            </span>
          </div>
          <h1 className="mb-4 text-5xl font-black tracking-tight text-white drop-shadow-[0_0_30px_rgba(61,217,184,0.4)]">
            CodeCamp Arena
          </h1>
          <p className="text-xl font-medium tracking-[0.2em] text-paper-200/80 uppercase">
            Code. Compete. Conquer.
          </p>
        </motion.div>
      </div>

      
      <div className="relative z-10 flex w-full flex-col justify-center px-6 shadow-[-20px_0_40px_rgba(0,0,0,0.3)] lg:w-1/2 lg:px-20 xl:px-32">
       
        <div className="absolute -top-[20%] left-[20%] h-[40%] w-[60%] rounded-full bg-arena-500/10 blur-[100px] lg:hidden" />
        
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
