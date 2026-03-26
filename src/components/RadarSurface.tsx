import { useEffect, useRef, useState } from 'react';

interface Props {
  taskBias?: number;
}

const VERTEX_SHADER = `
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uTaskBias;

const float PI = 3.141592653589793;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float ring(float radius, float thickness, float dist) {
  return smoothstep(radius + thickness, radius, dist) - smoothstep(radius, radius - thickness, dist);
}

float arcDifference(float a, float b) {
  return abs(atan(sin(a - b), cos(a - b)));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= uResolution.x / uResolution.y;

  float r = length(p);
  float angle = atan(p.y, p.x);
  float vignette = smoothstep(1.35, 0.25, r);
  float hub = smoothstep(0.22, 0.0, r);

  float ringField = 0.0;
  ringField += ring(0.18, 0.006, r) * 0.55;
  ringField += ring(0.34, 0.007, r) * 0.65;
  ringField += ring(0.50, 0.008, r) * 0.72;
  ringField += ring(0.66, 0.009, r) * 0.76;
  ringField += ring(0.82, 0.010, r) * 0.72;
  ringField += ring(0.98, 0.014, r) * 0.55;

  vec2 grid = abs(fract((p + 1.0) * vec2(10.0, 10.0)) - 0.5);
  float gridLines = (1.0 - smoothstep(0.45, 0.50, min(grid.x, grid.y))) * 0.18;

  float axisLines = (1.0 - smoothstep(0.0, 0.01, abs(p.x))) * 0.25;
  axisLines += (1.0 - smoothstep(0.0, 0.01, abs(p.y))) * 0.25;

  float terrainNoise = noise(p * 8.0 + vec2(uTime * 0.03, -uTime * 0.04));
  float cloudNoise = noise(p * 18.0 - vec2(uTime * 0.08, uTime * 0.06));
  float scanlines = sin(uv.y * uResolution.y * 0.95) * 0.04 + 0.96;

  float sweepAngle = uTime * 0.52;
  float sweep = smoothstep(0.55, 0.0, arcDifference(angle, sweepAngle));
  sweep *= smoothstep(1.10, 0.08, r) * (1.0 - r * 0.48);

  float sweepEcho = smoothstep(0.95, 0.0, arcDifference(angle, sweepAngle - 0.26));
  sweepEcho *= smoothstep(1.05, 0.20, r) * 0.35;

  float secondaryAngle = uTime * -0.18 + PI * 0.38;
  float secondarySweep = smoothstep(0.40, 0.0, arcDifference(angle, secondaryAngle));
  secondarySweep *= smoothstep(0.75, 0.18, r) * 0.18;

  float horizon = smoothstep(-0.9, 0.35, p.y) * 0.12;
  float topGlow = smoothstep(1.05, -0.2, p.y) * 0.06;

  vec3 bg = vec3(0.010, 0.020, 0.024);
  vec3 depth = vec3(0.014, 0.055, 0.062) + terrainNoise * vec3(0.015, 0.020, 0.018);
  vec3 radarTint = mix(vec3(0.26, 0.88, 0.50), vec3(0.78, 0.17, 0.20), uTaskBias);
  vec3 sweepTint = mix(vec3(0.36, 0.86, 1.00), vec3(0.94, 0.24, 0.28), uTaskBias * 0.8);

  vec3 color = mix(bg, depth, vignette);
  color += radarTint * ringField * 0.54;
  color += radarTint * gridLines * 0.26;
  color += radarTint * axisLines * 0.38;
  color += radarTint * horizon;
  color += vec3(0.06, 0.10, 0.12) * cloudNoise * vignette * 0.30;
  color += sweepTint * sweep * 0.95;
  color += sweepTint * sweepEcho * 0.42;
  color += vec3(0.30, 0.95, 0.70) * secondarySweep;
  color += vec3(0.22, 0.28, 0.35) * hub * 0.22;
  color += topGlow;

  color *= scanlines;
  color *= smoothstep(1.30, 0.42, r);
  color += vec3(0.01, 0.012, 0.013) * (1.0 - vignette);

  gl_FragColor = vec4(color, 0.96);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create shader.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(info);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  if (!program) {
    throw new Error('Failed to create program.');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? 'Unknown program linking error.';
    gl.deleteProgram(program);
    throw new Error(info);
  }

  return program;
}

export function RadarSurface({ taskBias = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [supportsWebGl, setSupportsWebGl] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
    });

    if (!gl) {
      setSupportsWebGl(false);
      return;
    }

    let frameId = 0;
    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    const buffer = gl.createBuffer();

    if (!buffer) {
      gl.deleteProgram(program);
      setSupportsWebGl(false);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
      ]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
    const timeLocation = gl.getUniformLocation(program, 'uTime');
    const taskLocation = gl.getUniformLocation(program, 'uTaskBias');

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, width, height);
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const start = performance.now();

    const render = (now: number) => {
      resize();

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, (now - start) * 0.001);
      gl.uniform1f(taskLocation, taskBias);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [taskBias]);

  if (!supportsWebGl) {
    return (
      <div
        className="absolute inset-0 pointer-events-none opacity-90"
        style={{
          background: `
            radial-gradient(circle at center, rgba(53,164,104,0.22) 0%, rgba(6,22,25,0.92) 56%, rgba(0,0,0,1) 100%),
            repeating-radial-gradient(circle at center, rgba(229,255,0,0.12) 0 2px, transparent 2px 72px),
            linear-gradient(180deg, rgba(45,61,59,0.18), rgba(0,0,0,0.82))
          `,
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none opacity-[0.96] [transform:perspective(1400px)_rotateX(5deg)_scale(1.04)]"
    />
  );
}
