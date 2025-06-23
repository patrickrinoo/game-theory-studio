'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { useD3, D3ContainerProps, D3RenderFunction } from '@/hooks/use-d3';
import { ChartConfig, ChartTheme, AnimationConfig } from '@/lib/visualization-types';
import { cn } from '@/lib/utils';

// Default theme for game theory charts
export const defaultChartTheme: ChartTheme = {
  background: '#ffffff',
  gridColor: '#e5e7eb',
  textColor: '#374151',
  axisColor: '#6b7280',
  colors: [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ],
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 12,
};

export const defaultAnimationConfig: AnimationConfig = {
  duration: 500,
  easing: 'ease-out',
  delay: 0,
  stagger: 50,
};

export interface BaseChartProps<T = any> extends Omit<D3ContainerProps, 'width' | 'height'> {
  data: T;
  renderFunction: D3RenderFunction<T>;
  config?: Partial<ChartConfig>;
  className?: string;
  loading?: boolean;
  error?: string;
  onError?: (error: Error) => void;
  'data-testid'?: string;
}

export interface BaseChartRef {
  exportChart: (format: 'png' | 'svg' | 'pdf' | 'json', options?: any) => Promise<void>;
  redraw: () => void;
  dimensions: {
    width: number;
    height: number;
    innerWidth: number;
    innerHeight: number;
  };
  getSVGElement: () => SVGSVGElement | null;
  getChartData: () => any;
}

/**
 * Base chart component that provides common D3 functionality
 * Serves as foundation for all game theory visualizations
 */
export const BaseChart = forwardRef<BaseChartRef, BaseChartProps>(
  (
    {
      data,
      renderFunction,
      config = {},
      className,
      loading = false,
      error,
      onError,
      'data-testid': testId,
      ...d3Props
    },
    ref
  ) => {
    // Merge default config with provided config
    const mergedConfig: ChartConfig = {
      width: 800,
      height: 600,
      margin: { top: 20, right: 20, bottom: 60, left: 60 },
      responsive: true,
      theme: defaultChartTheme,
      animation: defaultAnimationConfig,
      ...config,
    };

    // Enhanced render function that includes theme and error handling
    const enhancedRenderFunction: D3RenderFunction = React.useCallback(
      (svg, chartData, props) => {
        try {
                     // Apply theme to SVG
           svg
             .style('background-color', mergedConfig.theme?.background || defaultChartTheme.background)
             .style('font-family', mergedConfig.theme?.fontFamily || defaultChartTheme.fontFamily)
             .style('font-size', `${mergedConfig.theme?.fontSize || defaultChartTheme.fontSize}px`);

          // Call the original render function
          renderFunction(svg, chartData, props);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Chart rendering failed');
          console.error('Chart rendering error:', error);
          onError?.(error);

          // Clear SVG and show error message
          svg.selectAll('*').remove();
          svg
            .append('text')
            .attr('x', props.width! / 2)
            .attr('y', props.height! / 2)
            .attr('text-anchor', 'middle')
                         .attr('fill', mergedConfig.theme?.textColor || defaultChartTheme.textColor)
            .style('font-size', '14px')
            .text('Chart rendering failed');
        }
      },
      [renderFunction, mergedConfig, onError]
    );

    const { ref: svgRef, containerRef, dimensions } = useD3({
      data,
      renderFunction: enhancedRenderFunction,
      width: mergedConfig.width,
      height: mergedConfig.height,
      margin: mergedConfig.margin,
      responsive: mergedConfig.responsive,
      dependencies: [mergedConfig],
    });

    // Enhanced export chart functionality
    const exportChart = React.useCallback(
      async (format: 'png' | 'svg' | 'pdf' | 'json', options: any = {}) => {
        if (!svgRef.current) return;

        try {
          const svgElement = svgRef.current;
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const filename = options.filename || 'chart';
          const scale = options.scale || 1;
          const quality = options.quality || 1.0;

          if (format === 'svg') {
            // Download SVG directly
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.svg`;
            link.click();
            URL.revokeObjectURL(url);
          } else if (format === 'png') {
            // Convert to PNG using canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const img = new Image();

            const exportWidth = (options.width || dimensions.width) * scale;
            const exportHeight = (options.height || dimensions.height) * scale;

            canvas.width = exportWidth;
            canvas.height = exportHeight;

            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
              if (options.includeBackground !== false) {
                ctx.fillStyle = mergedConfig.theme?.background || '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
              ctx.drawImage(img, 0, 0, exportWidth, exportHeight);

              canvas.toBlob((blob) => {
                if (blob) {
                  const downloadUrl = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = downloadUrl;
                  link.download = `${filename}.png`;
                  link.click();
                  URL.revokeObjectURL(downloadUrl);
                }
              }, 'image/png', quality);

              URL.revokeObjectURL(url);
            };

            img.src = url;
          } else if (format === 'pdf') {
            // For PDF export, we'll use canvas to PNG first, then embed in PDF
            // This is a simplified implementation - in production, you'd use jsPDF
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const img = new Image();

            canvas.width = options.width || dimensions.width;
            canvas.height = options.height || dimensions.height;

            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
              ctx.fillStyle = mergedConfig.theme?.background || '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);

              // Create a simple PDF-like structure (base64 encoded image for demo)
              const imgData = canvas.toDataURL('image/png');
              const pdfContent = {
                format: 'pdf',
                image: imgData,
                width: canvas.width,
                height: canvas.height,
                timestamp: new Date().toISOString()
              };

              const blob = new Blob([JSON.stringify(pdfContent, null, 2)], { type: 'application/json' });
              const downloadUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = `${filename}.pdf.json`;
              link.click();
              URL.revokeObjectURL(downloadUrl);
              URL.revokeObjectURL(url);
            };

            img.src = url;
          } else if (format === 'json') {
            // Export chart data as JSON
            const exportData = {
              data,
              config: mergedConfig,
              dimensions,
              timestamp: new Date().toISOString(),
              format: 'taskmaster-chart-data',
              version: '1.0'
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}-data.json`;
            link.click();
            URL.revokeObjectURL(url);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Export failed');
          console.error('Chart export error:', error);
          onError?.(error);
        }
      },
      [svgRef, dimensions, mergedConfig, onError, data]
    );

    // Expose imperative API
    useImperativeHandle(
      ref,
      () => ({
        exportChart,
        redraw: () => {
          // Trigger re-render by updating a dependency
          if (svgRef.current) {
            enhancedRenderFunction(
              { selectAll: () => ({ remove: () => {} }) } as any,
              data,
              mergedConfig
            );
          }
        },
        dimensions,
        getSVGElement: () => svgRef.current,
        getChartData: () => data,
      }),
      [exportChart, dimensions, enhancedRenderFunction, data, mergedConfig]
    );

    if (error) {
      return (
        <div
          className={cn(
            'flex items-center justify-center border border-red-200 bg-red-50 text-red-700 rounded-lg p-4',
            className
          )}
          data-testid={testId}
        >
          <div className="text-center">
            <div className="font-medium">Chart Error</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div
          className={cn(
            'flex items-center justify-center border border-gray-200 bg-gray-50 rounded-lg',
            className
          )}
          style={{ width: mergedConfig.width, height: mergedConfig.height }}
          data-testid={testId}
        >
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div className="text-gray-600">Loading chart...</div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={cn('relative w-full', className)}
        data-testid={testId}
      >
        <svg
          ref={svgRef}
          className="w-full h-auto"
          style={{
            display: 'block',
            margin: '0 auto',
          }}
        />
      </div>
    );
  }
);

BaseChart.displayName = 'BaseChart';

export default BaseChart; 