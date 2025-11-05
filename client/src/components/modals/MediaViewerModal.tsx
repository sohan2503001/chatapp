// client/src/components/modals/MediaViewerModal.tsx
import React from 'react';

interface MediaViewerModalProps {
  mediaType: 'image' | 'video' | 'audio' | string;
  url: string;
  onClose: () => void;
}

const MediaViewerModal: React.FC<MediaViewerModalProps> = ({ mediaType, url, onClose }) => {
  // Stop click from closing modal if clicking on the media itself
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // --- 1. THIS IS THE NEW LINE ---
  // We insert 'fl_attachment' into the URL to force Cloudinary to send it as a download
  const downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={onClose} // Click on the background closes the modal
    >
      {/* Download Button */}
      <a
        // --- 2. THIS LINE IS UPDATED ---
        href={downloadUrl} // Use the new URL that forces download
        download // Keep this, as it suggests a filename
        onClick={handleDownloadClick}
        className="absolute top-5 right-20 text-white p-2 rounded-full hover:bg-black hover:bg-opacity-50"
        title="Download"
      >
        {/* Download SVG Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      </a>

      {/* Close Button (Top Right) */}
      <button
        className="absolute top-4 right-4 text-white text-5xl font-bold"
        onClick={onClose}
      >
        &times;
      </button>

      {/* Media Content */}
      <div 
        className="max-w-4xl max-h-full"
        onClick={handleContentClick}
      >
        {mediaType === 'image' && (
          <img src={url} alt="Media content" className="max-w-full max-h-[90vh] object-contain" />
        )}
        {mediaType === 'video' && (
          <video src={url} controls autoPlay className="max-w-full max-h-[90vh]" />
        )}
        {mediaType === 'audio' && (
          <audio src={url} controls autoPlay />
        )}
      </div>
    </div>
  );
};

export default MediaViewerModal;