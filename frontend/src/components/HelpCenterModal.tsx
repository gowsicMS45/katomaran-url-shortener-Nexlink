import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";

export function HelpCenterModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-help-center", handleOpen);
    return () => window.removeEventListener("open-help-center", handleOpen);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg rounded-xl glass p-6 ring-soft bg-[#0c0f17]/95 text-foreground shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-neon" />
                <h3 className="text-sm font-semibold">Help & FAQ Center</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 font-normal">
              {[
                {
                  q: "How do I perform Bulk link shortening?",
                  a: "Go to the Links catalog page and click the 'Bulk Import' button. You can type or paste multiple URLs (one per line, optionally separated by commas to add tags) or drag and drop a raw CSV/TXT file. Review the imported links and click Shorten Links to bulk-create them."
                },
                {
                  q: "How does Password Protection work?",
                  a: "When creating or editing a link, configure a password. Visitors attempting to access the short link will see a secure login gate before redirection."
                },
                {
                  q: "What is QR Code History?",
                  a: "Tagging any link with 'qr' automatically moves it to the QR Codes section. From there, you can view its metrics, print the QR, or download it as PNG or SVG."
                },
                {
                  q: "How are click aggregates computed?",
                  a: "Each short-link redirect parses request headers and geo-IP mapping in real-time, creating a Visit record. These records compile into the dashboard charts."
                }
              ].map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div key={idx} className="rounded-lg bg-accent/15 border border-border/40 overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between font-semibold text-xs hover:bg-accent/30 transition cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span className="text-muted-foreground text-[10px]">{isExpanded ? "▲" : "▼"}</span>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3 text-xs text-muted-foreground leading-relaxed border-t border-border/20 pt-2 bg-accent/5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 text-center">
              <p className="text-[10px] text-muted-foreground">
                Running NexLink v1.0.0 (Hackathon Release) · Support is active.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
