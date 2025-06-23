import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

export interface D3ContainerProps {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  responsive?: boolean;
}

export interface D3RenderFunction<T = any> {
  (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, data: T, props: D3ContainerProps): void;
}

export interface UseD3Options<T = any> extends D3ContainerProps {
  data: T;
  renderFunction: D3RenderFunction<T>;
  dependencies?: React.DependencyList;
}

/**
 * Custom hook for managing D3.js lifecycle with React
 * Handles SVG container setup, responsive design, and cleanup
 */
export function useD3<T = any>({
  data,
  renderFunction,
  width = 800,
  height = 600,
  margin = { top: 20, right: 20, bottom: 20, left: 20 },
  responsive = true,
  dependencies = []
}: UseD3Options<T>) {
  const ref = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Calculate inner dimensions
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.bottom - margin.top;

  // Render function that sets up the D3 visualization
  const render = useCallback(() => {
    if (!ref.current) return;

    const svg = d3.select(ref.current);
    
    // Clear previous content
    svg.selectAll("*").remove();
    
    // Set up dimensions
    let actualWidth = width;
    let actualHeight = height;
    
    if (responsive && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      actualWidth = containerRect.width || width;
      actualHeight = (actualWidth * height) / width; // Maintain aspect ratio
    }
    
    svg
      .attr('width', actualWidth)
      .attr('height', actualHeight)
      .attr('viewBox', `0 0 ${actualWidth} ${actualHeight}`)
      .style('max-width', '100%')
      .style('height', 'auto');

    // Create main group with margins
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Call the render function with the properly set up SVG
    renderFunction(svg, data, {
      width: actualWidth,
      height: actualHeight,
      margin,
      responsive
    });
  }, [data, renderFunction, width, height, margin, responsive, ...dependencies]);

  // Set up resize observer for responsive behavior
  useEffect(() => {
    if (!responsive || !containerRef.current) return;

    resizeObserverRef.current = new ResizeObserver(() => {
      render();
    });

    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [responsive, render]);

  // Render on data or configuration changes
  useEffect(() => {
    render();
  }, [render]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  return {
    ref,
    containerRef,
    dimensions: {
      width,
      height,
      innerWidth,
      innerHeight,
      margin
    }
  };
}

/**
 * Simplified hook for static D3 visualizations
 */
export function useD3Static<T = any>(
  data: T,
  renderFunction: D3RenderFunction<T>,
  options: Partial<D3ContainerProps> = {},
  dependencies: React.DependencyList = []
) {
  return useD3({
    data,
    renderFunction,
    responsive: false,
    ...options,
    dependencies
  });
}

/**
 * Hook for responsive D3 visualizations
 */
export function useD3Responsive<T = any>(
  data: T,
  renderFunction: D3RenderFunction<T>,
  options: Partial<D3ContainerProps> = {},
  dependencies: React.DependencyList = []
) {
  return useD3({
    data,
    renderFunction,
    responsive: true,
    ...options,
    dependencies
  });
} 