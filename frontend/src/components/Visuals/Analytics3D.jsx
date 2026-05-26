import React, { useEffect, useRef, useState } from 'react';

export default function Analytics3D({ data = [] }) {
  const canvasRef = useRef(null);
  const [selectedBar, setSelectedBar] = useState(null);
  const rotationRef = useRef({ angleX: 0.45, angleY: 0.6, targetX: 0.45, targetY: 0.6, isDragging: false, lastX: 0, lastY: 0 });

  // Default mock data if no data provided
  const chartData = data.length > 0 ? data : [
    { label: 'Water Pollution', value: 85, color: '#06b6d4' },
    { label: 'Illegal Dumping', value: 42, color: '#ef4444' },
    { label: 'Mangrove Damage', value: 65, color: '#10b981' },
    { label: 'Flood Risk', value: 92, color: '#f59e0b' },
    { label: 'Coastal Erosion', value: 58, color: '#3b82f6' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    let width = (canvas.width = canvas.clientWidth);
    let height = (canvas.height = canvas.clientHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
    };

    const handleMouseDown = (e) => {
      rotationRef.current.isDragging = true;
      rotationRef.current.lastX = e.clientX;
      rotationRef.current.lastY = e.clientY;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (rotationRef.current.isDragging) {
        const dx = e.clientX - rotationRef.current.lastX;
        const dy = e.clientY - rotationRef.current.lastY;

        rotationRef.current.targetY += dx * 0.007;
        rotationRef.current.targetX += dy * 0.007;
        rotationRef.current.targetX = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, rotationRef.current.targetX));

        rotationRef.current.lastX = e.clientX;
        rotationRef.current.lastY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      rotationRef.current.isDragging = false;
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const camera = { fov: 400, z: 500 };

    const render = () => {
      // Damping
      rotationRef.current.angleX += (rotationRef.current.targetX - rotationRef.current.angleX) * 0.1;
      rotationRef.current.angleY += (rotationRef.current.targetY - rotationRef.current.angleY) * 0.1;

      // Project Function
      const project = (x, y, z) => {
        // Rotate Y
        let x1 = x * Math.cos(rotationRef.current.angleY) - z * Math.sin(rotationRef.current.angleY);
        let z1 = x * Math.sin(rotationRef.current.angleY) + z * Math.cos(rotationRef.current.angleY);

        // Rotate X
        let y2 = y * Math.cos(rotationRef.current.angleX) - z1 * Math.sin(rotationRef.current.angleX);
        let z2 = y * Math.sin(rotationRef.current.angleX) + z1 * Math.cos(rotationRef.current.angleX);

        const cz = z2 + camera.z;
        if (cz <= 0) return null;

        const scale = camera.fov / cz;
        return {
          x: x1 * scale + width / 2,
          y: y2 * scale + height / 2,
          scale,
        };
      };

      // Clear
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      // Draw 3D Grid Base
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      const baseSize = 250;
      const divisions = 8;
      const step = (baseSize * 2) / divisions;

      // Grid Y = 80 (bottom plane)
      for (let i = 0; i <= divisions; i++) {
        // Z lines
        let p1 = project(-baseSize + i * step, 80, -baseSize);
        let p2 = project(-baseSize + i * step, 80, baseSize);
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        // X lines
        p1 = project(-baseSize, 80, -baseSize + i * step);
        p2 = project(baseSize, 80, -baseSize + i * step);
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // Draw Bars
      const barWidth = 32;
      const spacing = 75;
      const startX = -((chartData.length - 1) * spacing) / 2;

      chartData.forEach((item, index) => {
        const bx = startX + index * spacing;
        const bz = 0;
        const barHeight = (item.value / 100) * 160;
        const by = 80 - barHeight; // Y is inverted in screen coordinates

        // Define the 8 vertices of the 3D Cuboid Bar
        const vertices = [
          { x: bx - barWidth / 2, y: 80, z: bz - barWidth / 2 }, // 0: Bottom-Left-Back
          { x: bx + barWidth / 2, y: 80, z: bz - barWidth / 2 }, // 1: Bottom-Right-Back
          { x: bx + barWidth / 2, y: 80, z: bz + barWidth / 2 }, // 2: Bottom-Right-Front
          { x: bx - barWidth / 2, y: 80, z: bz + barWidth / 2 }, // 3: Bottom-Left-Front
          { x: bx - barWidth / 2, y: by, z: bz - barWidth / 2 }, // 4: Top-Left-Back
          { x: bx + barWidth / 2, y: by, z: bz - barWidth / 2 }, // 5: Top-Right-Back
          { x: bx + barWidth / 2, y: by, z: bz + barWidth / 2 }, // 6: Top-Right-Front
          { x: bx - barWidth / 2, y: by, z: bz + barWidth / 2 }, // 7: Top-Left-Front
        ];

        // Project vertices
        const pVerts = vertices.map(v => project(v.x, v.y, v.z));
        if (pVerts.some(pv => pv === null)) return;

        // Draw Front Face (3 - 2 - 6 - 7)
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.moveTo(pVerts[3].x, pVerts[3].y);
        ctx.lineTo(pVerts[2].x, pVerts[2].y);
        ctx.lineTo(pVerts[6].x, pVerts[6].y);
        ctx.lineTo(pVerts[7].x, pVerts[7].y);
        ctx.closePath();
        ctx.fill();

        // Draw Right Face (2 - 1 - 5 - 6) with slight shade
        ctx.fillStyle = darkenColor(item.color, 0.8);
        ctx.beginPath();
        ctx.moveTo(pVerts[2].x, pVerts[2].y);
        ctx.lineTo(pVerts[1].x, pVerts[1].y);
        ctx.lineTo(pVerts[5].x, pVerts[5].y);
        ctx.lineTo(pVerts[6].x, pVerts[6].y);
        ctx.closePath();
        ctx.fill();

        // Draw Top Face (7 - 6 - 5 - 4) with light highlight
        ctx.fillStyle = lightenColor(item.color, 1.25);
        ctx.beginPath();
        ctx.moveTo(pVerts[7].x, pVerts[7].y);
        ctx.lineTo(pVerts[6].x, pVerts[6].y);
        ctx.lineTo(pVerts[5].x, pVerts[5].y);
        ctx.lineTo(pVerts[4].x, pVerts[4].y);
        ctx.closePath();
        ctx.fill();

        // Outline
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pVerts[3].x, pVerts[3].y);
        ctx.lineTo(pVerts[2].x, pVerts[2].y);
        ctx.lineTo(pVerts[6].x, pVerts[6].y);
        ctx.lineTo(pVerts[7].x, pVerts[7].y);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pVerts[2].x, pVerts[2].y);
        ctx.lineTo(pVerts[1].x, pVerts[1].y);
        ctx.lineTo(pVerts[5].x, pVerts[5].y);
        ctx.lineTo(pVerts[6].x, pVerts[6].y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pVerts[7].x, pVerts[7].y);
        ctx.lineTo(pVerts[6].x, pVerts[6].y);
        ctx.lineTo(pVerts[5].x, pVerts[5].y);
        ctx.lineTo(pVerts[4].x, pVerts[4].y);
        ctx.closePath();
        ctx.stroke();

        // Labels
        const lblProj = project(bx, 102, bz);
        if (lblProj) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(item.label, lblProj.x, lblProj.y);
          ctx.fillText(`${item.value}%`, lblProj.x, lblProj.y + 11);
        }
      });

      // Overlay drag instruction
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('🖱️ CLICK & SWIPE TO ROTATE GRAPH', 16, 22);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationId);
    };
  }, [data]);

  // Color helper utilities
  function darkenColor(hex, percent) {
    let num = parseInt(hex.replace("#",""), 16),
        amt = Math.round(2.55 * (100 - percent * 100)),
        R = (num >> 16) - amt,
        G = (num >> 8 & 0x00FF) - amt,
        B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R<0?0:R>255?255:R)*0x10000 + (G<0?0:G>255?255:G)*0x100 + (B<0?0:B>255?255:B)).toString(16).slice(1);
  }

  function lightenColor(hex, percent) {
    let num = parseInt(hex.replace("#",""), 16),
        amt = Math.round(2.55 * (percent * 100 - 100)),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<0?0:R>255?255:R)*0x10000 + (G<0?0:G>255?255:G)*0x100 + (B<0?0:B>255?255:B)).toString(16).slice(1);
  }

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden bg-slate-950/80 rounded-xl border border-slate-800 shadow-md">
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
    </div>
  );
}
