import { Brain } from "lucide-react";
import { useInterviewStore } from "@/stores/interview.store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { deriveBrainMode } from "@/lib/brain-mode";

interface AnimatedBrainProps {
  className?: string;
}

const GRADIENT_ID = "brain-bloom-gradient";

const SYNAPSES: { x: number; y: number; r: number; delay: number }[] = [
  { x: 7.0, y: 8.0, r: 0.5, delay: -0.3 },
  { x: 5.8, y: 11.0, r: 0.45, delay: -2.1 },
  { x: 7.6, y: 13.5, r: 0.6, delay: -3.4 },
  { x: 8.8, y: 7.0, r: 0.45, delay: -1.2 },
  { x: 9.6, y: 10.2, r: 0.55, delay: -4.6 },
  { x: 17.0, y: 8.0, r: 0.5, delay: -1.8 },
  { x: 18.2, y: 11.0, r: 0.45, delay: -0.9 },
  { x: 16.4, y: 13.5, r: 0.6, delay: -3.9 },
  { x: 15.2, y: 7.0, r: 0.45, delay: -2.7 },
  { x: 14.4, y: 10.2, r: 0.55, delay: -5.1 },
  { x: 12.0, y: 15.2, r: 0.5, delay: -1.5 },
  { x: 12.0, y: 17.6, r: 0.45, delay: -3.0 },
];

export function AnimatedBrain({ className }: AnimatedBrainProps) {
  const mode = useInterviewStore((s) =>
    deriveBrainMode(s.session, s.isAgentTyping, s.isLoading, Boolean(s.feedback))
  );
  const prefersReducedMotion = useReducedMotion();

  const staticMode = prefersReducedMotion ? "static" : mode;

  return (
    <span
      className={cn("brain-animated", className)}
      data-mode={staticMode}
      aria-hidden="true"
    >
      <Brain className="h-5 w-5" />
      {!prefersReducedMotion && (
        <svg
          viewBox="0 0 24 24"
          className="brain-overlay"
          fill="none"
        >
          <defs>
            <radialGradient id={GRADIENT_ID} cx="50%" cy="42%" r="60%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#D4AF37" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </radialGradient>
          </defs>

          <path
            className="brain-hemisphere"
            d="M12 5.2 C 10.9 4.9, 9.4 4.85, 8.1 5.25 C 6.2 5.8, 4.6 7.2, 3.9 9.1 C 3.4 10.4, 3.4 12.2, 4 13.6 C 4.7 15.3, 6 16.6, 7.6 17.3 C 8.9 17.85, 10.5 18.05, 11.5 17.6 C 11.9 17.4, 12 17.2, 12 17 Z"
            fill="#D4AF37"
          />
          <path
            className="brain-hemisphere"
            d="M12 5.2 C 13.1 4.9, 14.6 4.85, 15.9 5.25 C 17.8 5.8, 19.4 7.2, 20.1 9.1 C 20.6 10.4, 20.6 12.2, 20 13.6 C 19.3 15.3, 18 16.6, 16.4 17.3 C 15.1 17.85, 13.5 18.05, 12.5 17.6 C 12.1 17.4, 12 17.2, 12 17 Z"
            fill="#D4AF37"
          />

          <circle
            className="brain-bloom"
            cx="12"
            cy="11.5"
            r="8.5"
            fill={`url(#${GRADIENT_ID})`}
          />
          <circle
            className="brain-sweep"
            cx="12"
            cy="11.5"
            r="9"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="0.45"
          />

          <g className="brain-synapses">
            {SYNAPSES.map((point, i) => (
              <circle
                key={i}
                className="brain-synapse"
                cx={point.x}
                cy={point.y}
                r={point.r}
                fill="#FFDF7E"
                style={{ animationDelay: `${point.delay}s` }}
              />
            ))}
          </g>
        </svg>
      )}
    </span>
  );
}
