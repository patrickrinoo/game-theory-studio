'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Play, 
  Pause, 
  StopCircle, 
  SkipBack, 
  SkipForward, 
  Repeat,
  Camera,
  Film,
  Settings,
  FileImage,
  FileText,
  Loader2
} from 'lucide-react';

interface ExportAnimationControlsProps {
  chartRef?: React.RefObject<any>;
  animationData?: any[];
  onExport?: (format: ExportFormat, options: ExportOptions) => Promise<void>;
  onAnimationFrame?: (frameIndex: number) => void;
  isRecording?: boolean;
  className?: string;
}

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'gif' | 'json';

export interface ExportOptions {
  width?: number;
  height?: number;
  quality?: number;
  includeBackground?: boolean;
  scale?: number;
  filename?: string;
  animationDuration?: number;
  frameRate?: number;
}

interface AnimationState {
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  speed: number;
  loop: boolean;
}

interface RecordingState {
  isRecording: boolean;
  frames: string[];
  duration: number;
  frameRate: number;
}

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  width: 800,
  height: 600,
  quality: 1.0,
  includeBackground: true,
  scale: 1,
  filename: 'chart-export',
  animationDuration: 5000,
  frameRate: 30
};

export const ExportAnimationControls: React.FC<ExportAnimationControlsProps> = ({
  chartRef,
  animationData = [],
  onExport,
  onAnimationFrame,
  isRecording: externalIsRecording = false,
  className
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    currentFrame: 0,
    totalFrames: animationData.length,
    speed: 1.0,
    loop: true
  });
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    frames: [],
    duration: 0,
    frameRate: 30
  });

  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update total frames when animation data changes
  useEffect(() => {
    setAnimationState(prev => ({
      ...prev,
      totalFrames: animationData.length,
      currentFrame: Math.min(prev.currentFrame, animationData.length - 1)
    }));
  }, [animationData]);

  // Animation playback control
  const playAnimation = useCallback(() => {
    if (animationState.totalFrames === 0) return;

    setAnimationState(prev => ({ ...prev, isPlaying: true }));
    
    const frameInterval = 1000 / (30 * animationState.speed); // 30 FPS base
    
    animationIntervalRef.current = setInterval(() => {
      setAnimationState(prev => {
        const nextFrame = prev.currentFrame + 1;
        
        if (nextFrame >= prev.totalFrames) {
          if (prev.loop) {
            onAnimationFrame?.(0);
            return { ...prev, currentFrame: 0 };
          } else {
            // Stop animation
            if (animationIntervalRef.current) {
              clearInterval(animationIntervalRef.current);
              animationIntervalRef.current = null;
            }
            return { ...prev, isPlaying: false };
          }
        }
        
        onAnimationFrame?.(nextFrame);
        return { ...prev, currentFrame: nextFrame };
      });
    }, frameInterval);
  }, [animationState.speed, animationState.totalFrames, onAnimationFrame]);

  const pauseAnimation = useCallback(() => {
    setAnimationState(prev => ({ ...prev, isPlaying: false }));
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
  }, []);

  const stopAnimation = useCallback(() => {
    pauseAnimation();
    setAnimationState(prev => ({ ...prev, currentFrame: 0 }));
    onAnimationFrame?.(0);
  }, [pauseAnimation, onAnimationFrame]);

  const seekToFrame = useCallback((frameIndex: number) => {
    const clampedFrame = Math.max(0, Math.min(frameIndex, animationState.totalFrames - 1));
    setAnimationState(prev => ({ ...prev, currentFrame: clampedFrame }));
    onAnimationFrame?.(clampedFrame);
  }, [animationState.totalFrames, onAnimationFrame]);

  // Export functionality
  const exportChart = useCallback(async (format: ExportFormat) => {
    if (!chartRef?.current || !onExport) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      await onExport(format, exportOptions);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Reset progress after a delay
      setTimeout(() => {
        setExportProgress(0);
        setIsExporting(false);
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [chartRef, onExport, exportOptions]);

  // Recording functionality
  const startRecording = useCallback(() => {
    if (!chartRef?.current) return;

    setRecordingState(prev => ({
      ...prev,
      isRecording: true,
      frames: [],
      duration: 0
    }));

    const startTime = Date.now();
    const frameInterval = 1000 / recordingState.frameRate;

    recordingIntervalRef.current = setInterval(async () => {
      try {
        // Capture current chart state as SVG/Canvas
        const svgElement = chartRef.current?.querySelector('svg');
        if (svgElement) {
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          canvas.width = exportOptions.width || 800;
          canvas.height = exportOptions.height || 600;
          
          img.onload = () => {
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            const frameData = canvas.toDataURL('image/png');
            
            setRecordingState(prev => ({
              ...prev,
              frames: [...prev.frames, frameData],
              duration: Date.now() - startTime
            }));
          };
          
          img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        }
      } catch (error) {
        console.error('Frame capture failed:', error);
      }
    }, frameInterval);
  }, [chartRef, recordingState.frameRate, exportOptions.width, exportOptions.height]);

  const stopRecording = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    setRecordingState(prev => ({ ...prev, isRecording: false }));
  }, []);

  const generateGIF = useCallback(async () => {
    if (recordingState.frames.length === 0) return;

    setIsExporting(true);
    
    try {
      // Note: In a real implementation, you'd use a library like gif.js
      // For now, we'll create a simple animated data URL
      const gifData = {
        frames: recordingState.frames,
        duration: recordingState.duration,
        frameRate: recordingState.frameRate
      };
      
      // Create download
      const blob = new Blob([JSON.stringify(gifData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportOptions.filename || 'animation'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('GIF generation failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [recordingState, exportOptions.filename]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Export Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Format Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportChart('png')}
              disabled={isExporting}
              className="flex items-center gap-1"
            >
              <FileImage className="w-4 h-4" />
              PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportChart('svg')}
              disabled={isExporting}
              className="flex items-center gap-1"
            >
              <FileText className="w-4 h-4" />
              SVG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportChart('pdf')}
              disabled={isExporting}
              className="flex items-center gap-1"
            >
              <FileText className="w-4 h-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportChart('json')}
              disabled={isExporting}
              className="flex items-center gap-1"
            >
              <FileText className="w-4 h-4" />
              Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generateGIF}
              disabled={isExporting || recordingState.frames.length === 0}
              className="flex items-center gap-1"
            >
              <Film className="w-4 h-4" />
              GIF
            </Button>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Exporting... {exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Export Settings */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="export-width" className="text-sm">Width (px)</Label>
              <input
                id="export-width"
                type="number"
                value={exportOptions.width}
                onChange={(e) => setExportOptions(prev => ({ ...prev, width: Number(e.target.value) }))}
                className="w-full px-2 py-1 border rounded text-sm"
                min="100"
                max="4000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-height" className="text-sm">Height (px)</Label>
              <input
                id="export-height"
                type="number"
                value={exportOptions.height}
                onChange={(e) => setExportOptions(prev => ({ ...prev, height: Number(e.target.value) }))}
                className="w-full px-2 py-1 border rounded text-sm"
                min="100"
                max="4000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-filename" className="text-sm">Filename</Label>
              <input
                id="export-filename"
                type="text"
                value={exportOptions.filename}
                onChange={(e) => setExportOptions(prev => ({ ...prev, filename: e.target.value }))}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="chart-export"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-quality" className="text-sm">Quality</Label>
              <Select
                value={exportOptions.quality?.toString()}
                onValueChange={(value) => setExportOptions(prev => ({ ...prev, quality: Number(value) }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">Low (0.5x)</SelectItem>
                  <SelectItem value="1.0">Standard (1x)</SelectItem>
                  <SelectItem value="2.0">High (2x)</SelectItem>
                  <SelectItem value="3.0">Ultra (3x)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Animation Controls */}
      {animationData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Animation Controls
              </span>
              <Badge variant="outline">
                {animationState.totalFrames} frames
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Playback Controls */}
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={stopAnimation}
                disabled={animationState.currentFrame === 0 && !animationState.isPlaying}
              >
                <StopCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => seekToFrame(animationState.currentFrame - 1)}
                disabled={animationState.currentFrame === 0}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant={animationState.isPlaying ? "default" : "outline"}
                size="sm"
                onClick={animationState.isPlaying ? pauseAnimation : playAnimation}
                disabled={animationState.totalFrames === 0}
              >
                {animationState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => seekToFrame(animationState.currentFrame + 1)}
                disabled={animationState.currentFrame >= animationState.totalFrames - 1}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button
                variant={animationState.loop ? "default" : "outline"}
                size="sm"
                onClick={() => setAnimationState(prev => ({ ...prev, loop: !prev.loop }))}
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Scrubber */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Frame: {animationState.currentFrame + 1}</span>
                <span>Total: {animationState.totalFrames}</span>
              </div>
              <Slider
                value={[animationState.currentFrame]}
                onValueChange={([frame]) => seekToFrame(frame)}
                max={Math.max(0, animationState.totalFrames - 1)}
                step={1}
                className="w-full"
              />
            </div>

            {/* Speed Control */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Speed: {animationState.speed}x</Label>
                <Slider
                  value={[animationState.speed]}
                  onValueChange={([speed]) => setAnimationState(prev => ({ ...prev, speed }))}
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={animationState.loop}
                  onCheckedChange={(loop) => setAnimationState(prev => ({ ...prev, loop }))}
                  id="loop-animation"
                />
                <Label htmlFor="loop-animation" className="text-sm">Loop</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Recording & GIF Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant={recordingState.isRecording ? "destructive" : "default"}
                size="sm"
                onClick={recordingState.isRecording ? stopRecording : startRecording}
                className="flex items-center gap-1"
              >
                {recordingState.isRecording ? (
                  <>
                    <StopCircle className="w-4 h-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Start Recording
                  </>
                )}
              </Button>
              
              {recordingState.frames.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateGIF}
                  disabled={isExporting}
                  className="flex items-center gap-1"
                >
                  <Film className="w-4 h-4" />
                  Generate GIF
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant={recordingState.isRecording ? "destructive" : "outline"}>
                {recordingState.isRecording ? "Recording..." : "Ready"}
              </Badge>
              {recordingState.frames.length > 0 && (
                <Badge variant="outline">
                  {recordingState.frames.length} frames
                </Badge>
              )}
            </div>
          </div>

          {/* Recording Settings */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm">Frame Rate (FPS)</Label>
              <Select
                value={recordingState.frameRate.toString()}
                onValueChange={(value) => setRecordingState(prev => ({ ...prev, frameRate: Number(value) }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 FPS</SelectItem>
                  <SelectItem value="30">30 FPS</SelectItem>
                  <SelectItem value="60">60 FPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Duration</Label>
              <div className="text-sm text-gray-600">
                {recordingState.duration > 0 ? 
                  `${(recordingState.duration / 1000).toFixed(1)}s` : 
                  'Not recording'
                }
              </div>
            </div>
          </div>

          {/* Recording Info */}
          {recordingState.isRecording && (
            <Alert>
              <Camera className="h-4 w-4" />
              <AlertDescription>
                Recording in progress. All chart interactions and animations will be captured.
                Click "Stop Recording" when finished to generate frames for GIF export.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportAnimationControls; 