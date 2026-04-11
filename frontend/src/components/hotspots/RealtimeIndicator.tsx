import { motion } from 'framer-motion';
import { Wifi } from 'lucide-react';

interface RealtimeIndicatorProps {
  connected: boolean;
}

export function RealtimeIndicator({ connected }: RealtimeIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a25] border border-[#2a2a3a]">
      <div className="relative">
        <motion.div
          className={`w-2 h-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`}
          animate={
            connected
              ? {
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        />
        {connected && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-green-500"
              animate={{ scale: [1, 2], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-green-500"
              animate={{ scale: [1, 2], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
          </>
        )}
      </div>
      <Wifi className={`w-3 h-3 ${connected ? 'text-green-500' : 'text-red-500'}`} />
      <span className={`text-xs ${connected ? 'text-green-500' : 'text-red-500'}`}>
        {connected ? '实时连接' : '连接断开'}
      </span>
    </div>
  );
}
