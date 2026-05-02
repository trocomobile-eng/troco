import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-gradient-to-br from-white via-troco-sand to-troco-lime/30"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="text-center">
            <motion.img
              src="/logo.png"
              alt="Troco"
              className="h-36 w-auto mx-auto object-contain"
              initial={{ opacity: 0, scale: 0.75, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.7,
                ease: "easeOut",
              }}
            />

            <motion.p
              className="mt-4 text-sm font-medium text-troco-muted"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.35,
                duration: 0.5,
              }}
            >
              Échange intelligent
            </motion.p>

            <motion.div
              className="mt-6 mx-auto h-1.5 w-24 rounded-full bg-white overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-troco-teal to-troco-green rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  delay: 0.6,
                  duration: 0.9,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}