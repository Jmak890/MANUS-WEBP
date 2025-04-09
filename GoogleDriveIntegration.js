// Google Drive API integration for the Image Converter App
import { useEffect, useState } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';

// Import Google Drive configuration
import GOOGLE_DRIVE_CONFIG from '../config/googleDriveConfig';

// Google API credentials from config
const CLIENT_ID = GOOGLE_DRIVE_CONFIG.CLIENT_ID;
const API_KEY = GOOGLE_DRIVE_CONFIG.API_KEY;
const DISCOVERY_DOCS = GOOGLE_DRIVE_CONFIG.DISCOVERY_DOCS;
const SCOPES = GOOGLE_DRIVE_CONFIG.SCOPES;

const GoogleDriveIntegration = ({ onFilesSelected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gapi, setGapi] = useState(null);

  // Load the Google API client library
  useEffect(() => {
    // Load the Google API client library script
    const loadGoogleApi = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', initClient);
      };
      script.onerror = () => {
        console.error('Failed to load Google API script');
      };
      document.body.appendChild(script);
    };

    // Initialize the Google API client
    const initClient = () => {
      window.gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      }).then(() => {
        setGapi(window.gapi);
        
        // Listen for sign-in state changes
        window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        
        // Handle the initial sign-in state
        updateSigninStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
      }).catch(error => {
        console.error('Error initializing Google API client:', error);
      });
    };

    // Update the sign-in status
    const updateSigninStatus = (isSignedIn) => {
      setIsAuthenticated(isSignedIn);
    };

    // Load the Google API client library
    loadGoogleApi();

    // Clean up
    return () => {
      const scriptTag = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
      if (scriptTag) {
        document.body.removeChild(scriptTag);
      }
    };
  }, []);

  // Handle sign-in
  const handleSignIn = () => {
    if (gapi) {
      gapi.auth2.getAuthInstance().signIn();
    }
  };

  // Handle sign-out
  const handleSignOut = () => {
    if (gapi) {
      gapi.auth2.getAuthInstance().signOut();
    }
  };

  // Open the Google Drive picker
  const openPicker = () => {
    setIsLoading(true);

    // Load the picker API
    const loadPickerApi = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js?onload=onPickerApiLoad';
      script.onload = createPicker;
      document.body.appendChild(script);
    };

    // Create and render the picker
    const createPicker = () => {
      if (gapi) {
        const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
        
        // Load the picker API
        gapi.load('picker', () => {
          const picker = new window.google.picker.PickerBuilder()
            .addView(window.google.picker.ViewId.DOCS_IMAGES)
            .setOAuthToken(token)
            .setDeveloperKey(API_KEY)
            .setCallback(pickerCallback)
            .build();
          
          picker.setVisible(true);
          setIsLoading(false);
        });
      }
    };

    // Handle picker callback
    const pickerCallback = async (data) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const fileIds = data.docs.map(doc => doc.id);
        
        // Get file metadata and content
        const files = await Promise.all(fileIds.map(async (fileId) => {
          // Get file metadata
          const metadataResponse = await gapi.client.drive.files.get({
            fileId: fileId,
            fields: 'name,mimeType'
          });
          
          const metadata = metadataResponse.result;
          
          // Get file content
          const contentResponse = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
          });
          
          // Convert the response to a blob
          const blob = new Blob([contentResponse.body], { type: metadata.mimeType });
          
          // Create a File object
          return new File([blob], metadata.name, { type: metadata.mimeType });
        }));
        
        // Pass the files to the parent component
        onFilesSelected(files);
      }
      
      setIsLoading(false);
    };

    // Load the picker API
    loadPickerApi();
  };

  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h6" gutterBottom>
        Google Drive Integration
      </Typography>
      
      {!isAuthenticated ? (
        <>
          <Typography variant="body2" color="text.secondary" paragraph>
            Connect to your Google Drive to select images
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<DriveFileRenameOutlineIcon />}
            onClick={handleSignIn}
            disabled={isLoading || !gapi}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Connect to Google Drive'}
          </Button>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" paragraph>
            You're connected to Google Drive. Select images to convert.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={openPicker}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Select Images from Drive'}
            </Button>
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={handleSignOut}
              disabled={isLoading}
            >
              Disconnect
            </Button>
          </Box>
        </>
      )}
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Note: This is a demo implementation. In a production app, you would need to register your app with Google and get proper API credentials.
      </Typography>
    </Box>
  );
};

export default GoogleDriveIntegration;
