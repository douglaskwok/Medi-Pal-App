export const Theme = {
  colors: {
    primary: "#78C7FF", // Main blue for accents 78C7FF
    primaryDark: "#408fc7ff",
    primaryLight: "#9DD5FF",
    secondary: "#B8E0FF", // Medium blue for subtle elements
    background: "#E1F2FF", // Light sky blue background
    backgroundLight: "#FFFFFF", // White for cards
    text: "#0F172A", // Primary text - very dark slate
    textSecondary: "#334155", // Secondary text - medium slate
    textLight: "#64748B",
    border: "#A8D5FF", // Light blue border color
    borderLight: "#D4E9FF",
    success: "#22C55E", // Green for success states
    error: "#EF4444",
    warning: "#FBBF24", // Golden color
    gold: "#FBBF24",
    muted: "#475569", // Muted text color
    navy: "#1E3A8A", // Navy dark blue
    aiBlue: "#4A90E2", // Vibrant blue for AI
    gradient: {
      skyBlue: {
        start: "#78C7FF", // Primary (darkest blue)
        middle: "#B8E0FF", // Secondary (medium blue)
        end: "#E1F2FF", // Background (lightest blue)
      },
    },
  },
  fonts: {
    regular: "System",
    medium: "System",
    semibold: "System",
    bold: "System",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};
