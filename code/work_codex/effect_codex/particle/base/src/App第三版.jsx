import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three-stdlib';

// === Shader 保持不变 ===
const glowingParticleShader = {
  vertex: `
    attribute float size;
    varying vec3 vColor;
    uniform float uPixelRatio;
    uniform float uTime;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      float atten = 300.0 / -mvPosition.z;
      gl_PointSize = size * uPixelRatio * atten;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragment: `
    varying vec3 vColor;
    void main() {
      vec2 uv = gl_PointCoord - vec2(0.5);
      float d = length(uv);
      if (d > 0.5) discard;
      float glow = 1.0 - smoothstep(0.1, 0.5, d);
      gl_FragColor = vec4(vColor, glow); // 简单发光
    }
  `
};

// === 核心组件 ===
const InteractiveModelParticles = ({ url }) => {
  const { scene } = useGLTF(url);
  const pointsRef = useRef();
  
  // 动画与交互状态
  const progressRef = useRef(0); // 入场进度
  
  // 创建一个数学平面，用于捕获鼠标在 3D 空间的位置
  // Plane(normal, constant): 法向量 (0,0,1) 表示面朝屏幕前方，位于 Z=0 处
  const interactionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const mouseVector = useRef(new THREE.Vector3());

  // 新增：用于记录鼠标是否在移动
  const mouseActivity = useRef(0); 
  // === 新增监听器：鼠标动，能量满 ===
  useEffect(() => {
    const handleMouseMove = () => {
      // 只要鼠标动了，重置活跃度为 1
      mouseActivity.current = 1.0;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  // === 1. 粒子数据生成 (保留了你的自然溢出逻辑) ===
  const { startPositions, targetPositions, colors, sizes } = useMemo(() => {
    let mesh = null;
    scene.traverse((child) => {
      if (child.isMesh && !mesh) mesh = child;
    });
    if (!mesh) return {};

    mesh.geometry.rotateX(Math.PI / 2);
    mesh.geometry.scale(0.5,0.5,0.5);
    mesh.updateMatrix();

    const sampler = new MeshSurfaceSampler(mesh).build();
    const numParticles = 10000; // 粒子数量
    
    const startPos = new Float32Array(numParticles * 3);
    const targetPos = new Float32Array(numParticles * 3);
    const colorArr = new Float32Array(numParticles * 3);
    const sizeArr = new Float32Array(numParticles);

    const tempPos = new THREE.Vector3();
    const tempColor = new THREE.Color();
    
    // 颜色设置
    const colorStart = new THREE.Color("#c4d40f");
    const colorEnd = new THREE.Color("#c4d40f");
    const colorWhite = new THREE.Color("#c4d40f");

    mesh.geometry.computeBoundingBox();
    const { min, max } = mesh.geometry.boundingBox;
    const height = max.y - min.y || 1;
    const center = new THREE.Vector3();
    mesh.geometry.boundingBox.getCenter(center);

    for (let i = 0; i < numParticles; i++) {
      // A. 采样并添加自然溢出 (Your Logic)
      sampler.sample(tempPos);
      const r = Math.random();
      let scatterAmount = 0.05;
      let sizeFactor = 3.0;

      // 20% 的粒子做溢出效果
      if (r > 0.70) {
        scatterAmount = 0.5 + Math.random() * 12.0; // 溢出范围
        sizeFactor = 1.9; // 溢出粒子变小
      }

      // 球形随机偏移
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      targetPos[i * 3] = tempPos.x + Math.sin(phi) * Math.cos(theta) * scatterAmount;
      targetPos[i * 3 + 1] = tempPos.y + Math.sin(phi) * Math.sin(theta) * scatterAmount;
      targetPos[i * 3 + 2] = tempPos.z + Math.cos(phi) * scatterAmount;

      // B. 入场起点 (爆炸效果)
      startPos[i * 3] = center.x + (Math.random() - 0.5) * 30;
      startPos[i * 3 + 1] = center.y + (Math.random() - 0.5) * 30;
      startPos[i * 3 + 2] = center.z + (Math.random() - 0.5) * 30;

      // C. 颜色
      const t = (tempPos.y - min.y) / height;
      tempColor.lerpColors(colorStart, colorEnd, t);
      if (r > 0.80) tempColor.lerp(colorWhite, 0.4); // 溢出粒子更亮
      
      colorArr[i * 3] = tempColor.r;
      colorArr[i * 3 + 1] = tempColor.g;
      colorArr[i * 3 + 2] = tempColor.b;

      sizeArr[i] = (Math.random() * 0.08 + 0.02) * sizeFactor; 
    }

    return { 
      startPositions: startPos, 
      targetPositions: targetPos, 
      colors: colorArr, 
      sizes: sizeArr
    };
  }, [scene]);

  // === 2. 动画循环 (核心交互修改) ===
  useFrame((state, delta) => {
    if (!pointsRef.current || !targetPositions) return;

    // 1. 更新时间
    pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;

    // 2. 入场动画
    if (progressRef.current < 1) {
      progressRef.current += delta * 0.5;
      progressRef.current = Math.min(progressRef.current, 1);
    }
    const easeProgress = easeOutCubic(progressRef.current);

    // === 🟢 3. 关键修改：活跃度衰减 ===
    // 每一帧，活跃度自动减少 (lerp to 0)
    // 0.05 是衰减速度，数值越大，停下后恢复得越快
    mouseActivity.current = THREE.MathUtils.lerp(mouseActivity.current, 0, 0.05);


    // 4. 射线检测
    state.raycaster.setFromCamera(state.pointer, state.camera);
    const intersect = new THREE.Vector3();
    state.raycaster.ray.intersectPlane(interactionPlane, intersect);
    
    // 只有当活跃度 > 0.01 时才计算排斥，否则省点性能
    const isInteracting = intersect && progressRef.current > 0.8 && mouseActivity.current > 0.01;

    // 5. 粒子位置更新
    const positions = pointsRef.current.geometry.attributes.position.array;
    const currentP = new THREE.Vector3();
    const targetP_Base = new THREE.Vector3();
    

    // === 参数调整区 ===
    // 1. 半径设大一点，让过渡更平滑
    const repelRadius = 50; 
    // 2. 力度也设大一点，保证中心绝对空白
    const maxRepelStrength = 1.0;

    for (let i = 0; i < positions.length; i += 3) {
      targetP_Base.set(
        THREE.MathUtils.lerp(startPositions[i], targetPositions[i], easeProgress),
        THREE.MathUtils.lerp(startPositions[i+1], targetPositions[i+1], easeProgress),
        THREE.MathUtils.lerp(startPositions[i+2], targetPositions[i+2], easeProgress)
      );

      currentP.set(positions[i], positions[i+1], positions[i+2]);

      if (isInteracting) {
        const dist = currentP.distanceTo(intersect);
        
        // 只有在范围内才计算，优化性能
        if (dist < repelRadius) {
          // === 🟢 核心修改：非线性柔和衰减 ===
          
          // 1. 归一化距离 (0.0 = 中心, 1.0 = 边缘)
          const normalizedDist = dist / repelRadius;
          
          // 2. 使用三次幂 (pow 3) 或 指数函数 来制造“柔和边缘”
          // 这种曲线在中心附近(0.0)数值很高，但还没到边缘(1.0)时就迅速降得很低
          // 这样粒子就不会在边缘处堆积成一个明显的圆环
          const falloff = Math.pow(1.0 - normalizedDist, 50.0); 
          
          // 3. 计算最终力度 (叠加鼠标活跃度)
          const finalForce = falloff * maxRepelStrength * mouseActivity.current;

          // 4. 施加力
          const dirX = currentP.x - intersect.x;
          const dirY = currentP.y - intersect.y;
          // Z轴稍微给少一点，让空洞看起来更像是在同一层面上推开
          const dirZ = (currentP.z - intersect.z) * 0.2; 
          
          const len = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ) || 1;
          
          // 增加一点点随机扰动，打破完美的圆形感
          // 利用粒子索引 i 来制造伪随机，让每个粒子受力稍微不同
          const noise = 1.0 + Math.sin(i * 132.4) * 0.2; 

          currentP.x += (dirX / len) * finalForce * noise;
          currentP.y += (dirY / len) * finalForce * noise;
          currentP.z += (dirZ / len) * finalForce * noise;
        }
      }

      // 弹性复位
      // 稍微降低复位速度 (0.08)，让空洞闭合得更有“液体感”
      currentP.lerp(targetP_Base, 0.08);

      positions[i] = currentP.x;
      positions[i + 1] = currentP.y;
      positions[i + 2] = currentP.z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!targetPositions) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={startPositions.length / 3}
          array={startPositions.slice()} 
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={glowingParticleShader.vertex}
        fragmentShader={glowingParticleShader.fragment}
        transparent
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uTime: { value: 0 }
        }}
      />
    </points>
  );
};

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={[1, 2]}>
        <OrbitControls enableDamping />
        <React.Suspense fallback={null}>
          <InteractiveModelParticles url="./logo3.glb" />
        </React.Suspense>
      </Canvas>
    </div>
  );
}