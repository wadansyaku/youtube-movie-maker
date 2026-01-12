export interface Theme {
    id: string;
    bg: string;
    text: string;
    accent: string;
    subAccent: string;
    gradient: string;
    font: string;
    captionShadow: string;
}

export const themes: Record<string, Theme> = {
    'medical-dark': {
        id: 'medical-dark',
        bg: '#0f0f1a', // Dark Blue/Black
        text: '#ffffff',
        accent: '#6366f1', // Indigo
        subAccent: '#10b981', // Emerald
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        font: '"M PLUS 1p", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        captionShadow: `
      -2px -2px 0 #000,
       2px -2px 0 #000,
      -2px  2px 0 #000,
       2px  2px 0 #000,
       0 6px 14px rgba(0,0,0,0.6)
    `,
    },
    'medical-light': {
        id: 'medical-light',
        bg: '#f8fafc', // Light Gray/White
        text: '#1e293b', // Slate 800
        accent: '#0ea5e9', // Sky Blue
        subAccent: '#f59e0b', // Amber
        gradient: 'linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)',
        font: '"Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        captionShadow: `
      -2px -2px 0 #fff,  
       2px -2px 0 #fff,
      -2px  2px 0 #fff,
       2px  2px 0 #fff,
       0 2px 4px rgba(0,0,0,0.3)
    `,
    },
    'pop-quiz': {
        id: 'pop-quiz',
        bg: '#fff7ed', // Orange-ish White
        text: '#431407', // Dark Red/Brown
        accent: '#f97316', // Orange
        subAccent: '#ef4444', // Red
        gradient: 'linear-gradient(to right, #ff512f, #dd2476)',
        font: '"M PLUS Rounded 1c", sans-serif',
        captionShadow: `
      -3px -3px 0 #ffffff,  
       3px -3px 0 #ffffff,
      -3px  3px 0 #ffffff,
       3px  3px 0 #ffffff,
       0 4px 0 #000
    `,
    }
};

export const defaultTheme = themes['medical-dark'];
