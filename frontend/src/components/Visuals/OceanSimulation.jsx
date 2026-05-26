import React, { useEffect, useRef, useState } from 'react';

export default function OceanSimulation() {
  const canvasRef = useRef(null);
  const [speedScale, setSpeedScale] = useState(1.5);
  const [showFlowLines, setShowFlowLines] = useState(true);
  const rotationRef = useRef({ angleX: 0.5, angleY: 0.35, targetX: 0.5, targetY: 0.35, isDragging: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    let width = (canvas.width = canvas.clientWidth);
    let height = (canvas.height = canvas.clientHeight);

    // Generate flow field particles
    const particleCount = 180;
    const particles = Array.from({ length: particleCount }, () => {
      const rx = (Math.random() - 0.5) * 500;
      const rz = (Math.random() - 0.5) * 500;
      return {
        x: rx,
        y: 0,
        z: rz,
        // Particle path trace history for drawing flow lines
        history: Array.from({ length: 5 }, () => ({ x: rx, y: 0, z: rz })),
        speed: Math.random() * 2 + 1,
        life: Math.random() * 150 + 50,
        maxLife: 200,
        color: Math.random() > 0.4 ? '#06b6d4' : '#3b82f6',
      };
    });

    // Tidal station beacons
    const stations = [
      { name: 'Station A', x: -160, z: -120, waterLevel: 2.1, status: 'normal' },
      { name: 'Station B', x: 120, z: -150, waterLevel: 3.4, status: 'warning' },
      { name: 'Station C', x: -80, z: 160, waterLevel: 1.8, status: 'normal' },
      { name: 'Station D', x: 180, z: 120, waterLevel: 4.2, status: 'critical' },
    ];

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
    };

    // Drag-to-rotate events
    const handleMouseDown = (e) => {
      rotationRef.current.isDragging = true;
      rotationRef.current.lastX = e.clientX;
      rotationRef.current.lastY = e.clientY;
    };

    const handleMouseMove = (e) => {
      if (!rotationRef.current.isDragging) return;
      const dx = e.clientX - rotationRef.current.lastX;
      const dy = e.clientY - rotationRef.current.lastY;

      rotationRef.current.targetY += dx * 0.007;
      rotationRef.current.targetX += dy * 0.007;

      // Cap pitch (X rotation)
      rotationRef.current.targetX = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, rotationRef.current.targetX));

      rotationRef.current.lastX = e.clientX;
      rotationRef.current.lastY = e.clientY;
    };

    const handleMouseUp = () => {
      rotationRef.current.isDragging = false;
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const camera = {
      fov: 380,
      z: 550,
    };

    let tick = 0;

    const render = () => {
      tick += 0.008;

      // Damping
      rotationRef.current.angleX += (rotationRef.current.targetX - rotationRef.current.angleX) * 0.1;
      rotationRef.current.angleY += (rotationRef.current.targetY - rotationRef.current.angleY) * 0.1;

      // Project function
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
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Radar scanning circles on ground plane
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
      ctx.lineWidth = 1;
      for (let r = 50; r <= 300; r += 50) {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.1) {
          const px = Math.cos(a) * r;
          const pz = Math.sin(a) * r;
          const proj = project(px, 0, pz);
          if (proj) {
            if (a === 0) ctx.moveTo(proj.x, proj.y);
            else ctx.lineTo(proj.x, proj.y);
          }
        }
        ctx.stroke();
      }

      // Compass Ticks
      ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.font = '9px monospace';
      [['N', 0, -220], ['S', 0, 220], ['E', 220, 0], ['W', -220, 0]].forEach(([label, cx, cz]) => {
        const proj = project(cx, 0, cz);
        if (proj) {
          ctx.fillText(label, proj.x - 3, proj.y + 3);
        }
      });

      // 1. Move and draw particles (Water current paths)
      particles.forEach((p) => {
        p.life -= 1;
        
        // Custom flow field mathematical formulas (curl noise emulation)
        // Creates gorgeous winding current patterns
        const angle = Math.sin(p.z * 0.005) * Math.PI + Math.cos(p.x * 0.005) * Math.PI;
        
        p.x += Math.cos(angle) * p.speed * speedScale * 0.45;
        p.z += Math.sin(angle) * p.speed * speedScale * 0.45;
        
        // Add tiny wave height sway
        p.y = Math.sin(p.x * 0.02 + tick * 5) * 8 + Math.cos(p.z * 0.02 + tick * 4) * 8;

        // Reset if lifetime ends or out of bounds
        if (p.life <= 0 || Math.abs(p.x) > 280 || Math.abs(p.z) > 280) {
          p.x = (Math.random() - 0.5) * 450;
          p.z = (Math.random() - 0.5) * 450;
          p.life = Math.random() * 150 + 50;
          p.history = Array.from({ length: 5 }, () => ({ x: p.x, y: p.y, z: p.z }));
        }

        // Maintain tail history
        p.history.push({ x: p.x, y: p.y, z: p.z });
        p.history.shift();

        const proj = project(p.x, p.y, p.z);
        if (!proj) return;

        // Draw Flow Lines
        if (showFlowLines && p.history.length > 1) {
          ctx.beginPath();
          const startProj = project(p.history[0].x, p.history[0].y, p.history[0].z);
          if (startProj) {
            ctx.moveTo(startProj.x, startProj.y);
            for (let j = 1; j < p.history.length; j++) {
              const ptProj = project(p.history[j].x, p.history[j].y, p.history[j].z);
              if (ptProj) ctx.lineTo(ptProj.x, ptProj.y);
            }
            
            ctx.strokeStyle = p.color === '#06b6d4' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(59, 130, 246, 0.12)';
            ctx.lineWidth = 1.2 * proj.scale * 0.003;
            ctx.stroke();
          }
        }

        // Draw Particle head
        ctx.beginPath();
        const pSize = (p.life / p.maxLife) * 2.8 * proj.scale * 0.003;
        ctx.arc(proj.x, proj.y, Math.max(0.5, pSize), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      // 2. Render Station beacons
      stations.forEach((s) => {
        // Elevate water height dynamically
        const beaconY = -s.waterLevel * 12 + Math.sin(tick * 3 + s.x) * 4;
        const baseProj = project(s.x, 0, s.z);
        const topProj = project(s.x, beaconY, s.z);

        if (!baseProj || !topProj) return;

        // Draw structural connector line
        ctx.beginPath();
        ctx.moveTo(baseProj.x, baseProj.y);
        ctx.lineTo(topProj.x, topProj.y);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw base anchor circle
        ctx.beginPath();
        ctx.arc(baseProj.x, baseProj.y, 4 * baseProj.scale * 0.002, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        // Color mapped to status
        let statusColor = '#10b981'; // normal
        if (s.status === 'warning') statusColor = '#f59e0b';
        if (s.status === 'critical') statusColor = '#ef4444';

        // Draw glowing top beacon sphere
        ctx.beginPath();
        const rad = 6 * topProj.scale * 0.003;
        ctx.arc(topProj.x, topProj.y, Math.max(2, rad), 0, Math.PI * 2);
        ctx.fillStyle = statusColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = statusColor;
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '9px monospace';
        ctx.fillText(`${s.name} (${s.waterLevel.toFixed(1)}m)`, topProj.x + 8, topProj.y + 3);
      });

      // Overlay Instructions
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '10px monospace';
      ctx.fillText('🖱️ CLICK + DRAG TO ROTATE CURRENT FIELD', 16, 26);

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
  }, [speedScale, showFlowLines]);

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden bg-slate-950 rounded-xl border border-blue-500/10 shadow-lg">
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
      
      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-[11px] font-mono text-gray-300">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showFlowLines}
            onChange={(e) => setShowFlowLines(e.target.checked)}
            className="rounded bg-slate-950 border-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0"
          />
          FLOW_LINES
        </label>
        
        <div className="h-3 w-px bg-slate-800"></div>

        <div className="flex items-center gap-1">
          <span>VELOCITY:</span>
          <button
            onClick={() => setSpeedScale(prev => Math.max(0.5, prev - 0.5))}
            className="px-1.5 py-0.5 bg-slate-950 rounded hover:bg-slate-800 border border-slate-800"
          >
            -
          </button>
          <span className="w-6 text-center text-cyan-400 font-semibold">{speedScale.toFixed(1)}x</span>
          <button
            onClick={() => setSpeedScale(prev => Math.min(3.5, prev + 0.5))}
            className="px-1.5 py-0.5 bg-slate-950 rounded hover:bg-slate-800 border border-slate-800"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
