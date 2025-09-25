import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import './FileUpload.css';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadProgress?: number;
  uploadStatus?: string;
  error?: string;
  compact?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  isUploading,
  uploadProgress = 0,
  uploadStatus = 'Uploading...',
  error,
  compact = false
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: false,
    disabled: isUploading
  });

  if (compact) {
    return (
      <div className="file-upload-compact">
        <div
          {...getRootProps()}
          className={`dropzone-compact ${isDragActive ? 'active' : ''} ${isUploading ? 'disabled' : ''}`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="spinner-small" />
          ) : (
            <Upload size={16} className="upload-icon-compact" />
          )}
          <span className="upload-text-compact">
            {isUploading ? uploadStatus : 'Upload .json file'}
          </span>
          {isUploading && uploadProgress > 0 && (
            <div className="progress-bar-compact">
              <div className="progress-fill-compact" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="file-upload-container">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${isUploading ? 'disabled' : ''} ${error ? 'error' : ''}`}
      >
        <input {...getInputProps()} />

        <div className="upload-content">
          {isUploading ? (
            <>
              <div className="spinner" />
              <p>{uploadStatus}</p>
              {uploadProgress > 0 && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="progress-text">{uploadProgress}%</span>
                </div>
              )}
            </>
          ) : (
            <>
              {isDragActive ? (
                <>
                  <Upload size={48} className="upload-icon active" />
                  <p>Drop your JSON file here</p>
                </>
              ) : (
                <>
                  <FileText size={48} className="upload-icon" />
                  <p><strong>Click to upload</strong> or drag and drop</p>
                  <p className="file-hint">JSON files only</p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};