import { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  TextField,
  Paper,
  Chip,
  Container,
  Divider,
  Fade,
  Zoom
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import GoogleDriveIntegration from './GoogleDriveIntegration';
import { convertMultipleImages } from '../utils/imageConverter';

const ImageConverter = () => {
  const [files, setFiles] = useState([]);
  const [uploadMethod, setUploadMethod] = useState(0);
  const [targetFormat, setTargetFormat] = useState('png');
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [imageUrl, setImageUrl] = useState('');
  const [validationError, setValidationError] = useState('');
  const [conversionProgress, setConversionProgress] = useState(0);

  // Available formats for conversion
  const formats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];

  // Handle file selection
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    // Validate files (only images)
    const validFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== selectedFiles.length) {
      setNotification({
        open: true,
        message: 'Some files were skipped because they are not images.',
        severity: 'warning'
      });
    }
    
    if (validFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
    }
  };

  // Handle files selected from Google Drive
  const handleGoogleDriveFiles = (selectedFiles) => {
    // Validate files (only images)
    const validFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== selectedFiles.length) {
      setNotification({
        open: true,
        message: 'Some files were skipped because they are not images.',
        severity: 'warning'
      });
    }
    
    if (validFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      
      setNotification({
        open: true,
        message: `${validFiles.length} image(s) added from Google Drive.`,
        severity: 'success'
      });
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    
    if (event.dataTransfer.files) {
      const droppedFiles = Array.from(event.dataTransfer.files);
      
      // Validate files (only images)
      const validFiles = droppedFiles.filter(file => file.type.startsWith('image/'));
      
      if (validFiles.length !== droppedFiles.length) {
        setNotification({
          open: true,
          message: 'Some files were skipped because they are not images.',
          severity: 'warning'
        });
      }
      
      if (validFiles.length > 0) {
        setFiles(prevFiles => [...prevFiles, ...validFiles]);
      }
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  // Remove file from selection
  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
    setConvertedFiles([]);
    setConversionProgress(0);
  };

  // Handle format change
  const handleFormatChange = (event) => {
    setTargetFormat(event.target.value);
  };

  // Handle tab change for upload method
  const handleTabChange = (event, newValue) => {
    setUploadMethod(newValue);
    clearFiles();
    setImageUrl('');
    setValidationError('');
  };

  // Handle URL input change
  const handleUrlChange = (event) => {
    setImageUrl(event.target.value);
    setValidationError('');
  };

  // Validate and add URL image
  const addUrlImage = async () => {
    if (!imageUrl) {
      setValidationError('Please enter a URL');
      return;
    }

    // Basic URL validation
    if (!imageUrl.match(/^(http|https):\/\/[^ "]+$/)) {
      setValidationError('Please enter a valid URL');
      return;
    }

    try {
      // Check if URL points to an image
      const response = await fetch(imageUrl, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.startsWith('image/')) {
        setValidationError('URL does not point to a valid image');
        return;
      }

      // Create a file object from the URL
      const filename = imageUrl.split('/').pop() || 'image';
      
      // Fetch the image
      const imgResponse = await fetch(imageUrl);
      const blob = await imgResponse.blob();
      
      // Create a File object
      const file = new File([blob], filename, { type: contentType });
      
      setFiles(prevFiles => [...prevFiles, file]);
      setImageUrl('');
      
      setNotification({
        open: true,
        message: 'Image added successfully!',
        severity: 'success'
      });
    } catch (error) {
      setValidationError('Failed to fetch image from URL');
      console.error('Error fetching image:', error);
    }
  };

  // Convert files
  const convertFiles = async () => {
    if (files.length === 0) {
      setNotification({
        open: true,
        message: 'Please select at least one image to convert.',
        severity: 'warning'
      });
      return;
    }

    setIsConverting(true);
    setConvertedFiles([]);
    setConversionProgress(0);
    
    try {
      // Process files in batches to avoid overwhelming the browser
      const batchSize = 5;
      const totalFiles = files.length;
      const convertedResults = [];
      
      for (let i = 0; i < totalFiles; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchResults = await convertMultipleImages(batch, targetFormat);
        convertedResults.push(...batchResults);
        
        // Update progress
        setConversionProgress(Math.round(((i + batch.length) / totalFiles) * 100));
      }
      
      setConvertedFiles(convertedResults);
      setConversionProgress(100);
      
      setNotification({
        open: true,
        message: 'Conversion completed successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error during conversion:', error);
      
      setNotification({
        open: true,
        message: 'An error occurred during conversion. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsConverting(false);
    }
  };

  // Download converted files
  const downloadFiles = async () => {
    if (convertedFiles.length === 0) {
      return;
    }
    
    if (convertedFiles.length === 1) {
      // Download single file
      saveAs(convertedFiles[0].file, convertedFiles[0].name);
      
      setNotification({
        open: true,
        message: 'Download started!',
        severity: 'info'
      });
    } else {
      // Download multiple files as a zip
      const zip = new JSZip();
      
      // Add each file to the zip
      convertedFiles.forEach(file => {
        zip.file(file.name, file.file);
      });
      
      try {
        // Generate the zip file
        const content = await zip.generateAsync({ type: 'blob' });
        
        // Download the zip file
        saveAs(content, `converted_images_${targetFormat}.zip`);
        
        setNotification({
          open: true,
          message: 'Download started!',
          severity: 'info'
        });
      } catch (error) {
        console.error('Error creating zip file:', error);
        
        setNotification({
          open: true,
          message: 'Failed to create download package.',
          severity: 'error'
        });
      }
    }
  };

  // Handle notification close
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Clean up object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      convertedFiles.forEach(file => {
        if (file.url) URL.revokeObjectURL(file.url);
      });
    };
  }, [convertedFiles]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} className="card" sx={{ p: { xs: 2, sm: 4 }, mb: 4 }}>
        <Tabs 
          value={uploadMethod} 
          onChange={handleTabChange} 
          centered 
          sx={{ 
            mb: 4,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
          variant="fullWidth"
        >
          <Tab 
            label="Local Upload" 
            icon={<CloudUploadIcon />} 
            iconPosition="start"
            sx={{ fontWeight: 500 }}
          />
          <Tab 
            label="Google Drive" 
            icon={<DriveFileRenameOutlineIcon />} 
            iconPosition="start"
            sx={{ fontWeight: 500 }}
          />
          <Tab 
            label="URL" 
            icon={<LinkIcon />} 
            iconPosition="start"
            sx={{ fontWeight: 500 }}
          />
        </Tabs>

        <Fade in={true} timeout={500}>
          <Box>
            {uploadMethod === 0 && (
              <Box>
                <Box
                  className="dropzone"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom fontWeight={500}>
                    Drag & Drop Images Here
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    or click to browse files
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    Supports bulk upload of multiple images
                  </Typography>
                </Box>
              </Box>
            )}

            {uploadMethod === 1 && (
              <GoogleDriveIntegration onFilesSelected={handleGoogleDriveFiles} />
            )}

            {uploadMethod === 2 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h5" gutterBottom fontWeight={500}>
                  Upload from URL
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    label="Image URL"
                    variant="outlined"
                    fullWidth
                    value={imageUrl}
                    onChange={handleUrlChange}
                    error={!!validationError}
                    helperText={validationError}
                    sx={{ maxWidth: 500 }}
                  />
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={addUrlImage}
                    startIcon={<LinkIcon />}
                    className="btn-animated"
                    sx={{ mt: { xs: 2, sm: 0 }, minWidth: { xs: '100%', sm: 'auto' } }}
                  >
                    Add Image
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Enter the direct URL to an image file (e.g., https://example.com/image.jpg)
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>

        {files.length > 0 && (
          <Fade in={true} timeout={800}>
            <Box sx={{ mt: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={500} sx={{ display: 'flex', alignItems: 'center' }}>
                  <ImageIcon sx={{ mr: 1 }} />
                  Selected Images ({files.length})
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error" 
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={clearFiles}
                  className="btn-animated"
                >
                  Clear All
                </Button>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Box className="preview-container fade-in">
                {files.map((file, index) => (
                  <Zoom in={true} key={index} style={{ transitionDelay: `${index * 50}ms` }}>
                    <Paper elevation={2} sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
                      <Box className="preview-item">
                        <img src={URL.createObjectURL(file)} alt={file.name} />
                        <Box 
                          className="remove-button"
                          onClick={() => removeFile(index)}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{ p: 1, display: 'block', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {file.name}
                      </Typography>
                    </Paper>
                  </Zoom>
                ))}
              </Box>

              <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight={500}>
                  Conversion Options
                </Typography>
                
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="format-select-label">Target Format</InputLabel>
                      <Select
                        labelId="format-select-label"
                        value={targetFormat}
                        label="Target Format"
                        onChange={handleFormatChange}
                      >
                        {formats.map((format) => (
                          <MenuItem key={format} value={format}>{format.toUpperCase()}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={convertFiles}
                      disabled={isConverting || files.length === 0}
                      startIcon={isConverting ? <CircularProgress size={24} color="inherit" /> : null}
                      className="btn-animated"
                      sx={{ height: '56px' }}
                    >
                      {isConverting ? (
                        <>
                          Converting...
                          <Box sx={{ ml: 1 }}>({conversionProgress}%)</Box>
                        </>
                      ) : (
                        'Convert Images'
                      )}
                    </Button>
                    
                    {isConverting && (
                      <Box className="progress-bar-container" sx={{ mt: 1 }}>
                        <Box 
                          className="progress-bar" 
                          sx={{ width: `${conversionProgress}%` }}
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Fade>
        )}
      </Paper>

      {convertedFiles.length > 0 && (
        <Fade in={true} timeout={1000}>
          <Paper elevation={3} className="card" sx={{ p: { xs: 2, sm: 4 } }}>
            <Typography variant="h5" gutterBottom fontWeight={500} sx={{ display: 'flex', alignItems: 'center' }}>
              <DownloadIcon sx={{ mr: 1 }} />
              Converted Images ({convertedFiles.length})
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box className="preview-container fade-in">
              {convertedFiles.map((file, index) => (
                <Zoom in={true} key={index} style={{ transitionDelay: `${index * 50}ms` }}>
                  <Paper elevation={2} sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
                    <Box className="preview-item">
                      <img src={file.url} alt={file.name} />
                      <Chip 
                        label={file.format.toUpperCase()} 
                        size="small" 
                        color="primary" 
                        sx={{ position: 'absolute', bottom: 5, right: 5 }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ p: 1, display: 'block', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                      {file.name}
                    </Typography>
                  </Paper>
                </Zoom>
              ))}
            </Box>

            <Button
              variant="contained"
              color="secondary"
              fullWidth
              sx={{ mt: 4 }}
              onClick={downloadFiles}
              startIcon={<DownloadIcon />}
              className="btn-animated"
              size="large"
            >
              Download {convertedFiles.length > 1 ? 'All as ZIP' : 'Image'}
            </Button>
          </Paper>
        </Fade>
      )}

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Fade}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ImageConverter;
