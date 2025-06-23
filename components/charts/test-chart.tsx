'use client';

import React from 'react';
import * as d3 from 'd3';
import BaseChart, { BaseChartRef } from './base-chart';
import { D3RenderFunction } from '@/hooks/use-d3';

interface TestDataPoint {
  x: number;
  y: number;
  label: string;
}

interface TestChartProps {
  data: TestDataPoint[];
  width?: number;
  height?: number;
}

const testRenderFunction: D3RenderFunction<TestDataPoint[]> = (svg, data, props) => {
  const { width, height, margin } = props;
  
  if (!width || !height || !margin) return;
  
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.bottom - margin.top;

  // Create scales
  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.x) as [number, number])
    .range([margin.left, margin.left + innerWidth]);

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.y) as [number, number])
    .range([margin.top + innerHeight, margin.top]);

  // Create axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  // Add axes
  svg.append('g')
    .attr('transform', `translate(0, ${margin.top + innerHeight})`)
    .call(xAxis);

  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(yAxis);

  // Add axis labels
  svg.append('text')
    .attr('x', margin.left + innerWidth / 2)
    .attr('y', height - 10)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('X Axis');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(margin.top + innerHeight / 2))
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Y Axis');

  // Add data points
  svg.selectAll('.data-point')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'data-point')
    .attr('cx', d => xScale(d.x))
    .attr('cy', d => yScale(d.y))
    .attr('r', 4)
    .attr('fill', '#3b82f6')
    .attr('stroke', '#1d4ed8')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      // Show tooltip
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 6)
        .attr('fill', '#ef4444');

      // Add tooltip text
      svg.append('text')
        .attr('id', 'tooltip')
        .attr('x', xScale(d.x) + 10)
        .attr('y', yScale(d.y) - 10)
        .attr('fill', '#374151')
        .style('font-size', '11px')
        .text(`${d.label}: (${d.x}, ${d.y})`);
    })
    .on('mouseout', function() {
      // Hide tooltip
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 4)
        .attr('fill', '#3b82f6');

      svg.select('#tooltip').remove();
    });

  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text('D3.js Integration Test Chart');
};

export const TestChart: React.FC<TestChartProps> = ({ 
  data, 
  width = 600, 
  height = 400 
}) => {
  const chartRef = React.useRef<BaseChartRef>(null);

  const handleExport = async (format: 'png' | 'svg') => {
    if (chartRef.current) {
      await chartRef.current.exportChart(format);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => handleExport('png')}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Export PNG
        </button>
        <button
          onClick={() => handleExport('svg')}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Export SVG
        </button>
        <button
          onClick={() => chartRef.current?.redraw()}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
        >
          Redraw
        </button>
      </div>
      
      <BaseChart
        ref={chartRef}
        data={data}
        renderFunction={testRenderFunction}
        config={{
          width,
          height,
          margin: { top: 40, right: 20, bottom: 50, left: 50 },
          responsive: true,
        }}
        className="border border-gray-300 rounded-lg"
      />
    </div>
  );
};

export default TestChart; 