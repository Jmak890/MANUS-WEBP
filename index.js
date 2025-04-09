import Head from 'next/head';
import { 
  Container, 
  Typography, 
  Box, 
  AppBar,
  Toolbar,
  Button,
  useMediaQuery,
  useTheme,
  Fade
} from '@mui/material';
import ImageConverter from '../components/ImageConverter';
import GitHubIcon from '@mui/icons-material/GitHub';
import ImageIcon from '@mui/icons-material/Image';

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      <Head>
        <title>Image Converter App</title>
        <meta name="description" content="Convert images between different formats with ease" />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <AppBar position="static" elevation={0} sx={{ 
        background: 'linear-gradient(90deg, #3f51b5 0%, #5c6bc0 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <Toolbar>
          <ImageIcon sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Image Converter
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<GitHubIcon />}
            href="https://github.com"
            target="_blank"
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            GitHub
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ my: { xs: 3, md: 5 } }}>
          <Fade in={true} timeout={800}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant={isMobile ? "h4" : "h3"} 
                component="h1" 
                gutterBottom 
                fontWeight={700}
                sx={{ 
                  background: 'linear-gradient(45deg, #3f51b5 30%, #f50057 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Convert Your Images
              </Typography>
              <Typography 
                variant="subtitle1" 
                color="text.secondary" 
                paragraph
                sx={{ maxWidth: 700, mx: 'auto', px: 2 }}
              >
                Upload images, select your desired format, and convert with a single click.
                Supports bulk conversion, Google Drive integration, and multiple formats.
              </Typography>
            </Box>
          </Fade>
          
          <ImageConverter />
          
          <Box sx={{ mt: 6, textAlign: 'center', opacity: 0.7 }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Image Converter App. All rights reserved.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Built with Next.js and Material UI
            </Typography>
          </Box>
        </Box>
      </Container>
    </>
  );
}
