import { createTheme } from '@mui/material/styles';

// Tema dark minimalista y eficiente
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4aa',
      light: '#4fc3f7',
      dark: '#00695c',
    },
    secondary: {
      main: '#ff6b35',
      light: '#ff9800',
      dark: '#d84315',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
    divider: '#333333',
    action: {
      hover: 'rgba(255, 255, 255, 0.08)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '1.75rem',
      marginBottom: '1rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
      marginBottom: '0.75rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      marginBottom: '0.5rem',
    },
    body1: {
      fontSize: '0.9rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.8rem',
      lineHeight: 1.4,
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0a0a',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#1a1a1a',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#333333',
            borderRadius: '4px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #00d4aa, #4fc3f7)',
          color: '#000',
          fontWeight: 600,
        },
        outlined: {
          borderColor: '#333333',
          '&:hover': {
            borderColor: '#00d4aa',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          borderRadius: 12,
          border: '1px solid #333333',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px rgba(0, 212, 170, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          borderRadius: 12,
          border: '1px solid #333333',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a1a1a',
          borderRadius: 16,
          border: '1px solid #333333',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #333333',
        },
        indicator: {
          background: 'linear-gradient(45deg, #00d4aa, #4fc3f7)',
          height: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9rem',
          minWidth: 'auto',
          padding: '12px 16px',
          '&.Mui-selected': {
            color: '#00d4aa',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#0f0f0f',
            '& fieldset': {
              borderColor: '#333333',
            },
            '&:hover fieldset': {
              borderColor: '#555555',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00d4aa',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #333333',
          padding: '8px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#0f0f0f',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.75rem',
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundColor: 'rgba(0, 212, 170, 0.2)',
          color: '#00d4aa',
          border: '1px solid rgba(0, 212, 170, 0.3)',
        },
        colorSecondary: {
          backgroundColor: 'rgba(255, 107, 53, 0.2)',
          color: '#ff6b35',
          border: '1px solid rgba(255, 107, 53, 0.3)',
        },
      },
    },
  },
});

// Tema por defecto (dark)
export const theme = darkTheme;