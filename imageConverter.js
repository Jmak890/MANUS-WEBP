// Image conversion utilities using browser-image-compression
import imageCompression from 'browser-image-compression';

// Function to convert image to specified format
export const convertImage = async (file, targetFormat) => {
  try {
    // First compress the image to make processing faster
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 1,
      useWebWorker: true,
    });

    // Create a canvas to draw the image
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Create a promise to handle the image loading
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0);
        
        // Convert to desired format
        let mimeType;
        switch (targetFormat.toLowerCase()) {
          case 'png':
            mimeType = 'image/png';
            break;
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          case 'gif':
            mimeType = 'image/gif';
            break;
          case 'bmp':
            mimeType = 'image/bmp';
            break;
          default:
            mimeType = 'image/png';
        }
        
        // Get the data URL from canvas
        const dataUrl = canvas.toDataURL(mimeType);
        
        // Convert data URL to Blob
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            // Create a new File object with the correct format
            const fileName = file.name.split('.')[0] + '.' + targetFormat.toLowerCase();
            const convertedFile = new File([blob], fileName, { type: mimeType });
            
            resolve({
              file: convertedFile,
              name: fileName,
              url: URL.createObjectURL(convertedFile),
              format: targetFormat.toLowerCase()
            });
          })
          .catch(err => {
            reject(err);
          });
      };
      
      img.onerror = (error) => {
        reject(error);
      };
      
      // Load the image from the file
      img.src = URL.createObjectURL(compressedFile);
    });
  } catch (error) {
    console.error('Error converting image:', error);
    throw error;
  }
};

// Function to convert multiple images
export const convertMultipleImages = async (files, targetFormat) => {
  const convertedFiles = [];
  
  for (const file of files) {
    try {
      const convertedFile = await convertImage(file, targetFormat);
      convertedFiles.push(convertedFile);
    } catch (error) {
      console.error(`Error converting ${file.name}:`, error);
      // Continue with other files even if one fails
    }
  }
  
  return convertedFiles;
};
